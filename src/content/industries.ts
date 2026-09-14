import { allocateId, type CampaignDefinition,type CargoKind, type GameState, type Industry } from '../domain/model.js';
import type { IndustryRecipe } from '../domain/operations.js';
import { createInitialState, norway } from './norway.js';
import { norwayElevationForWorld } from '../world/generator.js';

export const industryDefinitions=Object.freeze({
  forest:Object.freeze<IndustryRecipe>({id:'forest',inputs:{},outputs:{timber:20},cycleTicks:1200,storageCapacity:500}),
  sawmill:Object.freeze<IndustryRecipe>({id:'sawmill',inputs:{timber:10},outputs:{lumber:7},cycleTicks:600,storageCapacity:500})
});

export type IndustryDefinitionId=keyof typeof industryDefinitions;
export const industryDefinition=(id:string):IndustryRecipe|undefined=>industryDefinitions[id as IndustryDefinitionId];
export const industryName=(id:string):string=>id==='forest'?'Granli Forest':id==='sawmill'?'Sundvik Sawmill':id;

const inventory=(values:Partial<Record<CargoKind,number>>):Industry['inventory']=>({...values});

/** Add the fixed first freight chain without changing the ID contract of createInitialState(). */
export function addNorwayIndustries(state:GameState):GameState {
  if(state.campaignId!==norway.id||state.industries.length>0)return state;
  const sites=[
    {definitionId:'forest',x:4890,z:5030,inventory:inventory({})},
    {definitionId:'sawmill',x:2420,z:3290,inventory:inventory({})}
  ] as const;
  for(const site of sites) {
    const id=allocateId(state,'industry');
    state.industries.push({id,definitionId:site.definitionId,position:{x:site.x,y:norwayElevationForWorld(state.world,site.x,site.z),z:site.z},inventory:site.inventory});
    state.operations.industryCycleTicks[id]=0;
  }
  return state;
}

export const createNorwayGameState=(campaign:CampaignDefinition=norway):GameState=>addNorwayIndustries(createInitialState(campaign));
