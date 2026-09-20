import {trackClass} from '../content/track-classes.js';
import {generateCorridorCurveCandidates} from '../rail/corridor-alternatives.js';
import {hydrateTerrainWindow} from '../rail/terrain-window.js';
import type {CorridorWorkerRequest,CorridorWorkerResponse} from '../rail/corridor-worker-protocol.js';

const context=self as unknown as {onmessage:((event:MessageEvent<CorridorWorkerRequest>)=>void)|null;postMessage(value:CorridorWorkerResponse):void};
context.onmessage=event=>{const request=event.data;if(request.type!=='plan-corridors')return;try {const candidates=generateCorridorCurveCandidates({anchors:request.anchors,tangents:request.tangents,terrain:hydrateTerrainWindow(request.terrain),trackClass:trackClass(request.identity.trackClassId),candidateBudget:request.candidateBudget,maxOffsetM:request.maxOffsetM,searchExpansionBudget:request.expansionBudget});context.postMessage({type:'corridors-ready',identity:request.identity,candidates});}catch(error){context.postMessage({type:'corridors-failed',identity:request.identity,reason:error instanceof Error?error.message:String(error)});}};
