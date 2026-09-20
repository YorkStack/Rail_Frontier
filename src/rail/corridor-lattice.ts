import type {Vec3} from '../domain/model.js';
import type {TrackClassDefinition} from '../content/track-classes.js';
import type {Terrain} from '../world/terrain.js';

export type LatticePreference='balanced'|'low-cost'|'fast';
export interface CorridorLatticeRequest {start:Vec3;end:Vec3;startDirection?:{x:number;z:number};endDirection?:{x:number;z:number};terrain:Terrain;trackClass:TrackClassDefinition;maxOffsetM:number;preference:LatticePreference;expansionBudget?:number}

interface State {x:number;z:number;y:number;heading:number;gradeBand:number;regime:number;cost:number;estimate:number;parent:State|null}
interface SearchOptions {stepM:number;guide?:readonly Vec3[];guideRadiusM?:number;expansionBudget:number}

const headingCount=16,tau=Math.PI*2,directions=Array.from({length:headingCount},(_,index)=>({x:Math.cos(index*tau/headingCount),z:Math.sin(index*tau/headingCount)}));
const modeWeights:Record<LatticePreference,{capital:number;distance:number;grade:number;turn:number}>={balanced:{capital:1,distance:.35,grade:.3,turn:.22},'low-cost':{capital:1.65,distance:.12,grade:.18,turn:.08},fast:{capital:.25,distance:1.5,grade:.8,turn:.7}};

/** Deterministic coarse-to-fine heading/elevation search inside a bounded corridor. */
export function searchCorridorLattice(request:CorridorLatticeRequest):Vec3[]|null {
  const direct=Math.hypot(request.end.x-request.start.x,request.end.z-request.start.z);if(direct<10)return null;
  const coarseStep=Math.max(240,request.trackClass.constraints.minRadiusM*1.1,direct/24),budget=Math.max(128,Math.min(20_000,Math.floor(request.expansionBudget??6_000))),coarse=search(request,{stepM:coarseStep,expansionBudget:Math.floor(budget*.45)});if(!coarse)return null;
  return search(request,{stepM:coarseStep/2,guide:coarse,guideRadiusM:coarseStep*1.6,expansionBudget:Math.ceil(budget*.55)})??coarse;
}

function search(request:CorridorLatticeRequest,options:SearchOptions):Vec3[]|null {
  const {start,end,terrain,trackClass,maxOffsetM}=request,limits=trackClass.constraints,weights=modeWeights[request.preference],direct=Math.hypot(end.x-start.x,end.z-start.z),axis={x:(end.x-start.x)/direct,z:(end.z-start.z)/direct},normal={x:-axis.z,z:axis.x},verticalBand=Math.max(.5,options.stepM*limits.maxGrade/2),startHeading=headingIndex(request.startDirection??axis),endHeading=request.endDirection?headingIndex(request.endDirection):null,queue=new MinQueue(),initial:State={...start,heading:startHeading,gradeBand:0,regime:regimeAt(start.x,start.y,start.z,terrain),cost:0,estimate:direct*weights.distance,parent:null},best=new Map<string,number>();queue.push(initial);
  let expansions=0;
  while(queue.length&&expansions++<options.expansionBudget){const current=queue.pop()!,key=stateKey(current,start,options.stepM,verticalBand);if(current.cost>(best.get(key)??Infinity)+1e-9)continue;const remaining=Math.hypot(end.x-current.x,end.z-current.z),finalDirection=headingIndex({x:end.x-current.x,z:end.z-current.z}),requiredGrade=(end.y-current.y)/Math.max(remaining,1);
    if(remaining<=options.stepM*1.35&&headingDelta(current.heading,finalDirection)<=1&&(endHeading===null||headingDelta(finalDirection,endHeading)<=1)&&Math.abs(requiredGrade)<=limits.maxGrade){const path=unwind(current);path.push({...end});return simplify(path);}
    for(const turn of [-1,0,1])for(const gradeDelta of [-1,0,1]){const heading=wrapHeading(current.heading+turn),gradeBand=Math.max(-2,Math.min(2,current.gradeBand+gradeDelta)),grade=gradeBand*limits.maxGrade/2,direction=directions[heading]!,x=current.x+direction.x*options.stepM,z=current.z+direction.z*options.stepM,y=current.y+grade*options.stepM;if(x<0||z<0||x>terrain.widthM||z>terrain.depthM)continue;const along=(x-start.x)*axis.x+(z-start.z)*axis.z,lateral=Math.abs((x-start.x)*normal.x+(z-start.z)*normal.z);if(along<-options.stepM||along>direct+options.stepM||lateral>maxOffsetM)continue;if(options.guide&&distanceToPolyline(x,z,options.guide)>(options.guideRadiusM??Infinity))continue;let sample;try{sample=terrain.sample(x,z);}catch{continue;}const clearance=y-sample.elevationM,regime=isWater(sample.elevationM,sample.waterLevelM)||clearance>6?1:clearance< -4?2:0,capitalFactor=regime===0?1:regime===1?5.2:6.4,transition=regime===current.regime?0:options.stepM*.4,stepCost=options.stepM*(weights.capital*capitalFactor+weights.distance)+weights.grade*Math.abs(grade)*options.stepM*25+weights.turn*Math.abs(turn)*options.stepM+weights.capital*transition,cost=current.cost+stepCost,heuristic=Math.hypot(end.x-x,end.z-z)*weights.distance,next:State={x,z,y,heading,gradeBand,regime,cost,estimate:cost+heuristic,parent:current},nextKey=stateKey(next,start,options.stepM,verticalBand);if(cost+1e-9>=(best.get(nextKey)??Infinity))continue;best.set(nextKey,cost);queue.push(next);}
  }
  return null;
}

