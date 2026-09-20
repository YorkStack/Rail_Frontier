import type {EngineeringChallenge} from './engineering-challenges.js';
import type {CubicCurve,Vec3} from '../domain/model.js';
import type {TrackClassId} from '../content/track-classes.js';
import type {AlignmentTangents} from './alignment-solver.js';
import type {CorridorCurveCandidate} from './corridor-alternatives.js';
import type {TerrainWindowSnapshot} from './terrain-window.js';

export interface CorridorPlanningIdentity {requestId:number;railwayRevision:number;terrainRevision:number;trackClassId:TrackClassId;draftKey:string}
export interface CorridorWorkerRequest {type:'plan-corridors';wishPath?:boolean;engineering?:{curves:CubicCurve[];challenge:EngineeringChallenge};identity:CorridorPlanningIdentity;anchors:Vec3[];tangents:AlignmentTangents;terrain:TerrainWindowSnapshot;candidateBudget:number;maxOffsetM:number;expansionBudget:number}
export type CorridorWorkerResponse=
  | {type:'corridors-ready';identity:CorridorPlanningIdentity;candidates:CorridorCurveCandidate[]}
  | {type:'corridors-failed';identity:CorridorPlanningIdentity;reason:string};

export const samePlanningIdentity=(a:CorridorPlanningIdentity,b:CorridorPlanningIdentity):boolean=>a.requestId===b.requestId&&a.railwayRevision===b.railwayRevision&&a.terrainRevision===b.terrainRevision&&a.trackClassId===b.trackClassId&&a.draftKey===b.draftKey;
