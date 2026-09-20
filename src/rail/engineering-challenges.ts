import type {CubicCurve,Vec3} from '../domain/model.js';
import type {Terrain} from '../world/terrain.js';
import type {TrackClassDefinition} from '../content/track-classes.js';
import {compileCurve,distance,sampleDistance} from './geometry.js';
import {derivative,tangentCompatible} from './constraints.js';
import {quoteTrack} from './planner.js';
import {buildEngineeringProfile} from '../ui/engineering-profile.js';
import {generateWishCandidates} from './wish-corridor.js';
import {evaluateCorridorAlternatives,type CorridorCurveCandidate} from './corridor-alternatives.js';

export interface EngineeringChallenge {
  id:string;kind:'bridge'|'tunnel';position:Vec3;lengthM:number;cost:number;
  fromCurve:number;toCurve:number;start:Vec3;end:Vec3;wholeRoute:boolean;
}
/** Structure intervals come from the same exact terrain intersections as the construction quote. */
export function engineeringChallenges(curves:readonly CubicCurve[],terrain:Terrain,standard:TrackClassDefinition):EngineeringChallenge[]{
  if(!curves.length)return [];
  const geometries=curves.map(c=>compileCurve(c)),quotes=geometries.map(g=>quoteTrack(g,terrain,standard.constraints,standard.costMultiplier)),profile=buildEngineeringProfile(geometries,quotes,terrain),ends:number[]=[];
  for(const g of geometries)ends.push((ends.at(-1)??0)+g.lengthM);
  const at=(m:number)=>{const index=ends.findIndex(end=>end>=m);return Math.max(0,index<0?ends.length-1:index);};
  return profile.spans.filter(s=>s.kind!=='ground'&&s.endM-s.startM>=50).sort((a,b)=>b.cost-a.cost).slice(0,4).map((s,index)=>{
    // Keep whole untouched cubic sections outside the obstacle and its approaches.
    const fromCurve=at(Math.max(0,s.startM-200)),toCurve=at(Math.min(profile.lengthM,s.endM+200)),mid=(s.startM+s.endM)/2,middleIndex=at(mid);
    return {id:`${s.kind}:${index}:${fromCurve}:${toCurve}`,kind:s.kind as 'bridge'|'tunnel',position:sampleDistance(geometries[middleIndex]!,mid-(ends[middleIndex-1]??0)),lengthM:s.endM-s.startM,cost:s.cost,fromCurve,toCurve,start:{...curves[fromCurve]!.p0},end:{...curves[toCurve]!.p3},wholeRoute:fromCurve===0&&toCurve===curves.length-1};
  });
}

/** Alternatives replace one bounded interval and retain every other cubic exactly. */
export function localEngineeringCandidates(curves:readonly CubicCurve[],challenge:EngineeringChallenge,terrain:Terrain,standard:TrackClassDefinition):CorridorCurveCandidate[]{
  // Boundaries belong to the reviewed live-terrain proposal. A coarser worker window
  // may classify a nearby transition differently; it must not move that splice.
  const actual=challenge;
  if(!Number.isInteger(actual.fromCurve)||!Number.isInteger(actual.toCurve)||actual.fromCurve<0||actual.toCurve<actual.fromCurve||actual.toCurve>=curves.length||distance(curves[actual.fromCurve]!.p0,actual.start)>.001||distance(curves[actual.toCurve]!.p3,actual.end)>.001)return [];
  const first=curves[actual.fromCurve]!,last=curves[actual.toCurve]!,start=derivative(first,0),end=derivative(last,1),anchors=[first.p0,...curves.slice(actual.fromCurve,actual.toCurve+1).map(c=>c.p3)];
  const local=generateWishCandidates({anchors,terrain,trackClass:standard,maxOffsetM:300,tangents:{start:{x:start.x,z:start.z},end:{x:end.x,z:end.z}},endpointGrades:{start:start.y/Math.hypot(start.x,start.z),end:end.y/Math.hypot(end.x,end.z)}},false);
  const candidates:CorridorCurveCandidate[]=[{id:'engineering:current',curves:structuredClone([...curves])}];
  for(const candidate of local){
    const joined=[...curves.slice(0,actual.fromCurve),...candidate.curves,...curves.slice(actual.toCurve+1)];
    if(joined.some((c,i)=>i>0&&(distance(joined[i-1]!.p3,c.p0)>.001||!tangentCompatible(joined[i-1]!,c,1e-5))))continue;
    candidates.push({id:`engineering:${actual.id}:${candidate.id}`,curves:joined});
  }
  const alternatives=evaluateCorridorAlternatives(candidates,terrain,standard,true);
  // Keep the unchanged baseline available even when other options are cheaper.
  return [candidates[0]!,...alternatives.filter(c=>c.id!=='engineering:current').map(c=>({id:c.id,curves:c.curves}))];
}
