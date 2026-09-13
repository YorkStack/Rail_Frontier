import type { GameState, Money } from '../domain/model.js';
import { ECONOMY_INTERVAL_TICKS } from './clock.js';

export const accountingMonth=(tick:number)=>Math.floor(tick/(ECONOMY_INTERVAL_TICKS*30));

export function rebuildMonthlyAccounts(state:GameState):void {
  const accounts=new Map<number,{month:number;revenue:Money;operatingCost:Money;capitalCost:Money}>();
  for(const transaction of state.company.ledger) {
    const month=accountingMonth(transaction.tick),entry=accounts.get(month)??{month,revenue:0,operatingCost:0,capitalCost:0},amount=Math.abs(transaction.amount);
    if(transaction.category==='passenger'||transaction.category==='freight')entry.revenue+=transaction.amount;
    else if(transaction.category==='maintenance')entry.operatingCost+=amount;
    else entry.capitalCost+=amount;
    if(!Number.isSafeInteger(entry.revenue)||!Number.isSafeInteger(entry.operatingCost)||!Number.isSafeInteger(entry.capitalCost))throw new Error('Monthly accounts exceed finance range');
    accounts.set(month,entry);
  }
  state.operations.monthlyAccounts=[...accounts.values()].sort((a,b)=>a.month-b.month);
}
