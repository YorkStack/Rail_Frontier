import { industryDefinition } from '../content/industries.js';
import type { CargoKind, GameState, Industry } from '../domain/model.js';

const kinds:CargoKind[]=['passengers','timber','lumber'];
const totalInventory=(industry:Industry)=>kinds.reduce((sum,kind)=>sum+(industry.inventory[kind]??0),0);

function canComplete(industry:Industry,inputs:Partial<Record<CargoKind,number>>,outputs:Partial<Record<CargoKind,number>>,capacity:number):boolean {
  for(const kind of kinds)if((industry.inventory[kind]??0)<(inputs[kind]??0))return false;
  const consumed=kinds.reduce((sum,kind)=>sum+(inputs[kind]??0),0),produced=kinds.reduce((sum,kind)=>sum+(outputs[kind]??0),0);
  return totalInventory(industry)-consumed+produced<=capacity;
}

/** Advance every recipe by one fixed tick and commit a completed cycle atomically. */
export function advanceIndustries(state:GameState):void {
  for(const industry of [...state.industries].sort((a,b)=>a.id.localeCompare(b.id))) {
    const recipe=industryDefinition(industry.definitionId);if(!recipe)throw new Error(`Unknown industry: ${industry.definitionId}`);
    const current=state.operations.industryCycleTicks[industry.id]??0,progress=Math.min(recipe.cycleTicks,current+1);
    if(progress<recipe.cycleTicks){state.operations.industryCycleTicks[industry.id]=progress;continue;}
    if(!canComplete(industry,recipe.inputs,recipe.outputs,recipe.storageCapacity)){state.operations.industryCycleTicks[industry.id]=recipe.cycleTicks;continue;}
    for(const kind of kinds) {
      const next=(industry.inventory[kind]??0)-(recipe.inputs[kind]??0)+(recipe.outputs[kind]??0);
      if(next>0)industry.inventory[kind]=next;else delete industry.inventory[kind];
    }
    state.operations.industryCycleTicks[industry.id]=0;
  }
}
