import type { GameState, Id } from '../domain/model.js';

export interface OccupancyResult {allowed:Set<Id<'train'>>;reservedNext:Set<Id<'train'>>}

/** Current edges have priority; a train may reserve one following edge before entering it. */
export function updateReservations(state:GameState):OccupancyResult {
  const allowed=new Set<Id<'train'>>(),reservedNext=new Set<Id<'train'>>(),reservations=new Map<Id<'edge'>,Id<'train'>>();
  const active=[...state.trains].filter(train=>(train.phase==='running'||train.phase==='blocked')&&!train.motion.arrived&&train.motion.path[train.motion.leg]).sort((a,b)=>a.id.localeCompare(b.id));
  for(const train of active) {
    const edgeId=train.motion.path[train.motion.leg]!.edgeId;
    if(!reservations.has(edgeId)){reservations.set(edgeId,train.id);allowed.add(train.id);train.phase='running';}
    else {train.phase='blocked';train.speedMps=0;}
  }
  for(const train of active)if(allowed.has(train.id)) {
    const next=train.motion.path[train.motion.leg+1]?.edgeId;
    if(next===undefined){reservedNext.add(train.id);continue;}
    const owner=reservations.get(next);
    if(owner===undefined||owner===train.id){reservations.set(next,train.id);reservedNext.add(train.id);}
  }
  state.operations.reservations=[...reservations].map(([edgeId,trainId])=>({edgeId,trainId})).sort((a,b)=>a.edgeId.localeCompare(b.edgeId));
  return {allowed,reservedNext};
}
