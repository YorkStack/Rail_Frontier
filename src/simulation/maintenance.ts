import { stationDefinition } from '../content/stations.js';
import { vehicleDefinition } from '../content/vehicles.js';
import type { GameState, Money } from '../domain/model.js';
import { postExpense } from './finance.js';

interface Charge {amount:Money;entityId:string;description:string;trainId?:string}

export function postDailyMaintenance(state:GameState):void {
  const charges:Charge[]=[];
  for(const [edgeId,infrastructure] of Object.entries(state.operations.infrastructure))if(infrastructure.maintenancePerDay>0)charges.push({amount:infrastructure.maintenancePerDay,entityId:edgeId,description:'Track daily maintenance'});
  for(const station of state.stations) {const amount=stationDefinition(station.classId)?.maintenancePerDay;if(amount)charges.push({amount,entityId:station.id,description:'Station daily maintenance'});}
  for(const train of state.trains) {
    const definitions=[vehicleDefinition(train.locomotiveId),...train.vehicleIds.map(vehicleDefinition)];
    if(definitions.some(value=>!value))throw new Error('Train contains unknown vehicle content');
    const amount=definitions.reduce((sum,value)=>sum+value!.maintenancePerDay,0);
    if(amount>0)charges.push({amount,entityId:train.id,description:'Train daily maintenance',trainId:train.id});
  }
  const total=charges.reduce((sum,charge)=>sum+charge.amount,0);
  if(!Number.isSafeInteger(total))throw new Error('Daily maintenance exceeds finance range');
  if(total>state.company.cash){for(const train of state.trains){train.phase='blocked';train.speedMps=0;}return;}
  if(state.nextEntityId+charges.length>Number.MAX_SAFE_INTEGER)throw new Error('Invalid ID counter');
  for(const charge of charges) {
    postExpense(state,'maintenance',charge.amount,charge.entityId,charge.description);
    if(charge.trainId) {
      const service=state.operations.trainServices[charge.trainId as keyof typeof state.operations.trainServices];
      if(service){service.operatingCosts+=charge.amount;service.ageDays++;}
    }
  }
}
