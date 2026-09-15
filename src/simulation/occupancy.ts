import type { GameState, Id } from '../domain/model.js';

export interface OccupancyResult {allowed:Set<Id<'train'>>;reservedNext:Set<Id<'train'>>}

const EPSILON=1e-6;
const serviceLegEdges=(train:GameState['trains'][number]):Id<'edge'>[]=>[...new Set(train.motion.path.map(item=>item.edgeId))];

/** Trains already inside track keep it; departures require the complete path to the next station. */
export function updateReservations(state:GameState):OccupancyResult {
  const allowed=new Set<Id<'train'>>(),reservedNext=new Set<Id<'train'>>(),reservations=new Map<Id<'edge'>,Id<'train'>>();
  const active=[...state.trains].filter(train=>(train.phase==='running'||train.phase==='blocked')&&!train.motion.arrived&&train.motion.path[train.motion.leg]).sort((a,b)=>a.id.localeCompare(b.id));
  const inside=active.filter(train=>train.motion.distanceM>EPSILON),waiting=active.filter(train=>train.motion.distanceM<=EPSILON);
  for(const train of inside) {
    const edgeId=train.motion.path[train.motion.leg]!.edgeId,owner=reservations.get(edgeId);
    if(owner===undefined)reservations.set(edgeId,train.id);
    else if(owner!==train.id){train.phase='blocked';train.speedMps=0;}
  }
  for(const train of inside) {
    const current=train.motion.path[train.motion.leg]!.edgeId;if(reservations.get(current)!==train.id)continue;
    allowed.add(train.id);train.phase='running';const requested=serviceLegEdges(train);
    if(requested.every(edgeId=>{const owner=reservations.get(edgeId);return owner===undefined||owner===train.id;})){for(const edgeId of requested)reservations.set(edgeId,train.id);reservedNext.add(train.id);}
  }
  for(const train of waiting) {
    const requested=serviceLegEdges(train);
    if(requested.every(edgeId=>!reservations.has(edgeId))){for(const edgeId of requested)reservations.set(edgeId,train.id);allowed.add(train.id);reservedNext.add(train.id);train.phase='running';}
    else {train.phase='blocked';train.speedMps=0;}
  }
  state.operations.reservations=[...reservations].map(([edgeId,trainId])=>({edgeId,trainId})).sort((a,b)=>a.edgeId.localeCompare(b.edgeId));
  return {allowed,reservedNext};
}
