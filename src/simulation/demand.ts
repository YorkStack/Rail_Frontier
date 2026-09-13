import type { GameState, Id, Town } from '../domain/model.js';
import { distance } from '../rail/geometry.js';

interface Allocation {destination:Town;quantity:number;remainder:number}

export function dailyPassengerAllocations(origin:Town,towns:Town[]):Map<Id<'town'>,number> {
  const total=Math.floor(origin.population*.025),destinations=towns.filter(town=>town.id!==origin.id).sort((a,b)=>a.id.localeCompare(b.id));
  if(total<=0||destinations.length===0)return new Map();
  const weighted=destinations.map(destination=>({destination,weight:Math.sqrt(destination.population)/(1+distance(origin.position,destination.position)/10000)})),weightTotal=weighted.reduce((sum,item)=>sum+item.weight,0);
  const allocations:Allocation[]=weighted.map(item=>{const exact=total*item.weight/weightTotal,quantity=Math.floor(exact);return {destination:item.destination,quantity,remainder:exact-quantity};});
  let remaining=total-allocations.reduce((sum,item)=>sum+item.quantity,0);
  for(const item of [...allocations].sort((a,b)=>b.remainder-a.remainder||a.destination.id.localeCompare(b.destination.id)))if(remaining-->0)item.quantity++;
  return new Map(allocations.map(item=>[item.destination.id,item.quantity]));
}

/** Generate one dated OD batch and expire oldest excess beyond seven current days. */
export function generateDailyDemand(state:GameState):void {
  for(const origin of [...state.towns].sort((a,b)=>a.id.localeCompare(b.id)))for(const [destinationTownId,quantity] of dailyPassengerAllocations(origin,state.towns)) {
    if(quantity>0)state.operations.demand.push({originTownId:origin.id,destinationTownId,quantity,generatedTick:state.tick});
    const matching=state.operations.demand.filter(item=>item.originTownId===origin.id&&item.destinationTownId===destinationTownId).sort((a,b)=>a.generatedTick-b.generatedTick);
    let excess=matching.reduce((sum,item)=>sum+item.quantity,0)-quantity*7;
    for(const item of matching) {if(excess<=0)break;const removed=Math.min(excess,item.quantity);item.quantity-=removed;excess-=removed;}
  }
  state.operations.demand=state.operations.demand.filter(item=>item.quantity>0).sort((a,b)=>a.generatedTick-b.generatedTick||a.originTownId.localeCompare(b.originTownId)||a.destinationTownId.localeCompare(b.destinationTownId));
}
