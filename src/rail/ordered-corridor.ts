import type {CubicCurve,Vec3} from '../domain/model.js';
import type {CorridorAlternativeRequest} from './corridor-alternatives.js';
import {MIN_TUNNEL_COVER_M} from '../content/engineering-rules.js';
import {pointAt} from './geometry.js';
import {horizontalDistance,simplifyWishPath} from './wish-path.js';

/** Equal-distance stations make the search independent of pointer event density. */
export function corridorStations(points:readonly Vec3[],spacingM:number):Vec3[] {
  if(points.length<2||!Number.isFinite(spacingM)||spacingM<=0)return [];
  const lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]!+horizontalDistance(points[i-1]!,points[i]!));
  const total=lengths.at(-1)!;
  if(total<1||!Number.isFinite(total))return [];
  const count=Math.ceil(total/spacingM);
  if(count>8192)return [];
  let leg=1;
  return Array.from({length:count+1},(_,i)=>{
    const distance=total*i/count;
    while(leg<points.length-1&&lengths[leg]!<distance)leg++;
    const a=points[leg-1]!,b=points[leg]!,t=(distance-lengths[leg-1]!)/Math.max(1e-9,lengths[leg]!-lengths[leg-1]!);
    return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
  });
}

/** Visits every gate in order, without resetting to a nearby later leg. For each
 * gate, advance to the earliest intersection of its disk and the other polyline.
 * This is a bounded sampled intent check, not the engineering certificate. */
function visitsInOrder(gates:readonly Vec3[],path:readonly Vec3[],radius:number):boolean {
  let leg=0,cursor=0;
  for(const gate of gates){
    let found=false;
    while(leg<path.length-1){
      const a=path[leg]!,b=path[leg+1]!,dx=b.x-a.x,dz=b.z-a.z,px=a.x-gate.x,pz=a.z-gate.z,A=dx*dx+dz*dz;
      if(A<1e-12){if(Math.hypot(px,pz)<=radius){found=true;break;}leg++;cursor=0;continue;}
      const B=px*dx+pz*dz,C=px*px+pz*pz-radius*radius,discriminant=B*B-A*C;
      if(discriminant>=0){const root=Math.sqrt(discriminant),entry=Math.max(cursor,0,(-B-root)/A),exit=Math.min(1,(-B+root)/A);if(entry<=exit+1e-9){cursor=entry;found=true;break;}}
      leg++;cursor=0;
    }
    if(!found)return false;
  }
  return true;
}

export function followsOrderedCorridor(curves:readonly CubicCurve[],wish:readonly Vec3[],widthM:number):boolean {
  if(!curves.length||wish.length<2||!Number.isFinite(widthM)||widthM<0)return false;
  const rail:Vec3[]=[];
  for(const curve of curves){
    const polygonLength=horizontalDistance(curve.p0,curve.p1)+horizontalDistance(curve.p1,curve.p2)+horizontalDistance(curve.p2,curve.p3),steps=Math.max(1,Math.ceil(polygonLength/15));
    if(rail.length+steps>8192)return false;
    for(let i=0;i<steps;i++)rail.push(pointAt(curve,i/steps));
  }
  rail.push({...curves.at(-1)!.p3});
  // Preserve corners as well as regular samples: a short intentional spur must
  // not disappear between two resampled stations.
  const gates:Vec3[]=[];
  for(let i=1;i<wish.length;i++){
    const a=wish[i-1]!,b=wish[i]!,steps=Math.max(1,Math.ceil(horizontalDistance(a,b)/15));
    if(gates.length+steps>8192)return false;
    for(let j=0;j<steps;j++)gates.push({x:a.x+(b.x-a.x)*j/steps,y:0,z:a.z+(b.z-a.z)*j/steps});
  }
  gates.push(wish.at(-1)!);
  return visitsInOrder(gates,rail,widthM)&&visitsInOrder(rail,gates,widthM);
}

interface SearchState {point:Vec3;offset:number;heading:number;grade:number;regime:number;cost:number;parent:SearchState|null}
export interface OrderedSearchResult {paths:Vec3[][];expansions:number;exhausted:boolean}

/** Bounded dynamic search on successive wish-path cross-sections. Progress is
 * the layer, never nearest-segment projection. Each state retains heading,
 * elevation, grade and structure regime. Beam pruning bounds work, so this is
 * deliberately not an optimality or feasibility proof. Fitted output must still
 * pass ordered intent, radius/grade certification and the real engineering quote. */
