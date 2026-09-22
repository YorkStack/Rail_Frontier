import type {GameState,Id} from '../domain/model.js';
import type {constructionPracticeProgress} from '../application/construction-practice.js';
import {townCoverage} from '../simulation/coverage.js';
import {followTarget} from '../rendering/follow-target.js';

type Practice=NonNullable<ReturnType<typeof constructionPracticeProgress>>;
export interface PracticeService {
  stage:'build'|'buy'|'route'|'assign'|'run';
  trainId:Id<'train'>|null;routeId:Id<'route'>|null;purchaseStationId:Id<'station'>;
  passengerTowns:boolean;
}
/** Read-only progress from the actual railway; survives loading without extra lesson flags. */
export function practiceService(state:Readonly<GameState>,practice:Practice):PracticeService {
  const stationIds=practice.stationIds,covered=new Set(townCoverage(state).values()),passengerTowns=stationIds.every(id=>covered.has(id));
  const result:PracticeService={stage:practice.complete?'buy':'build',trainId:null,routeId:null,purchaseStationId:stationIds[0]!,passengerTowns};
  if(!practice.complete)return result;
  const routes=state.routes.filter(route=>stationIds.every(id=>route.stops.includes(id)));
  const active=state.trains.find(train=>routes.some(route=>route.id===train.routeId)&&followTarget(state,train.id));
  if(active)return {...result,stage:'run',trainId:active.id,routeId:active.routeId};
  const parked=state.trains.find(train=>{
    if(train.routeId!==null||train.phase!=='idle'||train.motion.distanceM!==0)return false;
    const leg=train.motion.path[train.motion.leg],edge=state.railway.edges.find(edge=>edge.id===leg?.edgeId),nodeId=leg?.reverse?edge?.to:edge?.from;
    return state.stations.some(station=>stationIds.includes(station.id)&&station.nodeId===nodeId);
  });
  const route=routes.find(route=>!state.trains.some(train=>train.routeId===route.id));
  if(!parked)return {...result,routeId:route?.id??null};
  const leg=parked.motion.path[parked.motion.leg]!,edge=state.railway.edges.find(edge=>edge.id===leg.edgeId)!,nodeId=leg.reverse?edge.to:edge.from;
  const station=state.stations.find(station=>station.nodeId===nodeId)!;
  return {...result,stage:route?'assign':'route',trainId:parked.id,routeId:route?.id??null,purchaseStationId:station.id};
}
