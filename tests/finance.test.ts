import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/content/norway.js';
import type { GameState } from '../src/domain/model.js';
import { accrueRunningCost, postExpense, postIncome, postTransaction, reconcileCash } from '../src/simulation/finance.js';

const smallCompany=():GameState=>{
  const state=createInitialState();
  state.company.openingCash=100;
  state.company.cash=100;
  return state;
};

test('expense and income postings allocate IDs and reconcile cash',()=>{
  const state=smallCompany();
  assert.equal(postExpense(state,'construction',40,'edge:future','Track works'),'transaction:5');
  assert.equal(postIncome(state,'passenger',15,'train:future','Passenger fares'),'transaction:6');
  assert.equal(state.company.cash,75);
  assert.equal(reconcileCash(state),75);
  assert.deepEqual(state.company.ledger.map(entry=>[entry.category,entry.amount]),[['construction',-40],['passenger',15]]);
});

test('overdraft and invalid postings leave finance byte-identical',()=>{
  const cases=[
    (state:GameState)=>postExpense(state,'vehicle',101,'train:new','Purchase'),
    (state:GameState)=>postIncome(state,'freight',0,'industry:2','Freight'),
    (state:GameState)=>postTransaction(state,{category:'construction',amount:1,entityId:'edge:new',description:'Wrong sign'}),
    (state:GameState)=>postTransaction(state,{category:'passenger',amount:Number.MAX_SAFE_INTEGER,entityId:'train:2',description:'Overflow'})
  ];
  for(const attempt of cases) {
    const state=smallCompany(),before=structuredClone(state);
    assert.throws(()=>attempt(state));
    assert.deepEqual(state,before);
  }
});

test('running cost carries fractional minor units and posts only whole amounts',()=>{
  const state=smallCompany();
  state.trains.push({id:'train:5',routeId:null,locomotiveId:'test-loco',vehicleIds:[],motion:{path:[],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'idle',dwellTicks:0,cargo:[]});
  state.operations.trainServices['train:5']={nextStopIndex:0,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};
  state.nextEntityId=6;
  assert.equal(accrueRunningCost(state,'train:5',250,3),0);
  assert.equal(state.company.ledger.length,0);
  assert.equal(accrueRunningCost(state,'train:5',250,3),1);
  assert.equal(accrueRunningCost(state,'train:5',500,3),2);
  assert.equal(state.operations.trainServices['train:5']!.costRemainder,0);
  assert.equal(state.operations.trainServices['train:5']!.operatingCosts,3);
  assert.equal(state.operations.trainServices['train:5']!.distanceM,1000);
  assert.equal(state.company.cash,97);
});

test('unaffordable running cost leaves service and ledger unchanged',()=>{
  const state=smallCompany();
  state.trains.push({id:'train:5',routeId:null,locomotiveId:'test-loco',vehicleIds:[],motion:{path:[],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'idle',dwellTicks:0,cargo:[]});
  state.operations.trainServices['train:5']={nextStopIndex:0,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:.25};
  state.nextEntityId=6;
  const before=structuredClone(state);
  assert.throws(()=>accrueRunningCost(state,'train:5',1000,101),/Insufficient funds/);
  assert.deepEqual(state,before);
});
