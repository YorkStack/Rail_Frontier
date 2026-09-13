import { vehicleDefinition } from '../content/vehicles.js';
import { industryDefinition } from '../content/industries.js';
import type { CargoKind, GameState, Id, Industry, Money, Train } from '../domain/model.js';
import { industryCoverage, townCoverage } from './coverage.js';
import { postIncome } from './finance.js';

const passengerCapacity=(train:Train)=>train.vehicleIds.reduce((sum,id)=>sum+(vehicleDefinition(id)?.capacity.passengers??0),0);
const freightCapacity=(train:Train)=>train.vehicleIds.reduce((sum,id)=>{const capacity=vehicleDefinition(id)?.capacity;return sum+Math.max(capacity?.timber??0,capacity?.lumber??0);},0);
const inventoryTotal=(industry:Industry)=>(industry.inventory.timber??0)+(industry.inventory.lumber??0)+(industry.inventory.passengers??0);

/** Unload payable destinations once, then board oldest valid OD queues. */
export function servicePassengers(state:GameState,train:Train,stationId:Id<'station'>):void {
  const route=train.routeId===null?null:state.routes.find(candidate=>candidate.id===train.routeId);
  if(!route)return;
  const delivered=train.cargo.filter(lot=>lot.kind==='passengers'&&lot.destinationId===stationId);
  let fare:Money=0,quantity=0;
  for(const lot of delivered) {
    const unit=Math.max(1500,Math.round(lot.distanceM/1000*35)),amount=lot.quantity*unit;
    if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(fare+amount))throw new Error('Passenger fare exceeds finance range');
    fare+=amount;quantity+=lot.quantity;
  }
  const service=state.operations.trainServices[train.id];if(!service)throw new Error('Train service state is missing');
  if(!Number.isSafeInteger(service.revenue+fare)||!Number.isSafeInteger(state.operations.delivered.passengers+quantity))throw new Error('Passenger totals exceed range');
  if(fare>0)postIncome(state,'passenger',fare,train.id,`Passenger fares at ${stationId}`);
  if(delivered.length>0)train.cargo=train.cargo.filter(lot=>!delivered.includes(lot));
  service.revenue+=fare;state.operations.delivered.passengers+=quantity;

  let free=passengerCapacity(train)-train.cargo.filter(lot=>lot.kind==='passengers').reduce((sum,lot)=>sum+lot.quantity,0);
  if(free<=0)return;
  const coverage=townCoverage(state),originTowns=[...coverage].filter(([,covered])=>covered===stationId).map(([town])=>town),routeStops=new Set(route.stops);
  const queues=state.operations.demand.filter(queue=>originTowns.includes(queue.originTownId)).map(queue=>({queue,destination:coverage.get(queue.destinationTownId)})).filter((item):item is typeof item&{destination:Id<'station'>}=>item.destination!==undefined&&item.destination!==stationId&&routeStops.has(item.destination)).sort((a,b)=>a.queue.generatedTick-b.queue.generatedTick||a.queue.destinationTownId.localeCompare(b.queue.destinationTownId));
  for(const {queue,destination} of queues) {
    const boarded=Math.min(free,queue.quantity);if(boarded<=0)continue;
    train.cargo.push({kind:'passengers',quantity:boarded,destinationId:destination,originId:stationId,loadedTick:state.tick,distanceM:0});
    queue.quantity-=boarded;free-=boarded;if(free===0)break;
  }
  state.operations.demand=state.operations.demand.filter(queue=>queue.quantity>0);
}

function industriesAtStation(state:GameState,stationId:Id<'station'>):Industry[] {
  const coverage=industryCoverage(state);
  return state.industries.filter(industry=>coverage.get(industry.id)===stationId).sort((a,b)=>a.id.localeCompare(b.id));
}

