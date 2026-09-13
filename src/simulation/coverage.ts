import { stationDefinition } from '../content/stations.js';
import type { GameState, Id } from '../domain/model.js';
import { distance } from '../rail/geometry.js';

/** Each town resolves to at most one closest eligible station; station ID breaks ties. */
export function townCoverage(state:Pick<GameState,'towns'|'stations'|'railway'>):Map<Id<'town'>,Id<'station'>> {
  const nodes=new Map(state.railway.nodes.map(node=>[node.id,node]));
  const result=new Map<Id<'town'>,Id<'station'>>();
  for(const town of state.towns) {
    const eligible=state.stations.flatMap(station=>{
      const definition=stationDefinition(station.classId),node=nodes.get(station.nodeId);
      if(!definition||!node)return [];
      const separation=distance(town.position,node.position);
      return separation<=definition.coverageRadiusM?[{stationId:station.id,separation}]:[];
    }).sort((a,b)=>a.separation-b.separation||a.stationId.localeCompare(b.stationId));
    if(eligible[0])result.set(town.id,eligible[0].stationId);
  }
  return result;
}

/** Each industry resolves to one closest station under the same coverage rules as towns. */
export function industryCoverage(state:Pick<GameState,'industries'|'stations'|'railway'>):Map<Id<'industry'>,Id<'station'>> {
  const nodes=new Map(state.railway.nodes.map(node=>[node.id,node])),result=new Map<Id<'industry'>,Id<'station'>>();
  for(const industry of state.industries) {
    const eligible=state.stations.flatMap(station=>{
      const definition=stationDefinition(station.classId),node=nodes.get(station.nodeId);if(!definition||!node)return [];
      const separation=distance(industry.position,node.position);return separation<=definition.coverageRadiusM?[{stationId:station.id,separation}]:[];
    }).sort((a,b)=>a.separation-b.separation||a.stationId.localeCompare(b.stationId));
    if(eligible[0])result.set(industry.id,eligible[0].stationId);
  }
  return result;
}
