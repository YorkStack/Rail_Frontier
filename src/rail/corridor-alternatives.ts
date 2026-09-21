import type {CubicCurve,Vec3} from '../domain/model.js';
import type {Terrain} from '../world/terrain.js';
import type {TrackClassDefinition} from '../content/track-classes.js';
import {solveHorizontalAlignment,type AlignmentTangents} from './alignment-solver.js';
import {solveVerticalProfile} from './vertical-profile.js';
import {compileCurve,type TrackGeometry} from './geometry.js';
import {quoteTrack,type EngineeringQuote} from './planner.js';
import {buildEngineeringProfile,type EngineeringProfile} from '../ui/engineering-profile.js';
import {searchCorridorLattice} from './corridor-lattice.js';

export type CorridorPreference='balanced'|'low-cost'|'fast';

export interface CorridorAlternative {
  id:string;
  recommendedFor:CorridorPreference[];
  curves:CubicCurve[];
  geometries:TrackGeometry[];
  quotes:EngineeringQuote[];
  lengthM:number;
  cost:number;
  maxGrade:number;
  minimumRadiusM:number;
  structureM:number;
  estimatedTimeS:number;
}

export interface CorridorAlternativeRequest {
  anchors:readonly Vec3[];
  tangents?:AlignmentTangents;
  endpointGrades?:{start:number;end:number};
  terrain:Terrain;
  trackClass:TrackClassDefinition;
  maxOffsetM?:number;
  candidateBudget?:number;
  searchExpansionBudget?:number;
}

export interface CorridorCurveCandidate {id:string;curves:CubicCurve[]}

interface Candidate extends Omit<CorridorAlternative,'recommendedFor'> {scores:Record<CorridorPreference,number>}
const preferences:CorridorPreference[]=['balanced','low-cost','fast'];
const weights:Record<CorridorPreference,{cost:number;time:number;grade:number;structure:number;radius:number}>={
  balanced:{cost:1,time:.55,grade:.35,structure:.3,radius:.15},
  'low-cost':{cost:1.55,time:.15,grade:.2,structure:.5,radius:.05},
  fast:{cost:.3,time:1.6,grade:.8,structure:.08,radius:.55}
};

/**
 * Evaluates a small deterministic corridor envelope around mandatory anchors.
 * Every returned option is fitted, certified, classified and priced by the same
 * production pipeline used at construction commit.
 */
export function findCorridorAlternatives(request:CorridorAlternativeRequest):CorridorAlternative[] {
  return evaluateCorridorAlternatives(generateCorridorCurveCandidates(request),request.terrain,request.trackClass);
}

export function generateCorridorCurveCandidates(request:CorridorAlternativeRequest):CorridorCurveCandidate[] {
  const {anchors,terrain,trackClass}=request;if(anchors.length<2)throw new Error('Corridor search needs a start and destination');
  const budget=Math.max(1,Math.min(32,Math.floor(request.candidateBudget??9))),direct=Math.hypot(anchors.at(-1)!.x-anchors[0]!.x,anchors.at(-1)!.z-anchors[0]!.z),maxOffset=Math.max(0,Math.min(request.maxOffsetM??Math.min(650,direct*.22),direct*.35));
  const routes:{id:string;points:Vec3[]}[]=preferences.slice(0,budget).flatMap(preference=>{const points=latticeAnchors(anchors,request.tangents,terrain,trackClass,maxOffset,preference,request.searchExpansionBudget);return points?[{id:`lattice:${preference}`,points}]:[];}),patterns:number[][]=[[0],[-.35],[.35],[-.7],[.7],[-1],[1],[-.65,.65],[.65,-.65]];
  for(let index=0;routes.length<budget&&index<patterns.length;index++)routes.push({id:`corridor:${index}`,points:offsetAnchors(anchors,patterns[index]!,maxOffset)});
  const candidates:CorridorCurveCandidate[]=[];
  for(const route of routes) {
    try {
      const horizontal=solveHorizontalAlignment(route.points,request.tangents),curves=solveVerticalProfile(horizontal,route.points.map(point=>point.y),trackClass.constraints,{...(request.tangents?.start?{startGrade:0}:{}),...(request.tangents?.end?{endGrade:0}:{})}),geometries=curves.map(curve=>compileCurve(curve)),quotes=geometries.map(geometry=>quoteTrack(geometry,terrain,trackClass.constraints,trackClass.costMultiplier));
      if(quotes.some(quote=>!quote.valid))continue;
      candidates.push({id:route.id,curves});
    } catch {continue;}
  }
  return candidates;
}