export function searchOrderedCorridor(request:CorridorAlternativeRequest):OrderedSearchResult {
  const empty={paths:[],expansions:0,exhausted:false};
  if(request.anchors.length<2||request.anchors.length>2048)return empty;
  let guide:Vec3[];try{guide=simplifyWishPath(request.anchors,4);}catch{return empty;}
  const length=guide.slice(1).reduce((sum,p,i)=>sum+horizontalDistance(guide[i]!,p),0);
  if(length<40)return empty;
  const stations=corridorStations(guide,Math.max(180,length/48,request.trackClass.constraints.minRadiusM)),last=stations.length-1;
  if(last<2)return empty;
  const width=Math.max(0,Math.min(300,request.maxOffsetM??60)),limits=request.trackClass.constraints,budget=Math.max(0,Math.min(20_000,Math.floor(request.searchExpansionBudget??6000))),beam=48,start=request.anchors[0]!,end=request.anchors.at(-1)!,terrain=request.terrain;
  if(!Number.isFinite(budget)||!Number.isFinite(width))return empty;
  const offsets=width>0?[-width*.9,-width*.45,0,width*.45,width*.9]:[0];
  let frontier:SearchState[]=[{point:{...start},offset:0,heading:request.tangents?.start?Math.atan2(request.tangents.start.z,request.tangents.start.x):Math.atan2(stations[1]!.z-start.z,stations[1]!.x-start.x),grade:request.endpointGrades?.start??0,regime:0,cost:0,parent:null}],expansions=0;
  for(let layer=1;layer<=last;layer++){
    const center=stations[layer]!,before=stations[layer-1]!,after=stations[Math.min(last,layer+1)]!,dx=after.x-before.x,dz=after.z-before.z,norm=Math.hypot(dx,dz)||1,fraction=layer/last,linearY=start.y+(end.y-start.y)*fraction,step=length/last;
    const nodes:{point:Vec3;offset:number}[]=[];
    for(const offset of layer===last?[0]:offsets){
      const x=layer===last?end.x:center.x-dz/norm*offset,z=layer===last?end.z:center.z+dx/norm*offset;
      if(x<0||z<0||x>terrain.widthM||z>terrain.depthM)continue;
      let ground:number;try{ground=terrain.sample(x,z).elevationM;}catch{continue;}
      // Independent elevations around the endpoint grade line plus local ground;
      // intermediate pointer Y is never a required rail elevation.
      const band=step*limits.maxGrade*.45,levels=layer===last?[end.y]:[linearY-2*band,linearY-band,linearY,linearY+band,linearY+2*band,ground];
      for(const y of new Set(levels))if(Number.isFinite(y))nodes.push({point:{x,y,z},offset});
    }
    const next=new Map<string,SearchState>();
    for(const current of frontier){
      if(expansions>=budget)return {paths:[],expansions,exhausted:true};
      expansions++;
      for(const node of nodes){
        const p=node.point,distance=horizontalDistance(current.point,p);
        if(distance<10||Math.abs(node.offset-current.offset)>step*.95)continue;
        const grade=(p.y-current.point.y)/distance,heading=Math.atan2(p.z-current.point.z,p.x-current.point.x),turn=Math.abs(Math.atan2(Math.sin(heading-current.heading),Math.cos(heading-current.heading)));
        if(Math.abs(grade)>limits.maxGrade*.92||turn>Math.min(1.25,distance/limits.minRadiusM))continue;
        if(layer===last&&request.tangents?.end){const endHeading=Math.atan2(request.tangents.end.z,request.tangents.end.x);if(Math.abs(Math.atan2(Math.sin(heading-endHeading),Math.cos(heading-endHeading)))>.65)continue;}
        let capital=0,regime=0,valid=true;
        // Classify throughout each primitive, not only at its destination.
        const samples=Math.max(2,Math.ceil(distance/40));
        for(let s=1;s<=samples;s++){
          const t=s/samples,x=current.point.x+(p.x-current.point.x)*t,z=current.point.z+(p.z-current.point.z)*t,y=current.point.y+(p.y-current.point.y)*t;
          try{const sample=terrain.sample(x,z),clearance=y-sample.elevationM;regime=(sample.waterLevelM!==null&&sample.elevationM<=sample.waterLevelM+.001)||clearance>6?1:clearance< -MIN_TUNNEL_COVER_M?2:0;capital+=(regime===1?5.2:regime===2?6.4:1+Math.abs(clearance)*.08)/samples;}catch{valid=false;break;}
        }
        if(!valid)continue;
        const deviation=width?node.offset/width:0,cost=current.cost+distance*(capital+.3+.35*deviation*deviation+2*turn*turn+Math.abs(grade)*8+Math.abs(grade-current.grade)*15)+(regime===current.regime?0:step*.2);
        const key=`${node.offset}:${p.y.toFixed(3)}:${Math.round(heading*16/Math.PI)}:${Math.round(grade/limits.maxGrade*8)}:${regime}`,known=next.get(key);
        if(!known||cost<known.cost)next.set(key,{...node,heading,grade,regime,cost,parent:current});
      }
    }
    frontier=[...next.values()].sort((a,b)=>a.cost-b.cost||Math.abs(a.offset)-Math.abs(b.offset)||a.point.y-b.point.y).slice(0,beam);
    if(!frontier.length)return {paths:[],expansions,exhausted:false};
  }
  const paths=frontier.slice(0,6).map(state=>{const points:Vec3[]=[];for(let current:SearchState|null=state;current;current=current.parent)points.push({...current.point});return points.reverse();});
  return {paths,expansions,exhausted:false};
}
