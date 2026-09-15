import type { CommandHandler, CommandHandlers } from './commands.js';
import type { GameCommand, RailAnchor } from './ports.js';
import { allocateId, type CubicCurve, type GameState, type Id, type RailEdge, type Vec3 } from '../domain/model.js';
import { certifyCurve, tangentCompatible } from '../rail/constraints.js';
import { compileCurve, distance, pointAt, type TrackGeometry } from '../rail/geometry.js';
import { engineeringSpans, quoteTrack } from '../rail/planner.js';
import { postExpense } from '../simulation/finance.js';
import {trackClass} from '../content/track-classes.js';
import {requireEngineeringRulesVersion} from '../content/engineering-rules.js';

type BuildTrack=Extract<GameCommand,{type:'buildTrack'}>;
type BuildAlignment=Extract<GameCommand,{type:'buildAlignment'}>;
type AnchorPlan=
  | {kind:'node';nodeId:Id<'node'>}
  | {kind:'new';position:Vec3}
  | {kind:'split';position:Vec3;edgeId:Id<'edge'>;t:number};

const reverseCurve=(curve:CubicCurve):CubicCurve=>({p0:curve.p3,p1:curve.p2,p2:curve.p1,p3:curve.p0});
const squared=(a:Vec3,b:Vec3)=>(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2;
const splitCurve=(curve:CubicCurve,t:number):[CubicCurve,CubicCurve]=>{
  const mix=(a:Vec3,b:Vec3):Vec3=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  const a=mix(curve.p0,curve.p1),b=mix(curve.p1,curve.p2),c=mix(curve.p2,curve.p3),d=mix(a,b),e=mix(b,c),p=mix(d,e);
  return [{p0:curve.p0,p1:a,p2:d,p3:p},{p0:p,p1:e,p2:c,p3:curve.p3}];
};

function nearestParameter(geometry:TrackGeometry,target:Vec3):{t:number;distanceM:number}|null {
  let bestIndex=0,best=Infinity;
  for(let i=0;i<geometry.samples.length;i++) {const value=squared(geometry.samples[i]!.position,target);if(value<best){best=value;bestIndex=i;}}
  let lo=geometry.samples[Math.max(0,bestIndex-1)]!.t,hi=geometry.samples[Math.min(geometry.samples.length-1,bestIndex+1)]!.t;
  for(let i=0;i<42;i++) {const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(squared(pointAt(geometry.curve,a),target)<squared(pointAt(geometry.curve,b),target))hi=b;else lo=a;}
  const t=(lo+hi)/2,position=pointAt(geometry.curve,t);
  if(distance(position,target)>.001||t<=1e-7||t>=1-1e-7)return null;
  let sampleIndex=1;while(sampleIndex<geometry.samples.length&&geometry.samples[sampleIndex]!.t<t)sampleIndex++;
  const before=geometry.samples[sampleIndex-1]!,after=geometry.samples[sampleIndex]!;
  const distanceM=before.distanceM+(after.distanceM-before.distanceM)*(t-before.t)/(after.t-before.t);
  return {t,distanceM};
}

function planAnchor(state:GameState,anchor:RailAnchor,endpoint:Vec3):AnchorPlan {
  if('nodeId' in anchor) {
    const node=state.railway.nodes.find(candidate=>candidate.id===anchor.nodeId)!;
    if(distance(node.position,endpoint)>.001)throw new Error('Curve endpoint differs from rail anchor');
    return {kind:'node',nodeId:node.id};
  }
  if(distance(anchor.position,endpoint)>.001)throw new Error('Curve endpoint differs from rail anchor');
  const node=state.railway.nodes.find(candidate=>distance(candidate.position,anchor.position)<=.001);
  if(node)return {kind:'node',nodeId:node.id};
  for(const edge of state.railway.edges) {
    const nearest=nearestParameter(compileCurve(edge.curve),anchor.position);
    if(nearest)return {kind:'split',position:pointAt(edge.curve,nearest.t),edgeId:edge.id,t:nearest.t};
  }
  return {kind:'new',position:structuredClone(anchor.position)};
}

function requireTerminalTangent(state:GameState,nodeId:Id<'node'>,curve:CubicCurve,atStart:boolean):void {
  const incident=state.railway.edges.filter(edge=>edge.from===nodeId||edge.to===nodeId);
  if(incident.length!==1)return;
  const edge=incident[0]!;
  if(atStart) {
    const incoming=edge.from===nodeId?reverseCurve(edge.curve):edge.curve;
    if(!tangentCompatible(incoming,curve))throw new Error('Track is not tangent-compatible at its start');
  } else {
    const outgoing=edge.from===nodeId?edge.curve:reverseCurve(edge.curve);
    if(!tangentCompatible(curve,outgoing))throw new Error('Track is not tangent-compatible at its end');
  }
}

function splitInfrastructure(state:GameState,oldEdge:RailEdge,left:RailEdge,right:RailEdge,t:number):void {
  const infrastructure=state.operations.infrastructure[oldEdge.id];
  if(!infrastructure)return;
  const original=compileCurve(oldEdge.curve),leftLength=compileCurve(left.curve).lengthM,rightLength=compileCurve(right.curve).lengthM;
  let index=1;while(index<original.samples.length&&original.samples[index]!.t<t)index++;
  const before=original.samples[index-1]!,after=original.samples[index]!;
  const splitAt=before.distanceM+(after.distanceM-before.distanceM)*(t-before.t)/(after.t-before.t),total=original.lengthM;
  const map=(side:'left'|'right')=>infrastructure.spans.flatMap(span=>{
    const start=side==='left'?span.startM:Math.max(span.startM,splitAt),end=side==='left'?Math.min(span.endM,splitAt):span.endM;
    if(end-start<=1e-7)return [];
    const length=side==='left'?leftLength:rightLength,base=side==='left'?0:splitAt,range=side==='left'?splitAt:total-splitAt;
    return [{startM:(start-base)/range*length,endM:(end-base)/range*length,kind:span.kind}];
  });
  const leftCost=Math.round(infrastructure.constructionCost*leftLength/(leftLength+rightLength));
  const leftUpkeep=Math.round(infrastructure.maintenancePerDay*leftLength/(leftLength+rightLength));
  const leftElectrificationCost=Math.round(infrastructure.electrificationCost*leftLength/(leftLength+rightLength));
  const leftElectrificationUpkeep=Math.round(infrastructure.electrificationMaintenancePerDay*leftLength/(leftLength+rightLength));
  delete state.operations.infrastructure[oldEdge.id];
  state.operations.infrastructure[left.id]={spans:map('left'),constructionCost:leftCost,maintenancePerDay:leftUpkeep,electrified:infrastructure.electrified,electrificationCost:leftElectrificationCost,electrificationMaintenancePerDay:leftElectrificationUpkeep};
  state.operations.infrastructure[right.id]={spans:map('right'),constructionCost:infrastructure.constructionCost-leftCost,maintenancePerDay:infrastructure.maintenancePerDay-leftUpkeep,electrified:infrastructure.electrified,electrificationCost:infrastructure.electrificationCost-leftElectrificationCost,electrificationMaintenancePerDay:infrastructure.electrificationMaintenancePerDay-leftElectrificationUpkeep};
}

function commitAnchor(state:GameState,plan:AnchorPlan,createdIds:string[]):Id<'node'> {
  if(plan.kind==='node')return plan.nodeId;
  const nodeId=allocateId(state,'node');state.railway.nodes.push({id:nodeId,position:structuredClone(plan.position)});createdIds.push(nodeId);
  if(plan.kind==='new')return nodeId;
  const edgeIndex=state.railway.edges.findIndex(edge=>edge.id===plan.edgeId),oldEdge=state.railway.edges[edgeIndex]!;
  const [leftCurve,rightCurve]=splitCurve(oldEdge.curve,plan.t),leftId=allocateId(state,'edge'),rightId=allocateId(state,'edge');
  const left={...oldEdge,id:leftId,to:nodeId,curve:leftCurve},right={...oldEdge,id:rightId,from:nodeId,curve:rightCurve};
  state.railway.edges.splice(edgeIndex,1,left,right);splitInfrastructure(state,oldEdge,left,right,plan.t);createdIds.push(leftId,rightId);
  return nodeId;
}

export const buildTrackHandler:CommandHandler<BuildTrack>=(state,command,context)=>{
  requireEngineeringRulesVersion(command.rulesVersion);const definition=trackClass(command.trackClassId);
  const geometry=compileCurve(command.curve),certificate=certifyCurve(command.curve,definition.constraints),quote=quoteTrack(geometry,context.terrain,definition.constraints,definition.costMultiplier);
  if(!certificate.valid||!quote.valid)throw new Error([...certificate.reasons,...quote.reasons].join(' · '));
  if(quote.cost!==command.quotedCost)throw new Error('Track quote has changed');
  if(state.company.cash<quote.cost)throw new Error('Insufficient funds');
  const fromPlan=planAnchor(state,command.from,command.curve.p0),toPlan=planAnchor(state,command.to,command.curve.p3);
  if(fromPlan.kind==='node')requireTerminalTangent(state,fromPlan.nodeId,command.curve,true);
  if(toPlan.kind==='node')requireTerminalTangent(state,toPlan.nodeId,command.curve,false);
  if(fromPlan.kind==='split'&&toPlan.kind==='split'&&fromPlan.edgeId===toPlan.edgeId)throw new Error('Both anchors cannot split the same edge');
  if(state.trains.some(train=>train.motion.path.some(leg=>(fromPlan.kind==='split'&&leg.edgeId===fromPlan.edgeId)||(toPlan.kind==='split'&&leg.edgeId===toPlan.edgeId))))throw new Error('Cannot split track used by a train path');
  if(state.operations.reservations.some(item=>(fromPlan.kind==='split'&&item.edgeId===fromPlan.edgeId)||(toPlan.kind==='split'&&item.edgeId===toPlan.edgeId)))throw new Error('Cannot split reserved track');
  const allocations=1+(fromPlan.kind==='node'?0:1)+(toPlan.kind==='node'?0:1)+(fromPlan.kind==='split'?2:0)+(toPlan.kind==='split'?2:0)+1;
  if(state.nextEntityId+allocations>Number.MAX_SAFE_INTEGER)throw new Error('Invalid ID counter');
  const createdIds:string[]=[],from=commitAnchor(state,fromPlan,createdIds),to=commitAnchor(state,toPlan,createdIds);
  if(from===to)throw new Error('Track endpoints must be different nodes');
  const edgeId=allocateId(state,'edge');
  state.railway.edges.push({id:edgeId,from,to,curve:structuredClone(command.curve),speedLimitMps:definition.speedLimitMps,ownerId:state.company.id});
  const spans=engineeringSpans(quote).map(({startM,endM,kind})=>({startM,endM,kind}));
  state.operations.infrastructure[edgeId]={spans,constructionCost:quote.cost,maintenancePerDay:Math.max(1,Math.round(quote.cost*.00005)),electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};
  postExpense(state,'construction',quote.cost,edgeId,'Track construction');
  state.railway.revision++;
  createdIds.push(edgeId);
  return {createdIds};
};

export const buildAlignmentHandler:CommandHandler<BuildAlignment>=(state,command,context)=>{
  requireEngineeringRulesVersion(command.rulesVersion);const definition=trackClass(command.trackClassId);
  const curves=command.curves.map(curve=>structuredClone(curve)),geometries=curves.map(curve=>compileCurve(curve)),certificates=curves.map(curve=>certifyCurve(curve,definition.constraints)),quotes=geometries.map(geometry=>quoteTrack(geometry,context.terrain,definition.constraints,definition.costMultiplier));
  const reasons=[...certificates.flatMap(certificate=>certificate.reasons),...quotes.flatMap(quote=>quote.reasons)];
  if(certificates.some(certificate=>!certificate.valid)||quotes.some(quote=>!quote.valid))throw new Error(reasons.join(' · '));
  for(let index=0;index<curves.length-1;index++) {
    const current=curves[index]!,next=curves[index+1]!;
    if(distance(current.p3,next.p0)>.001)throw new Error('Alignment sections must be contiguous');
    if(!tangentCompatible(current,next))throw new Error('Alignment sections must join smoothly');
  }
  const cost=quotes.reduce((sum,quote)=>sum+quote.cost,0);
  if(!Number.isSafeInteger(cost)||cost!==command.quotedCost)throw new Error('Track quote has changed');
  if(state.company.cash<cost)throw new Error('Insufficient funds');
  const fromPlan=planAnchor(state,command.from,curves[0]!.p0),toPlan=planAnchor(state,command.to,curves.at(-1)!.p3);
  if(fromPlan.kind==='node')requireTerminalTangent(state,fromPlan.nodeId,curves[0]!,true);
  if(toPlan.kind==='node')requireTerminalTangent(state,toPlan.nodeId,curves.at(-1)!,false);
  if(fromPlan.kind==='split'&&toPlan.kind==='split'&&fromPlan.edgeId===toPlan.edgeId)throw new Error('Both anchors cannot split the same edge');
  if(state.trains.some(train=>train.motion.path.some(leg=>(fromPlan.kind==='split'&&leg.edgeId===fromPlan.edgeId)||(toPlan.kind==='split'&&leg.edgeId===toPlan.edgeId))))throw new Error('Cannot split track used by a train path');
  if(state.operations.reservations.some(item=>(fromPlan.kind==='split'&&item.edgeId===fromPlan.edgeId)||(toPlan.kind==='split'&&item.edgeId===toPlan.edgeId)))throw new Error('Cannot split reserved track');
  const allocations=curves.length*2+10+(fromPlan.kind==='split'?2:0)+(toPlan.kind==='split'?2:0);
  if(state.nextEntityId+allocations>Number.MAX_SAFE_INTEGER)throw new Error('Invalid ID counter');
  const createdIds:string[]=[],from=commitAnchor(state,fromPlan,createdIds),to=commitAnchor(state,toPlan,createdIds),nodes:[Id<'node'>,...Id<'node'>[]]=[from];
  for(let index=0;index<curves.length-1;index++) {const nodeId=allocateId(state,'node');state.railway.nodes.push({id:nodeId,position:structuredClone(curves[index]!.p3)});createdIds.push(nodeId);nodes.push(nodeId);}
  nodes.push(to);
  if(new Set(nodes).size!==nodes.length)throw new Error('Alignment nodes must be distinct');
  let firstEdgeId:Id<'edge'>|null=null;
  for(let index=0;index<curves.length;index++) {
    const edgeId=allocateId(state,'edge'),quote=quotes[index]!;firstEdgeId??=edgeId;
    state.railway.edges.push({id:edgeId,from:nodes[index]!,to:nodes[index+1]!,curve:curves[index]!,speedLimitMps:definition.speedLimitMps,ownerId:state.company.id});
    state.operations.infrastructure[edgeId]={spans:engineeringSpans(quote).map(({startM,endM,kind})=>({startM,endM,kind})),constructionCost:quote.cost,maintenancePerDay:Math.max(1,Math.round(quote.cost*.00005)),electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};
    createdIds.push(edgeId);
  }
  postExpense(state,'construction',cost,firstEdgeId!,'Railway alignment construction');
  state.railway.revision++;
  return {createdIds};
};

export const constructionCommandHandlers:CommandHandlers={buildTrack:buildTrackHandler,buildAlignment:buildAlignmentHandler};
