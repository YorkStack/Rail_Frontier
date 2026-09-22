import { vehicleDefinition } from '../content/vehicles.js';
import { industryDefinition } from '../content/industries.js';
import type { CargoKind, GameState, Id, Industry, Money, Train } from '../domain/model.js';
import { industryCoverage, townCoverage } from './coverage.js';
import { postIncome } from './finance.js';

const passengerCapacity=(train:Train)=>train.vehicleIds.reduce((sum,id)=>sum+(vehicleDefinition(id)?.capacity.passengers??0),0);
const mailCapacity=(train:Train)=>train.vehicleIds.reduce((sum,id)=>sum+(vehicleDefinition(id)?.capacity.mail??0),0);
const freightKinds=['timber','lumber','coal','ore','steel','oil'] as const;
type FreightKind=typeof freightKinds[number];
const isFreight=(kind:CargoKind):kind is FreightKind=>freightKinds.includes(kind as FreightKind);
/** Reserve occupied wagon space before finding room for a compatible new shipment. */
export function freightRoom(train:Train,kind:FreightKind):number {
 const wagons=train.vehicleIds.map(id=>({capacity:vehicleDefinition(id)?.capacity??{},used:0}));
 for(const lot of train.cargo.filter(l=>isFreight(l.kind))){let remaining=lot.quantity;
  const compatible=wagons.filter(w=>(w.capacity[lot.kind]??0)>0).sort((a,b)=>Object.keys(a.capacity).length-Object.keys(b.capacity).length);
  for(const w of compatible){const amount=Math.min(remaining,Math.max(0,(w.capacity[lot.kind]??0)-w.used));w.used+=amount;remaining-=amount;}if(remaining>0)return 0;
 }
 return wagons.reduce((sum,w)=>sum+Math.max(0,(w.capacity[kind]??0)-w.used),0);
}
const inventoryTotal=(industry:Industry)=>Object.values(industry.inventory).reduce((sum,quantity)=>sum+(quantity??0),0);

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

function mailDestination(state:GameState,routeStops:readonly Id<'station'>[],current:Id<'station'>,originTownId:Id<'town'>):Id<'station'>|undefined {
  const origin=state.towns.find(town=>town.id===originTownId);if(!origin)return undefined;
  const coverage=townCoverage(state),destinations=routeStops.filter(stationId=>stationId!==current).flatMap(stationId=>state.towns.filter(town=>coverage.get(town.id)===stationId).map(town=>({stationId,town,distance:Math.hypot(town.position.x-origin.position.x,town.position.z-origin.position.z)})));
  destinations.sort((a,b)=>b.distance-a.distance||a.town.id.localeCompare(b.town.id)||a.stationId.localeCompare(b.stationId));
  return destinations[0]?.stationId;
}

/** Deliver addressed mail once, then fill the train's separate mail compartments with local outbound bags. */
export function serviceMail(state:GameState,train:Train,stationId:Id<'station'>):void {
  const route=train.routeId===null?null:state.routes.find(candidate=>candidate.id===train.routeId);if(!route)return;
  const delivered=train.cargo.filter(lot=>lot.kind==='mail'&&lot.destinationId===stationId);
  let fare:Money=0,quantity=0;
  for(const lot of delivered) {
    const unit=Math.max(800,Math.round(lot.distanceM/1000*18)),amount=lot.quantity*unit;
    if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(fare+amount))throw new Error('Mail fare exceeds finance range');
    fare+=amount;quantity+=lot.quantity;
  }
  const service=state.operations.trainServices[train.id];if(!service)throw new Error('Train service state is missing');
  if(!Number.isSafeInteger(service.revenue+fare)||!Number.isSafeInteger(state.operations.delivered.mail+quantity))throw new Error('Mail totals exceed range');
  if(fare>0)postIncome(state,'mail',fare,train.id,`Mail delivery at ${stationId}`);
  if(delivered.length>0)train.cargo=train.cargo.filter(lot=>!delivered.includes(lot));
  service.revenue+=fare;state.operations.delivered.mail+=quantity;

  let free=mailCapacity(train)-train.cargo.filter(lot=>lot.kind==='mail').reduce((sum,lot)=>sum+lot.quantity,0);
  if(free<=0)return;
  const coverage=townCoverage(state),origins=state.towns.filter(town=>coverage.get(town.id)===stationId).sort((a,b)=>a.id.localeCompare(b.id));
  for(const town of origins) {
    const economy=state.operations.townEconomy[town.id];if(!economy)throw new Error('Town economy is missing');
    const destination=mailDestination(state,route.stops,stationId,town.id),loaded=Math.min(free,economy.mailWaiting);
    if(!destination||loaded<=0)continue;
    economy.mailWaiting-=loaded;
    const existing=train.cargo.find(lot=>lot.kind==='mail'&&lot.destinationId===destination&&lot.originId===stationId&&lot.distanceM===0);
    if(existing)existing.quantity+=loaded;
    else train.cargo.push({kind:'mail',quantity:loaded,destinationId:destination,originId:stationId,loadedTick:state.tick,distanceM:0});

  }
}