/** Revalidates worker-generated curves against the live authoritative terrain before exposing them. */
export function evaluateCorridorAlternatives(curveCandidates:readonly CorridorCurveCandidate[],terrain:Terrain,trackClass:TrackClassDefinition,keepGeometryChoices=false):CorridorAlternative[] {
  const profiles=new Map<string,EngineeringProfile>(),candidates=curveCandidates.flatMap(candidate=>{const evaluated=evaluateCandidate(candidate,terrain,trackClass,profiles);return evaluated?[evaluated]:[];});
  return selectAlternatives(candidates,profiles,keepGeometryChoices);
}

/** Identical live-terrain certification, cooperatively scheduled between candidates.
 * null means superseded; no partial list may be published or purchased. */
export async function evaluateCorridorAlternativesInSlices(curveCandidates:readonly CorridorCurveCandidate[],terrain:Terrain,trackClass:TrackClassDefinition,options:{isCurrent:()=>boolean;yieldToInput?:()=>Promise<void>;keepAll?:boolean}):Promise<CorridorAlternative[]|null> {
  const profiles=new Map<string,EngineeringProfile>(),candidates:Candidate[]=[],yieldToInput=options.yieldToInput??(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
  if(!options.isCurrent())return null;
  await yieldToInput();let sliceStart=performance.now();
  for(const candidate of curveCandidates){
    if(!options.isCurrent())return null;
    const evaluated=evaluateCandidate(candidate,terrain,trackClass,profiles);if(evaluated)candidates.push(evaluated);
    if(performance.now()-sliceStart>=8){await yieldToInput();sliceStart=performance.now();}
  }
  if(!options.isCurrent())return null;
  return options.keepAll?candidates.map(candidate=>({...candidate,recommendedFor:['balanced']})):selectAlternatives(candidates,profiles,true);
}

function evaluateCandidate(candidate:CorridorCurveCandidate,terrain:Terrain,trackClass:TrackClassDefinition,profiles:Map<string,EngineeringProfile>):Candidate|null {
  try {const geometries=candidate.curves.map(curve=>compileCurve(curve)),quotes=geometries.map(geometry=>quoteTrack(geometry,terrain,trackClass.constraints,trackClass.costMultiplier));if(quotes.some(quote=>!quote.valid))return null;const profile=buildEngineeringProfile(geometries,quotes,terrain),lengthM=geometries.reduce((sum,geometry)=>sum+geometry.lengthM,0),cost=quotes.reduce((sum,quote)=>sum+quote.cost,0),structureM=profile.lengthByKind.bridge+profile.lengthByKind.tunnel,estimatedTimeS=lengthM/trackClass.speedLimitMps*(1+profile.maxGrade*5),minimumRadiusM=profile.minimumRadiusM;profiles.set(candidate.id,profile);return {id:candidate.id,curves:candidate.curves,geometries,quotes,lengthM,cost,maxGrade:profile.maxGrade,minimumRadiusM,structureM,estimatedTimeS,scores:{balanced:0,'low-cost':0,fast:0}};}catch{return null;}
}

function selectAlternatives(candidates:Candidate[],profiles:Map<string,EngineeringProfile>,keepGeometryChoices:boolean):CorridorAlternative[] {
  if(candidates.length===0)return [];
  const normalized={cost:normalizer(candidates.map(item=>item.cost)),time:normalizer(candidates.map(item=>item.estimatedTimeS)),grade:normalizer(candidates.map(item=>item.maxGrade)),structure:normalizer(candidates.map(item=>item.structureM)),radius:normalizer(candidates.map(item=>Number.isFinite(item.minimumRadiusM)?1/item.minimumRadiusM:0))};
  for(const item of candidates)for(const preference of preferences){const weight=weights[preference];item.scores[preference]=weight.cost*normalized.cost(item.cost)+weight.time*normalized.time(item.estimatedTimeS)+weight.grade*normalized.grade(item.maxGrade)+weight.structure*normalized.structure(item.structureM)+weight.radius*normalized.radius(Number.isFinite(item.minimumRadiusM)?1/item.minimumRadiusM:0);}
  if(keepGeometryChoices){
    const ordered=[...candidates].sort((a,b)=>a.cost-b.cost),chosen:CorridorAlternative[]=[];
    const family=(item:Candidate)=>{const {bridge,tunnel}=profiles.get(item.id)!.lengthByKind;return bridge<1&&tunnel<1?'land':tunnel<1?'bridge':bridge<1?'tunnel':'mixed';};
    // Reserve space for different engineering solutions before small variations of one solution.
    const families=new Set<string>(),near=ordered.find(item=>item.id.startsWith('wish:near:'));
    // Honour the player's sketch first; lower-cost side routes remain explicit choices.
    if(near){chosen.push({...near,recommendedFor:['balanced']});families.add(family(near));}
    for(const item of ordered){const kind=family(item);if(families.has(kind))continue;families.add(kind);chosen.push({...item,recommendedFor:['balanced']});if(chosen.length===3)return chosen;}
    for(const item of ordered){const profile=profiles.get(item.id)!;const duplicate=chosen.some(other=>{const p=profiles.get(other.id)!;return item.id===other.id||Math.abs(item.lengthM-other.lengthM)<30&&Math.abs(profile.lengthByKind.bridge-p.lengthByKind.bridge)<100&&Math.abs(profile.lengthByKind.tunnel-p.lengthByKind.tunnel)<100&&Math.abs(item.maxGrade-other.maxGrade)<.005;});if(!duplicate)chosen.push({...item,recommendedFor:['balanced']});if(chosen.length===3)break;}return chosen;
  }
  const selected=new Map<string,CorridorAlternative>();
  for(const preference of preferences){const best=[...candidates].sort((a,b)=>a.scores[preference]-b.scores[preference]||a.cost-b.cost||a.lengthM-b.lengthM||a.id.localeCompare(b.id))[0]!,known=selected.get(best.id);if(known)known.recommendedFor.push(preference);else selected.set(best.id,{id:best.id,recommendedFor:[preference],curves:best.curves,geometries:best.geometries,quotes:best.quotes,lengthM:best.lengthM,cost:best.cost,maxGrade:best.maxGrade,minimumRadiusM:best.minimumRadiusM,structureM:best.structureM,estimatedTimeS:best.estimatedTimeS});}
  return [...selected.values()].sort((a,b)=>preferences.indexOf(a.recommendedFor[0]!)-preferences.indexOf(b.recommendedFor[0]!));
}

function offsetAnchors(anchors:readonly Vec3[],pattern:readonly number[],maxOffset:number):Vec3[] {
  const result:Vec3[]=[{...anchors[0]!}];
  for(let index=0;index<anchors.length-1;index++) {
    const a=anchors[index]!,b=anchors[index+1]!,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),factor=pattern[index%pattern.length]??0,offset=Math.min(maxOffset,length*.35)*factor;
    if(Math.abs(offset)>1){const nx=-dz/length,nz=dx/length;result.push({x:(a.x+b.x)/2+nx*offset,y:(a.y+b.y)/2,z:(a.z+b.z)/2+nz*offset});}
    result.push({...b});
  }
  return result;
}

function latticeAnchors(anchors:readonly Vec3[],tangents:AlignmentTangents|undefined,terrain:Terrain,trackClass:TrackClassDefinition,maxOffsetM:number,preference:CorridorPreference,expansionBudget:number|undefined):Vec3[]|null {
  const result:Vec3[]=[];
  for(let index=0;index<anchors.length-1;index++){const leg=searchCorridorLattice({start:anchors[index]!,end:anchors[index+1]!,...(index===0&&tangents?.start?{startDirection:tangents.start}:{}),...(index===anchors.length-2&&tangents?.end?{endDirection:tangents.end}:{}),terrain,trackClass,maxOffsetM,preference,...(expansionBudget===undefined?{}:{expansionBudget})});if(!leg)return null;if(index)leg.shift();result.push(...leg);}
  return result.length<=128?result:null;
}

function normalizer(values:readonly number[]):(value:number)=>number {const min=Math.min(...values),max=Math.max(...values),range=max-min;return range<1e-9?()=>0:value=>(value-min)/range;}