function regimeAt(x:number,y:number,z:number,terrain:Terrain):number {const sample=terrain.sample(x,z),clearance=y-sample.elevationM;return isWater(sample.elevationM,sample.waterLevelM)||clearance>6?1:clearance< -4?2:0;}
function isWater(elevationM:number,waterLevelM:number|null):boolean {return waterLevelM!==null&&elevationM<=waterLevelM+.001;}
function headingIndex(direction:{x:number;z:number}):number {const angle=Math.atan2(direction.z,direction.x);return wrapHeading(Math.round(angle/tau*headingCount));}
function wrapHeading(value:number):number {return (value%headingCount+headingCount)%headingCount;}
function headingDelta(a:number,b:number):number {const difference=Math.abs(a-b);return Math.min(difference,headingCount-difference);}
function stateKey(state:State,origin:Vec3,stepM:number,verticalBand:number):string {return `${Math.round((state.x-origin.x)/stepM)},${Math.round((state.z-origin.z)/stepM)},${state.heading},${Math.round(state.y/verticalBand)},${state.gradeBand},${state.regime}`;}
function unwind(state:State):Vec3[] {const result:Vec3[]=[];for(let current:State|null=state;current;current=current.parent)result.push({x:current.x,y:current.y,z:current.z});return result.reverse();}
function simplify(points:readonly Vec3[]):Vec3[] {if(points.length<=2)return points.map(point=>({...point}));const result=[{...points[0]!}];for(let index=1;index<points.length-1;index++){const a=result.at(-1)!,b=points[index]!,c=points[index+1]!,ab=Math.atan2(b.z-a.z,b.x-a.x),bc=Math.atan2(c.z-b.z,c.x-b.x);if(Math.abs(Math.atan2(Math.sin(bc-ab),Math.cos(bc-ab)))>.03||Math.abs((b.y-a.y)/Math.hypot(b.x-a.x,b.z-a.z)-(c.y-b.y)/Math.hypot(c.x-b.x,c.z-b.z))>.002)result.push({...b});}result.push({...points.at(-1)!});return result;}
function distanceToPolyline(x:number,z:number,points:readonly Vec3[]):number {let best=Infinity;for(let index=0;index<points.length-1;index++){const a=points[index]!,b=points[index+1]!,dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz,t=length2===0?0:Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/length2)),distance=Math.hypot(x-(a.x+dx*t),z-(a.z+dz*t));if(distance<best)best=distance;}return best;}

class MinQueue {private readonly values:State[]=[];get length(){return this.values.length;}push(value:State):void {this.values.push(value);let index=this.values.length-1;while(index>0){const parent=(index-1)>>1;if(compare(this.values[parent]!,value)<=0)break;this.values[index]=this.values[parent]!;index=parent;}this.values[index]=value;}pop():State|undefined {const first=this.values[0],last=this.values.pop();if(!first||!last||this.values.length===0)return first;let index=0;while(true){const left=index*2+1,right=left+1;if(left>=this.values.length)break;let child=left;if(right<this.values.length&&compare(this.values[right]!,this.values[left]!)<0)child=right;if(compare(last,this.values[child]!)<=0)break;this.values[index]=this.values[child]!;index=child;}this.values[index]=last;return first;}}
function compare(a:State,b:State):number {return a.estimate-b.estimate||a.cost-b.cost||a.x-b.x||a.z-b.z||a.y-b.y||a.heading-b.heading||a.gradeBand-b.gradeBand;}