function industriesAtStation(state:GameState,stationId:Id<'station'>):Industry[] {
  const coverage=industryCoverage(state);
  return state.industries.filter(industry=>coverage.get(industry.id)===stationId).sort((a,b)=>a.id.localeCompare(b.id));
}

function freightDestination(state:GameState,routeStops:Id<'station'>[],current:Id<'station'>,kind:FreightKind):Id<'station'>|undefined {
  const coverage=industryCoverage(state);
  for(const stationId of routeStops) {
    if(stationId===current)continue;
    if(state.industries.some(industry=>(industryDefinition(industry.definitionId)?.inputs[kind]??0)>0&&coverage.get(industry.id)===stationId))return stationId;
    const station=state.stations.find(candidate=>candidate.id===stationId);if(kind==='lumber'&&station?.townId!=null&&(state.operations.townEconomy[station.townId]?.lumberDemand??0)>0)return stationId;
  }
  return undefined;
}

function postFreightDelivery(state:GameState,train:Train,stationId:Id<'station'>,kind:FreightKind,quantity:number,distanceM:number):void {
  if(quantity<=0)return;
  const unitFare=Math.max(1,Math.round(distanceM/1000*25)),fare=quantity*unitFare,service=state.operations.trainServices[train.id];
  if(!Number.isSafeInteger(fare)||!service||!Number.isSafeInteger(service.revenue+fare)||!Number.isSafeInteger((state.operations.delivered[kind]??0)+quantity))throw new Error('Freight totals exceed range');
  postIncome(state,'freight',fare,train.id,`${kind} freight at ${stationId}`);
  service.revenue+=fare;state.operations.delivered[kind]=(state.operations.delivered[kind]??0)+quantity;
}

/** Deliver industrial inputs and town lumber, then load the next valid route shipment. */
export function serviceFreight(state:GameState,train:Train,stationId:Id<'station'>):void {
  const route=train.routeId===null?null:state.routes.find(candidate=>candidate.id===train.routeId);if(!route)return;
  const station=state.stations.find(candidate=>candidate.id===stationId);if(!station)return;
  const local=industriesAtStation(state,stationId),sawmill=local.find(industry=>industry.definitionId==='sawmill');
  const retained=[] as Train['cargo'];
  for(const lot of train.cargo) {
    if(lot.destinationId!==stationId||!isFreight(lot.kind)){retained.push(lot);continue;}
    let delivered=0;
    const receiver=local.find(i=>(industryDefinition(i.definitionId)?.inputs[lot.kind]??0)>0);
    if(receiver) {
      const recipe=industryDefinition(receiver.definitionId)!;
      delivered=Math.min(lot.quantity,Math.max(0,recipe.storageCapacity-inventoryTotal(receiver)));
      if(delivered>0)receiver.inventory[lot.kind]=(receiver.inventory[lot.kind]??0)+delivered;
    } else if(lot.kind==='lumber'&&station.townId!==null) {
      const economy=state.operations.townEconomy[station.townId];if(!economy)throw new Error('Town economy is missing');
      delivered=Math.min(lot.quantity,economy.lumberDemand);if(!Number.isSafeInteger(economy.lumberDelivered+delivered)||!Number.isSafeInteger(economy.lumberReceivedToday+delivered))throw new Error('Town delivery exceeds range');economy.lumberDemand-=delivered;economy.lumberDelivered+=delivered;economy.lumberReceivedToday+=delivered;
    }
    if(delivered>0)postFreightDelivery(state,train,stationId,lot.kind,delivered,lot.distanceM);
    if(delivered<lot.quantity)retained.push({...lot,quantity:lot.quantity-delivered});
  }
  train.cargo=retained;

  for(const kind of freightKinds) {
    const free=freightRoom(train,kind);if(free<=0)continue;
    const source=local.find(industry=>(industryDefinition(industry.definitionId)?.outputs[kind]??0)>0);
    const destination=freightDestination(state,route.stops,stationId,kind),available=source?.inventory[kind]??0;
    if(!source||!destination||available<=0)continue;
    const loaded=Math.min(free,available);source.inventory[kind]=available-loaded;
    if(source.inventory[kind]===0)delete source.inventory[kind];
    const existing=train.cargo.find(lot=>lot.kind===kind&&lot.destinationId===destination&&lot.originId===stationId&&lot.distanceM===0);
    if(existing)existing.quantity+=loaded;
    else train.cargo.push({kind,quantity:loaded,destinationId:destination,originId:stationId,loadedTick:state.tick,distanceM:0});

  }
}

export function serviceStop(state:GameState,train:Train,stationId:Id<'station'>):void {
  servicePassengers(state,train,stationId);
  serviceMail(state,train,stationId);
  serviceFreight(state,train,stationId);
}
