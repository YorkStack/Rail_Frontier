import type {Vec3} from '../domain/model.js';
import {solveHorizontalAlignment} from './alignment-solver.js';
import {solveVerticalProfile} from './vertical-profile.js';
import {compileCurve,pointAt} from './geometry.js';
import {derivative} from './constraints.js';
import {quoteTrack} from './planner.js';
import {fitWishPoints,horizontalDistance,distanceToSegment} from './wish-path.js';
import type {CorridorAlternativeRequest,CorridorCurveCandidate} from './corridor-alternatives.js';

/** Bounded first-pass proposals. Intermediate pointer Y never determines rail height.
 * This is candidate generation, not a guarantee of an optimal or feasible corridor.
 * Every emitted chain passes the production certificate and engineering quote.
 */
export function generateWishCandidates(request:CorridorAlternativeRequest,allowRelaxation=true):CorridorCurveCandidate[] {
  const {anchors,terrain,trackClass,tangents}=request;
  if(anchors.length<2)return [];
  const result:CorridorCurveCandidate[]=[],signatures=new Set<string>(),baseSignatures=new Set<string>();
  const width=request.maxOffsetM??60;
  for(const tolerance of [8,22,45]){
    let base:Vec3[];try{base=fitWishPoints(anchors,tolerance);}catch{continue;}
    // Add interior freedom even for a single long stroke. Endpoints stay exact.
    if(base.length===2){const [a,b]=base as [Vec3,Vec3],steps=Math.max(4,Math.min(16,Math.ceil(horizontalDistance(a,b)/250)));base=[a,...Array.from({length:steps-1},(_,i)=>(i+1)/steps).map(t=>({x:a.x+(b.x-a.x)*t,y:0,z:a.z+(b.z-a.z)*t})),b];}
    const baseKey=JSON.stringify(base.map(p=>[p.x,p.z]));if(baseSignatures.has(baseKey))continue;baseSignatures.add(baseKey);
    const lengths=[0];for(let i=1;i<base.length;i++)lengths.push(lengths.at(-1)!+horizontalDistance(base[i-1]!,base[i]!));const total=lengths.at(-1)!;
    for(const offset of [...new Set([0,-Math.min(90,width),Math.min(90,width),-width,width])])for(const follow of [0,.5,1])for(const smoothing of follow===0?[0]:[0,2,8]){
      // Offset is an explicitly offered whole-route detour, never a hidden edit.
      const points=base.map((p,i)=>{const before=base[Math.max(0,i-1)]!,after=base[Math.min(base.length-1,i+1)]!,dx=after.x-before.x,dz=after.z-before.z,d=Math.hypot(dx,dz)||1,f=lengths[i]!/total,bend=Math.sin(Math.PI*f)**2*offset;return {x:p.x-dz/d*bend,y:0,z:p.z+dx/d*bend};});
      const a=anchors[0]!,b=anchors.at(-1)!;points[0]={...a};points[points.length-1]={...b};
      try{
        let heights=points.map((p,i)=>{const t=lengths[i]!/total,level=a.y+(b.y-a.y)*t;return level*(1-follow)+terrain.sample(p.x,p.z).elevationM*follow;});heights[0]=a.y;heights[heights.length-1]=b.y;
        // Repeated grade-cone projection and smoothing of terrain-follow candidates.
        // Final curve derivatives, not these samples, remain the build certificate.
        for(let pass=0;pass<smoothing;pass++){
          for(let i=1;i<heights.length-1;i++){const delta=horizontalDistance(points[i-1]!,points[i]!)*trackClass.constraints.maxGrade*.55;heights[i]=Math.max(heights[i-1]!-delta,Math.min(heights[i-1]!+delta,heights[i]!));}
          for(let i=heights.length-2;i>0;i--){const delta=horizontalDistance(points[i+1]!,points[i]!)*trackClass.constraints.maxGrade*.55;heights[i]=Math.max(heights[i+1]!-delta,Math.min(heights[i+1]!+delta,heights[i]!));}
          heights=heights.map((h,i)=>i===0||i===heights.length-1?h:(heights[i-1]!+2*h+heights[i+1]!)/4);
        }
        points.forEach((p,i)=>p.y=heights[i]!);
        const horizontal=solveHorizontalAlignment(points,tangents),curves=solveVerticalProfile(horizontal,heights,trackClass.constraints,{...(tangents?.start?{startGrade:request.endpointGrades?.start??0}:{}),...(tangents?.end?{endGrade:request.endpointGrades?.end??0}:{})});
        if(request.endpointGrades){const first=derivative(curves[0]!,0),last=derivative(curves.at(-1)!,1);if(Math.abs(first.y/Math.hypot(first.x,first.z)-request.endpointGrades.start)>1e-7||Math.abs(last.y/Math.hypot(last.x,last.z)-request.endpointGrades.end)>1e-7)continue;}
        // A candidate cannot short-cut to a different side of the user's landscape.
        if(curves.some(curve=>Array.from({length:17},(_,i)=>pointAt(curve,i/16)).some(p=>Math.min(...anchors.slice(1).map((b,i)=>distanceToSegment(p,anchors[i]!,b)))>Math.abs(offset)+60)))continue;
        const geometries=curves.map(c=>compileCurve(c)),quotes=geometries.map(g=>quoteTrack(g,terrain,trackClass.constraints,trackClass.costMultiplier));if(quotes.some(q=>!q.valid))continue;
        const signature=curves.map(c=>[c.p0,c.p1,c.p2,c.p3].map(p=>[p.x,p.y,p.z].map(v=>v.toFixed(1)).join(',')).join(';')).join('|');if(signatures.has(signature))continue;signatures.add(signature);
        result.push({id:`wish:${offset===0?'near':offset<0?'left':'right'}:${Math.abs(offset)}:${follow}:${tolerance}:${smoothing}`,curves});
      }catch{/* Infeasible candidates are omitted; never relax engineering checks. */}

    }
  }
  if(allowRelaxation&&anchors.length>2&&anchors.every(p=>distanceToSegment(p,anchors[0]!,anchors.at(-1)!)<=150)){
    for(const candidate of generateWishCandidates({...request,anchors:[anchors[0]!,anchors.at(-1)!],maxOffsetM:0},false))result.push({...candidate,id:candidate.id.replace('wish:near','wish:relaxed')});
  }
  return result;
}
