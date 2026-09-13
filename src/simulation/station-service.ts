import type { GameState, Id, Train } from '../domain/model.js';
import { RailNetwork } from '../rail/graph.js';

export const DWELL_TICKS=60;

/** Advance dwell and prepare the next ordered shuttle/loop leg. */
export function advanceDwell(state:GameState,train:Train,network:RailNetwork):void {
  train.dwellTicks++;
  if(train.dwellTicks<DWELL_TICKS)return;
  const route=train.routeId===null?null:state.routes.find(candidate=>candidate.id===train.routeId),service=state.operations.trainServices[train.id];
  if(!route||!service){train.phase='idle';train.dwellTicks=0;return;}
  const current=service.nextStopIndex;
  if(route.mode==='shuttle') {
    if(current===route.stops.length-1)service.direction=-1;
    else if(current===0)service.direction=1;
  } else service.direction=1;
  const next=(current+service.direction+route.stops.length)%route.stops.length;
  const stationNode=(index:number):Id<'node'>=>state.stations.find(station=>station.id===route.stops[index])!.nodeId;
  const path=network.findPath(stationNode(current),stationNode(next));
  if(!path){train.phase='blocked';train.speedMps=0;return;}
  service.nextStopIndex=next;train.motion={path,leg:0,distanceM:0,arrived:false};train.speedMps=0;train.phase='running';train.dwellTicks=0;
}
