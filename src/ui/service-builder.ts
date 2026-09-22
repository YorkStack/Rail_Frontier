import type {GameState,Id} from '../domain/model.js';
import {vehicleDefinition,freightCapacityOf} from '../content/vehicles.js';
import {stationDefinition} from '../content/stations.js';
import {stationHasExternalConnection,stationInternalEdges} from '../rail/station-layout.js';
import {RailNetwork} from '../rail/graph.js';

export interface ConsistDraft {
  stationId:Id<'station'>|null;
  locomotiveId:string;
  wagonId:string;
  wagonCount:number;
  year:number;
}

export interface ConsistPreview {
  valid:boolean;
  reason:string;
  purchaseCost:number;
  lengthM:number;
  platformLengthM:number;
  passengers:number;
  mail:number;
  freight:number;
  runningCostPerKm:number;
  maintenancePerDay:number;
  maxSpeedKmh:number;
}

export interface MissingRouteLeg {
  from:Id<'station'>;
  to:Id<'station'>;
}

/** Lists the exact consecutive station pairs that the current rail graph cannot connect. */
export function missingRouteLegs(state:Pick<GameState,'stations'|'railway'>,stops:readonly Id<'station'>[],mode:'shuttle'|'loop'):MissingRouteLeg[] {
  if(stops.length<2)return [];
  const network=new RailNetwork(state.railway),nodes=new Map(state.stations.map(station=>[station.id,station.nodeId])),missing:MissingRouteLeg[]=[];
  const legCount=mode==='loop'?stops.length:stops.length-1;
  for(let index=0;index<legCount;index++){
    const from=stops[index]!,to=stops[(index+1)%stops.length]!,fromNode=nodes.get(from),toNode=nodes.get(to);
    if(!fromNode||!toNode||!network.findPath(fromNode,toNode))missing.push({from,to});
  }
  return missing;
}

const empty=(reason:string):ConsistPreview=>({valid:false,reason,purchaseCost:0,lengthM:0,platformLengthM:0,passengers:0,mail:0,freight:0,runningCostPerKm:0,maintenancePerDay:0,maxSpeedKmh:0});

/** Read-only mirror of the authoritative purchase checks, used to explain a draft before committing it. */
export function previewConsist(state:Readonly<GameState>,draft:ConsistDraft):ConsistPreview {
  if(!draft.stationId)return empty('Build and connect a station before buying a train.');
  const station=state.stations.find(candidate=>candidate.id===draft.stationId);
  if(!station)return empty('Choose an available purchase station.');
  const platform=stationDefinition(station.classId);
  if(!platform)return empty('The selected station class is unavailable.');
  const locomotive=vehicleDefinition(draft.locomotiveId),wagon=vehicleDefinition(draft.wagonId);
  if(!locomotive||locomotive.kind!=='locomotive'||!wagon||wagon.kind!=='wagon'||!Number.isInteger(draft.wagonCount)||draft.wagonCount<1)return empty('Choose a locomotive and at least one car.');
  const definitions=[locomotive,...Array(draft.wagonCount).fill(wagon)] as const;
  const purchaseCost=definitions.reduce((sum,item)=>sum+item.purchaseCost,0),lengthM=definitions.reduce((sum,item)=>sum+item.lengthM,0),runningCostPerKm=definitions.reduce((sum,item)=>sum+item.runningCostPerKm,0),maintenancePerDay=definitions.reduce((sum,item)=>sum+item.maintenancePerDay,0);
  const preview:ConsistPreview={valid:true,reason:'Ready to purchase.',purchaseCost,lengthM,platformLengthM:platform.platformLengthM,passengers:draft.wagonCount*(wagon.capacity.passengers??0),mail:draft.wagonCount*(wagon.capacity.mail??0),freight:draft.wagonCount*freightCapacityOf(wagon),runningCostPerKm,maintenancePerDay,maxSpeedKmh:Math.round(Math.min(...definitions.map(item=>item.maxSpeedMps))*3.6)};
  if(definitions.some(item=>item.availableYear>draft.year))return {...preview,valid:false,reason:'A selected vehicle is not available yet.'};
  if(!stationHasExternalConnection(state,station))return {...preview,valid:false,reason:'Connect this station to the railway before buying a train.'};
  if(lengthM>platform.platformLengthM)return {...preview,valid:false,reason:`The ${Math.round(lengthM)} m train is too long for this ${platform.platformLengthM} m platform.`};
  if(state.company.cash<purchaseCost)return {...preview,valid:false,reason:'The company cannot afford this consist.'};
  const internal=stationInternalEdges(station),adjacent=state.railway.edges.filter(candidate=>(candidate.from===station.nodeId||candidate.to===station.nodeId)&&(station.layout.kind==='legacy-node'||internal.has(candidate.id)));
  if(adjacent.length===0)return {...preview,valid:false,reason:'Connect this station to the railway before buying a train.'};
  if(locomotive.traction==='electric'&&!adjacent.some(edge=>state.operations.infrastructure[edge.id]?.electrified))return {...preview,valid:false,reason:'Electric traction needs overhead line at this station.'};
  return preview;
}
