import type { GameState,Id,Money,Route,Traversal } from '../domain/model.js';
import { compileCurve } from '../rail/geometry.js';
import { RailNetwork } from '../rail/graph.js';

export const ELECTRIFICATION_COST_PER_M=18_000;
export const ELECTRIFICATION_MAINTENANCE_RATE=.00004;

export interface ElectrificationSegment {edgeId:Id<'edge'>;lengthM:number;cost:Money;maintenancePerDay:Money}
export interface RouteElectrificationQuote {routeId:Id<'route'>;edgeIds:Id<'edge'>[];lengthM:number;cost:Money;maintenancePerDay:Money;segments:ElectrificationSegment[]}

function routePaths(state:Readonly<GameState>,route:Readonly<Route>):Traversal[][] {
  const network=new RailNetwork(structuredClone(state.railway)),nodes=route.stops.map(id=>state.stations.find(station=>station.id===id)?.nodeId);
  if(nodes.some(node=>!node))throw new Error('Route contains an unknown station');
  const count=route.mode==='loop'?nodes.length:nodes.length-1,paths:Traversal[][]=[];
  for(let index=0;index<count;index++) {
    const path=network.findPath(nodes[index]!,nodes[(index+1)%nodes.length]!);
    if(!path)throw new Error('Route contains disconnected stops');
    paths.push(path);
  }
  return paths;
}

export function routeTraversals(state:Readonly<GameState>,route:Readonly<Route>):Traversal[] {
  const seen=new Set<Id<'edge'>>(),result:Traversal[]=[];
  for(const path of routePaths(state,route))for(const traversal of path)if(!seen.has(traversal.edgeId)){seen.add(traversal.edgeId);result.push(traversal);}
  return result;
}

export function pathIsElectrified(state:Readonly<GameState>,path:readonly Traversal[]):boolean {
  return path.every(({edgeId})=>state.operations.infrastructure[edgeId]?.electrified===true);
}

export function routeIsElectrified(state:Readonly<GameState>,route:Readonly<Route>):boolean {
  return routeTraversals(state,route).every(({edgeId})=>state.operations.infrastructure[edgeId]?.electrified===true);
}

export function quoteRouteElectrification(state:Readonly<GameState>,routeId:Id<'route'>):RouteElectrificationQuote {
  const route=state.routes.find(candidate=>candidate.id===routeId);if(!route)throw new Error(`Unknown route: ${routeId}`);
  const segments=routeTraversals(state,route).flatMap(({edgeId})=>{
    const infrastructure=state.operations.infrastructure[edgeId];if(!infrastructure)throw new Error(`Route edge has no infrastructure record: ${edgeId}`);
    if(infrastructure.electrified)return [];
    const edge=state.railway.edges.find(candidate=>candidate.id===edgeId)!;
    const lengthM=compileCurve(edge.curve).lengthM,cost=Math.round(lengthM*ELECTRIFICATION_COST_PER_M),maintenancePerDay=Math.max(1,Math.round(cost*ELECTRIFICATION_MAINTENANCE_RATE));
    if(!Number.isSafeInteger(cost)||!Number.isSafeInteger(maintenancePerDay))throw new Error('Electrification quote exceeds finance range');
    return [{edgeId,lengthM,cost,maintenancePerDay}];
  });
  const totals=segments.reduce((sum,segment)=>({lengthM:sum.lengthM+segment.lengthM,cost:sum.cost+segment.cost,maintenancePerDay:sum.maintenancePerDay+segment.maintenancePerDay}),{lengthM:0,cost:0,maintenancePerDay:0});
  if(!Number.isFinite(totals.lengthM)||!Number.isSafeInteger(totals.cost)||!Number.isSafeInteger(totals.maintenancePerDay))throw new Error('Electrification quote exceeds finance range');
  return {routeId,edgeIds:segments.map(segment=>segment.edgeId),segments,...totals};
}
