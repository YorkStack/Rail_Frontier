import type { CommandHandler, CommandHandlers } from './commands.js';
import type { GameCommand } from './ports.js';
import { vehicleDefinition } from '../content/vehicles.js';
import { allocateId, type Money } from '../domain/model.js';
import { ECONOMY_INTERVAL_TICKS } from '../simulation/clock.js';
import { postExpense } from '../simulation/finance.js';

type PurchaseTrain=Extract<GameCommand,{type:'purchaseTrain'}>;

export const purchaseTrainHandler:CommandHandler<PurchaseTrain>=(state,command)=>{
  const station=state.stations.find(candidate=>candidate.id===command.stationId)!;
  const locomotive=vehicleDefinition(command.locomotiveId);
  if(!locomotive||locomotive.kind!=='locomotive')throw new Error(`Unknown locomotive: ${command.locomotiveId}`);
  const vehicles=command.vehicleIds.map(id=>vehicleDefinition(id));
  const invalidIndex=vehicles.findIndex(vehicle=>!vehicle||vehicle.kind!=='wagon');
  if(invalidIndex>=0)throw new Error(`Unknown rail vehicle: ${command.vehicleIds[invalidIndex]}`);
  const year=1900+Math.floor(state.tick/(ECONOMY_INTERVAL_TICKS*360));
  if([locomotive,...vehicles].some(vehicle=>vehicle!.availableYear>year))throw new Error('A selected vehicle is not available yet');
  const cost=[locomotive,...vehicles].reduce<Money>((sum,vehicle)=>sum+vehicle!.purchaseCost,0);
  if(!Number.isSafeInteger(cost))throw new Error('Vehicle purchase exceeds finance range');
  if(state.company.cash<cost)throw new Error('Insufficient funds');
  const edge=state.railway.edges.find(candidate=>candidate.from===station.nodeId||candidate.to===station.nodeId);
  if(!edge)throw new Error('Purchase station is disconnected from track');
  const id=allocateId(state,'train'),reverse=edge.to===station.nodeId;
  state.trains.push({id,routeId:null,locomotiveId:locomotive.id,vehicleIds:[...command.vehicleIds],motion:{path:[{edgeId:edge.id,reverse}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'idle',dwellTicks:0,cargo:[]});
  state.operations.trainServices[id]={nextStopIndex:0,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};
  postExpense(state,'vehicle',cost,id,'Train purchase');
  return {createdIds:[id]};
};

export const trainCommandHandlers:CommandHandlers={purchaseTrain:purchaseTrainHandler};
