import type { GameState, Id, Money, Transaction } from '../domain/model.js';
import { ECONOMY_INTERVAL_TICKS } from './clock.js';
import { stationDefinition } from '../content/stations.js';
import { vehicleDefinition } from '../content/vehicles.js';

export const accountingMonth=(tick:number)=>Math.floor(tick/(ECONOMY_INTERVAL_TICKS*30));

export interface AccountReport {
  revenue:Money;
  operatingCost:Money;
  capitalCost:Money;
  operatingProfit:Money;
}

export interface TrainReport extends AccountReport {
  trainId:Id<'train'>;
  routeId:Id<'route'>|null;
  distanceM:number;
}

export interface RouteReport extends AccountReport {
  routeId:Id<'route'>;
  trainIds:Id<'train'>[];
  distanceM:number;
}

export interface CompanyReport extends AccountReport {
  cash:Money;
  companyValue:Money;
  ownedAssetValue:Money;
  infrastructureCost:Money;
  stationValue:Money;
  vehicleValue:Money;
  month:number;
  currentMonth:AccountReport;
  trains:TrainReport[];
  routes:RouteReport[];
}

const checkedAdd=(left:number,right:number,label:string):number=>{
  const value=left+right;
  if(!Number.isSafeInteger(value))throw new Error(`${label} exceeds finance range`);
  return value;
};

function accountReport(transactions:readonly Transaction[]):AccountReport {
  let revenue=0,operatingCost=0,capitalCost=0;
  for(const transaction of transactions) {
    const amount=Math.abs(transaction.amount);
    if(transaction.category==='passenger'||transaction.category==='mail'||transaction.category==='freight')revenue=checkedAdd(revenue,transaction.amount,'Revenue');
    else if(transaction.category==='maintenance')operatingCost=checkedAdd(operatingCost,amount,'Operating cost');
    else capitalCost=checkedAdd(capitalCost,amount,'Capital cost');
  }
  return {revenue,operatingCost,capitalCost,operatingProfit:checkedAdd(revenue,-operatingCost,'Operating profit')};
}

/** Build live management reports without mutating or duplicating authoritative state. */
export function companyReport(state:Readonly<GameState>):CompanyReport {
  const totals=accountReport(state.company.ledger),month=accountingMonth(state.tick);
  const currentMonth=accountReport(state.company.ledger.filter(transaction=>accountingMonth(transaction.tick)===month));
  const infrastructureCost=Object.values(state.operations.infrastructure).reduce((sum,item)=>checkedAdd(checkedAdd(sum,item.constructionCost,'Infrastructure cost'),item.electrificationCost,'Infrastructure cost'),0);
  const stationValue=state.stations.reduce((sum,station)=>{const definition=stationDefinition(station.classId);if(!definition)throw new Error(`Unknown station class in report: ${station.classId}`);return checkedAdd(sum,definition.purchaseCost,'Station value');},0);
  const vehicleValue=state.trains.reduce((sum,train)=>{
    const ids=[train.locomotiveId,...train.vehicleIds];
    return ids.reduce((trainSum,id)=>{const definition=vehicleDefinition(id);if(!definition)throw new Error(`Unknown vehicle in report: ${id}`);return checkedAdd(trainSum,definition.purchaseCost,'Vehicle value');},sum);
  },0);
  const ownedAssetValue=checkedAdd(checkedAdd(infrastructureCost,stationValue,'Owned asset value'),vehicleValue,'Owned asset value');
  const trains=state.trains.map<TrainReport>(train=>{
    const service=state.operations.trainServices[train.id],revenue=service?.revenue??0,operatingCost=service?.operatingCosts??0;
    return {trainId:train.id,routeId:train.routeId,revenue,operatingCost,capitalCost:0,operatingProfit:checkedAdd(revenue,-operatingCost,'Train profit'),distanceM:service?.distanceM??0};
  });
  const routes=state.routes.map<RouteReport>(route=>{
    const assigned=trains.filter(train=>train.routeId===route.id);
    let revenue=0,operatingCost=0,distanceM=0;
    for(const train of assigned) {
      revenue=checkedAdd(revenue,train.revenue,'Route revenue');
      operatingCost=checkedAdd(operatingCost,train.operatingCost,'Route operating cost');
      distanceM+=train.distanceM;
      if(!Number.isFinite(distanceM))throw new Error('Route distance exceeds reporting range');
    }
    return {routeId:route.id,trainIds:assigned.map(train=>train.trainId),revenue,operatingCost,capitalCost:0,operatingProfit:checkedAdd(revenue,-operatingCost,'Route profit'),distanceM};
  });
  return {...totals,cash:state.company.cash,companyValue:checkedAdd(state.company.cash,ownedAssetValue,'Company value'),ownedAssetValue,infrastructureCost,stationValue,vehicleValue,month,currentMonth,trains,routes};
}

export function rebuildMonthlyAccounts(state:GameState):void {
  const accounts=new Map<number,{month:number;revenue:Money;operatingCost:Money;capitalCost:Money}>();
  for(const transaction of state.company.ledger) {
    const month=accountingMonth(transaction.tick),entry=accounts.get(month)??{month,revenue:0,operatingCost:0,capitalCost:0},amount=Math.abs(transaction.amount);
    if(transaction.category==='passenger'||transaction.category==='mail'||transaction.category==='freight')entry.revenue+=transaction.amount;
    else if(transaction.category==='maintenance')entry.operatingCost+=amount;
    else entry.capitalCost+=amount;
    if(!Number.isSafeInteger(entry.revenue)||!Number.isSafeInteger(entry.operatingCost)||!Number.isSafeInteger(entry.capitalCost))throw new Error('Monthly accounts exceed finance range');
    accounts.set(month,entry);
  }
  state.operations.monthlyAccounts=[...accounts.values()].sort((a,b)=>a.month-b.month);
}
