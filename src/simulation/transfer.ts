import { vehicleDefinition } from '../content/vehicles.js';
import type { GameState, Id, Money, Train } from '../domain/model.js';
import { townCoverage } from './coverage.js';
import { postIncome } from './finance.js';

const passengerCapacity=(train:Train)=>train.vehicleIds.reduce((sum,id)=>sum+(vehicleDefinition(id)?.capacity.passengers??0),0);

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
