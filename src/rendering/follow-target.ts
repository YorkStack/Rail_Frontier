import type {GameState,Train} from '../domain/model.js';

/** A paused/boarding service is still followable; an unassigned purchase is not. */
export function followTarget(state:Pick<GameState,'trains'|'routes'|'railway'>,preferredId?:string):Train|undefined {
  const eligible=(train:Train)=>train.routeId!==null&&train.phase!=='idle'&&state.routes.some(route=>route.id===train.routeId)&&train.motion.path.length>0&&train.motion.path[train.motion.leg]!==undefined&&train.motion.path.every(leg=>state.railway.edges.some(edge=>edge.id===leg.edgeId));
  if(preferredId!==undefined)return state.trains.find(train=>train.id===preferredId&&eligible(train));
  return state.trains.find(eligible);
}
