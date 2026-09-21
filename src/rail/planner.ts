import {MIN_TUNNEL_COVER_M} from '../content/engineering-rules.js';
import { type Terrain,type TriangleTerrain } from '../world/terrain.js';
import { pointAt,type TrackGeometry } from './geometry.js';
import { certifyCurve,type RailConstraints,standardRail } from './constraints.js';
import { cubicRoots,curveInterval } from '../domain/curve-math.js';
export interface EngineeringInterval { startM:number;endM:number;kind:'ground'|'bridge'|'tunnel';grade:number;cost:number }
export interface EngineeringQuote { valid:boolean;reasons:string[];cost:number;maxGrade:number;intervals:EngineeringInterval[] }
/** Split at terrain triangles, water intersections and engineering classification boundaries. */
export function quoteTrack(geometry:TrackGeometry,terrain:Terrain,limits:RailConstraints=standardRail,costMultiplier=1):EngineeringQuote {
  if(!Number.isFinite(costMultiplier)||costMultiplier<=0)throw new Error('Invalid track cost multiplier');
  const intervals:EngineeringInterval[]=[],reasons=new Set(certifyCurve(geometry.curve,limits).reasons);
  const triangleTerrain=terrain as Partial<TriangleTerrain>,hasTriangles=typeof triangleTerrain.curveBreakpoints==='function'&&typeof triangleTerrain.planeAt==='function',breaks=hasTriangles?triangleTerrain.curveBreakpoints!(geometry.curve):[0,1];
  if(!hasTriangles)reasons.add('Terrain must provide triangle intersection analysis');
  const parameters=[...breaks,...geometry.samples.map(s=>s.t)];
  for(let i=1;i<breaks.length;i++) {
    const start=breaks[i-1]!,end=breaks[i]!,mid=pointAt(geometry.curve,(start+end)/2);
    if(mid.x<0||mid.z<0||mid.x>terrain.widthM||mid.z>terrain.depthM){reasons.add('Alignment leaves terrain');continue;}
    if(!hasTriangles)continue;
    const plane=triangleTerrain.planeAt!(mid.x,mid.z),part=curveInterval(geometry.curve,start,end),controls=[part.p0,part.p1,part.p2,part.p3];
    const ground=controls.map(p=>plane.dx*p.x+plane.dz*p.z+plane.constant),clearance=controls.map((p,j)=>p.y-ground[j]!);
    const add=(values:number[],level:number)=>parameters.push(...cubicRoots(values,level).map(t=>start+t*(end-start)));
    add(clearance,-MIN_TUNNEL_COVER_M);add(clearance,6);
    if(terrain.waterLevelM!==null){add(ground,terrain.waterLevelM);add(controls.map(p=>p.y),terrain.waterLevelM+2);}
  }
  const sorted=parameters.sort((a,b)=>a-b).filter((t,i,all)=>i===0||t-all[i-1]!>1e-9);
  const distanceAt=(t:number)=>{
    let lo=0,hi=geometry.samples.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(geometry.samples[mid]!.t<t)lo=mid;else hi=mid;}
    const a=geometry.samples[lo]!,b=geometry.samples[hi]!;return a.distanceM+(b.distanceM-a.distanceM)*(t-a.t)/(b.t-a.t);
  };
  let cost=0,maxGrade=0;
  for(let i=1;i<sorted.length;i++) {
    const t0=sorted[i-1]!,t1=sorted[i]!,a=pointAt(geometry.curve,t0),b=pointAt(geometry.curve,t1),p=pointAt(geometry.curve,(t0+t1)/2);
    if(p.x<0||p.z<0||p.x>terrain.widthM||p.z>terrain.depthM){reasons.add('Alignment leaves terrain');continue;}
    const sample=terrain.sample(p.x,p.z),clearance=p.y-sample.elevationM;
    const horizontal=Math.hypot(b.x-a.x,b.z-a.z),grade=horizontal>1e-10?Math.abs(b.y-a.y)/horizontal:0;maxGrade=Math.max(maxGrade,grade);
    const wet=sample.waterLevelM!==null&&sample.elevationM<sample.waterLevelM;
    if(wet&&p.y<sample.waterLevelM!+2-1e-8)reasons.add('Rail lacks 2 m water clearance');
    const kind=clearance < -MIN_TUNNEL_COVER_M?'tunnel':wet||clearance>6?'bridge':'ground',rate=kind==='tunnel'?180000:kind==='bridge'?120000:12000;
    const startM=distanceAt(t0),endM=distanceAt(t1),amount=Math.round((endM-startM)*(rate+Math.abs(clearance)*1500+sample.forest*4000+sample.rock*8000+sample.urban*20000)*costMultiplier);
    intervals.push({startM,endM,kind,grade,cost:amount});cost+=amount;
  }
  if(!Number.isSafeInteger(cost))reasons.add('Quote exceeds finance range');
  return {valid:reasons.size===0,reasons:[...reasons],cost,maxGrade,intervals};
}
export function engineeringSpans(quote:EngineeringQuote):EngineeringInterval[] {
  const spans:EngineeringInterval[]=[];
  for(const interval of quote.intervals){const last=spans[spans.length-1];if(last&&last.kind===interval.kind&&Math.abs(last.endM-interval.startM)<.001){last.endM=interval.endM;last.cost+=interval.cost;last.grade=Math.max(last.grade,interval.grade);}else spans.push({...interval});}
  return spans;
}
