import {diagnoseSketch} from './sketch-diagnostics.js';
import type {Vec3} from '../domain/model.js';
import {solveHorizontalAlignment} from './alignment-solver.js';
import {solveVerticalProfile} from './vertical-profile.js';
import {compileCurve} from './geometry.js';
import {derivative} from './constraints.js';
import {quoteTrack} from './planner.js';
import {fitWishPoints,horizontalDistance,distanceToSegment} from './wish-path.js';
import {followsOrderedCorridor,searchOrderedCorridor} from './ordered-corridor.js';
import type {CorridorAlternativeRequest,CorridorCurveCandidate} from './corridor-alternatives.js';

/** Bounded first-pass proposals. Intermediate pointer Y never determines rail height.
 * This is candidate generation, not a guarantee of an optimal or feasible corridor.
 * Every emitted chain passes the production certificate and engineering quote.
 */
export function generateWishCandidates(request:CorridorAlternativeRequest,allowRelaxation=true):CorridorCurveCandidate[] {
  return generateCandidates(request,allowRelaxation,0);
}
function generateCandidates(request:CorridorAlternativeRequest,allowRelaxation:boolean,approachSpacingM:number):CorridorCurveCandidate[] {
  const {anchors,terrain,trackClass,tangents}=request;
  if(anchors.length<2||diagnoseSketch(anchors,terrain,trackClass.constraints.minRadiusM)?.blocking)return [];
  const result:CorridorCurveCandidate[]=[],signatures=new Set<string>(),baseSignatures=new Set<string>();
  const width=request.maxOffsetM??60;
  const addCandidate=(points:Vec3[],heights:number[],id:string,corridorWidth:number)=>{
    points=points.map((p,i)=>({...p,y:heights[i]!}));
    const horizontal=solveHorizontalAlignment(points,tangents),curves=solveVerticalProfile(horizontal,heights,trackClass.constraints,{...(tangents?.start?{startGrade:request.endpointGrades?.start??0}:{}),...(tangents?.end?{endGrade:request.endpointGrades?.end??0}:{})});
    if(request.endpointGrades){const first=derivative(curves[0]!,0),last=derivative(curves.at(-1)!,1);if(Math.abs(first.y/Math.hypot(first.x,first.z)-request.endpointGrades.start)>1e-7||Math.abs(last.y/Math.hypot(last.x,last.z)-request.endpointGrades.end)>1e-7)return;}
    if(!followsOrderedCorridor(curves,anchors,corridorWidth))return;
    if(curves.some(c=>!quoteTrack(compileCurve(c),terrain,trackClass.constraints,trackClass.costMultiplier).valid))return;
    const signature=curves.map(c=>[c.p0,c.p1,c.p2,c.p3].map(p=>[p.x,p.y,p.z].map(v=>v.toFixed(1)).join(',')).join(';')).join('|');
    if(signatures.has(signature))return;
    signatures.add(signature);result.push({id,curves});
  };
  for(const tolerance of [8,22,45]){
    let base:Vec3[];try{base=fitWishPoints(anchors,tolerance);}catch{continue;}
    // Add interior freedom even for a single long stroke. Endpoints stay exact.
    if(base.length===2){const [a,b]=base as [Vec3,Vec3],steps=Math.max(4,Math.min(16,Math.ceil(horizontalDistance(a,b)/250)));base=[a,...Array.from({length:steps-1},(_,i)=>(i+1)/steps).map(t=>({x:a.x+(b.x-a.x)*t,y:0,z:a.z+(b.z-a.z)*t})),b];}
    // A fixed 250 m fitting grid can make a perfectly feasible station departure
    // too tight. Give endpoint tangents room to turn; the original ordered wish
    // corridor and exact curve certificate still decide whether this is allowed.
    if(approachSpacingM>0) {
      const distances=[0];for(let i=1;i<base.length;i++)distances.push(distances.at(-1)!+horizontalDistance(base[i-1]!,base[i]!));
      const total=distances.at(-1)!;
      base=base.filter((_,i)=>i===0||i===base.length-1||(!tangents?.start||distances[i]!>=approachSpacingM)&&(!tangents?.end||total-distances[i]!>=approachSpacingM));
    }
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
        addCandidate(points,heights,`wish:${offset===0?'near':offset<0?'left':'right'}:${Math.abs(offset)}:${follow}:${tolerance}:${smoothing}`,Math.abs(offset)+60);
      }catch{/* Infeasible candidates are omitted; never relax engineering checks. */}

    }
  }
  // Search follows ordered cross-sections, allowing different lateral/vertical
  // decisions at successive obstacles instead of one whole-route offset.
  if(request.searchExpansionBudget!==0)for(const [index,points] of searchOrderedCorridor(request).paths.entries()){
    for(const smoothing of [0,1])try{
      // One bounded rounding pass can remove lattice corners. Intent and the
      // real curve certificate are checked again after rounding, with no wider
      // corridor or weaker engineering limits.
      const rounded=points.map((p,i)=>smoothing===0||i===0||i===points.length-1?p:{x:(points[i-1]!.x+2*p.x+points[i+1]!.x)/4,y:p.y,z:(points[i-1]!.z+2*p.z+points[i+1]!.z)/4});
      addCandidate(rounded,rounded.map(p=>p.y),`wish:search:${index}:${smoothing}`,Math.max(60,width));
    }catch{/* Search output is only a proposal, never permission to build. */}
  }

  if(allowRelaxation&&anchors.length>2&&anchors.every(p=>distanceToSegment(p,anchors[0]!,anchors.at(-1)!)<=150)){
    for(const candidate of generateWishCandidates({...request,anchors:[anchors[0]!,anchors.at(-1)!],maxOffsetM:0,searchExpansionBudget:0},false))if(followsOrderedCorridor(candidate.curves,anchors,150))result.push({...candidate,id:`wish:relaxed:${candidate.id}`});
  }
  // Only a failed ordinary fit pays for these two bounded retries. Coarser
  // endpoint sections change fitting freedom, never the player's saved sketch.
  if(!result.length&&approachSpacingM===0&&(tangents?.start||tangents?.end)) {
    for(const factor of [4,7]) {
      const spacing=trackClass.constraints.minRadiusM*factor;
      const retry=generateCandidates({...request,searchExpansionBudget:0},false,spacing);
      result.push(...retry.map(candidate=>({...candidate,id:`wish:approach:${factor}:${candidate.id}`})));
      if(result.length)break;
    }
  }
  return result;
}
