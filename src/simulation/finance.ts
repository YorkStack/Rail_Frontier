import { allocateId, type GameState, type Id, type Money, type Transaction } from '../domain/model.js';

export type TransactionCategory=Transaction['category'];

export interface TransactionPost {
  category:TransactionCategory;
  amount:Money;
  entityId:string;
  description:string;
}

function requireMoney(value:number,label:string):void {
  if(!Number.isSafeInteger(value)||value===0)throw new Error(`${label} must be a non-zero safe integer`);
}

function requirePositiveMoney(value:number,label:string):void {
  if(!Number.isSafeInteger(value)||value<=0)throw new Error(`${label} must be a positive safe integer`);
}

/** Post one transaction while preserving cash = openingCash + ledger sum. */
export function postTransaction(state:GameState,post:TransactionPost):Id<'transaction'> {
  requireMoney(post.amount,'Transaction amount');
  if(post.entityId.length===0||post.description.length===0)throw new Error('Transaction metadata is required');
  const income=post.category==='passenger'||post.category==='freight';
  if(income!==post.amount>0)throw new Error('Transaction amount has the wrong sign for its category');
  if(reconcileCash(state)!==state.company.cash)throw new Error('Ledger does not reconcile');
  const cash=state.company.cash+post.amount;
  if(!Number.isSafeInteger(cash))throw new Error('Transaction exceeds finance range');
  if(cash<0)throw new Error('Insufficient funds');
  const id=allocateId(state,'transaction');
  state.company.ledger.push({id,tick:state.tick,...post});
  state.company.cash=cash;
  return id;
}

export function postExpense(state:GameState,category:'construction'|'vehicle'|'maintenance',amount:Money,entityId:string,description:string):Id<'transaction'> {
  requirePositiveMoney(amount,'Expense');
  return postTransaction(state,{category,amount:-amount,entityId,description});
}

export function postIncome(state:GameState,category:'passenger'|'freight',amount:Money,entityId:string,description:string):Id<'transaction'> {
  requirePositiveMoney(amount,'Income');
  return postTransaction(state,{category,amount,entityId,description});
}

export function reconcileCash(state:Pick<GameState,'company'>):Money {
  let cash=state.company.openingCash;
  for(const transaction of state.company.ledger) {
    if(!Number.isSafeInteger(transaction.amount))throw new Error('Ledger contains invalid money');
    cash+=transaction.amount;
    if(!Number.isSafeInteger(cash))throw new Error('Ledger exceeds finance range');
  }
  return cash;
}

/** Convert fractional per-kilometre operating cost into exact ledger postings. */
export function accrueRunningCost(state:GameState,trainId:Id<'train'>,distanceM:number,costPerKm:Money):Money {
  if(!Number.isFinite(distanceM)||distanceM<0)throw new Error('Running distance must be finite and non-negative');
  if(!Number.isSafeInteger(costPerKm)||costPerKm<0)throw new Error('Running cost must be a non-negative safe integer');
  const service=state.operations.trainServices[trainId];
  if(!service||!state.trains.some(train=>train.id===trainId))throw new Error('Unknown train service');
  const total=service.costRemainder+distanceM/1000*costPerKm;
  if(!Number.isFinite(total)||total>Number.MAX_SAFE_INTEGER)throw new Error('Running cost exceeds finance range');
  const whole=Math.floor(total),remainder=total-whole;
  const nextDistance=service.distanceM+distanceM,nextOperating=service.operatingCosts+whole;
  if(!Number.isFinite(nextDistance)||!Number.isSafeInteger(nextOperating)||remainder<0||remainder>=1)throw new Error('Invalid running cost accumulation');
  if(whole>0)postExpense(state,'maintenance',whole,trainId,'Train running cost');
  service.distanceM=nextDistance;
  service.operatingCosts=nextOperating;
  service.costRemainder=remainder;
  return whole;
}