function freightDestination(state:GameState,routeStops:Id<'station'>[],current:Id<'station'>,kind:'timber'|'lumber'):Id<'station'>|undefined {
  const coverage=industryCoverage(state);
  for(const stationId of routeStops) {
    if(stationId===current)continue;
    if(kind==='timber'&&state.industries.some(industry=>industry.definitionId==='sawmill'&&coverage.get(industry.id)===stationId))return stationId;
    const station=state.stations.find(candidate=>candidate.id===stationId);if(kind==='lumber'&&station?.townId!=null)return stationId;
  }
  return undefined;
}

function postFreightDelivery(state:GameState,train:Train,stationId:Id<'station'>,kind:'timber'|'lumber',quantity:number,distanceM:number):void {
  if(quantity<=0)return;
  const unitFare=Math.max(1,Math.round(distanceM/1000*25)),fare=quantity*unitFare,service=state.operations.trainServices[train.id];
  if(!Number.isSafeInteger(fare)||!service||!Number.isSafeInteger(service.revenue+fare)||!Number.isSafeInteger(state.operations.delivered[kind]+quantity))throw new Error('Freight totals exceed range');
  postIncome(state,'freight',fare,train.id,`${kind==='timber'?'Timber':'Lumber'} freight at ${stationId}`);
  service.revenue+=fare;state.operations.delivered[kind]+=quantity;
}

/** Deliver industrial inputs and town lumber, then load the next valid route shipment. */
export function serviceFreight(state:GameState,train:Train,stationId:Id<'station'>):void {
  const route=train.routeId===null?null:state.routes.find(candidate=>candidate.id===train.routeId);if(!route)return;
  const station=state.stations.find(candidate=>candidate.id===stationId);if(!station)return;
  const local=industriesAtStation(state,stationId),sawmill=local.find(industry=>industry.definitionId==='sawmill');
  const retained=[] as Train['cargo'];
  for(const lot of train.cargo) {
    if(lot.destinationId!==stationId||(lot.kind!=='timber'&&lot.kind!=='lumber')){retained.push(lot);continue;}
    let delivered=0;
    if(lot.kind==='timber'&&sawmill) {
      const recipe=industryDefinition(sawmill.definitionId)!;
      delivered=Math.min(lot.quantity,Math.max(0,recipe.storageCapacity-inventoryTotal(sawmill)));
      if(delivered>0)sawmill.inventory.timber=(sawmill.inventory.timber??0)+delivered;
    } else if(lot.kind==='lumber'&&station.townId!==null)delivered=lot.quantity;
    if(delivered>0)postFreightDelivery(state,train,stationId,lot.kind,delivered,lot.distanceM);
    if(delivered<lot.quantity)retained.push({...lot,quantity:lot.quantity-delivered});
  }
  train.cargo=retained;

  let free=freightCapacity(train)-train.cargo.filter(lot=>lot.kind==='timber'||lot.kind==='lumber').reduce((sum,lot)=>sum+lot.quantity,0);
  if(free<=0)return;
  for(const kind of ['timber','lumber'] as const) {
    const source=local.find(industry=>industry.definitionId===(kind==='timber'?'forest':'sawmill'));
    const destination=freightDestination(state,route.stops,stationId,kind),available=source?.inventory[kind]??0;
    if(!source||!destination||available<=0)continue;
    const loaded=Math.min(free,available);source.inventory[kind]=available-loaded;
    if(source.inventory[kind]===0)delete source.inventory[kind];
    const existing=train.cargo.find(lot=>lot.kind===kind&&lot.destinationId===destination&&lot.originId===stationId&&lot.distanceM===0);
    if(existing)existing.quantity+=loaded;
    else train.cargo.push({kind,quantity:loaded,destinationId:destination,originId:stationId,loadedTick:state.tick,distanceM:0});
    free-=loaded;if(free===0)break;
  }
}

export function serviceStop(state:GameState,train:Train,stationId:Id<'station'>):void {
  servicePassengers(state,train,stationId);
  serviceFreight(state,train,stationId);
}
