import type { GameState } from '../domain/model.js';
import { ECONOMY_INTERVAL_TICKS } from './clock.js';
import { generateDailyDemand } from './demand.js';
import { createTrainSimulation } from './trains.js';
import { postDailyMaintenance } from './maintenance.js';
import { rebuildMonthlyAccounts } from './accounting.js';
import { evaluateObjectives } from './objectives.js';
import { advanceIndustries } from './industry.js';

export function createSimulationSystems():(state:GameState)=>void {
  const trains=createTrainSimulation();
  return state=>{
    trains(state);
    advanceIndustries(state);
    if(state.tick%ECONOMY_INTERVAL_TICKS===0){generateDailyDemand(state);postDailyMaintenance(state);rebuildMonthlyAccounts(state);}
    evaluateObjectives(state);
  };
}
