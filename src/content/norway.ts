import type { CampaignDefinition, GameState } from '../domain/model.js';
import { emptyOperations } from '../domain/operations.js';
import {norwayV2WorldProfile} from '../world/norway-v2.js';
import {norwayV3WorldProfile} from '../world/norway-v3.js';
import {norwayV2WorldGenerator,norwayV3WorldGenerator} from '../world/norway-generators.js';
const seed=140919;
const objectives:CampaignDefinition['objectives']=[{id:'first-connection',type:'connectTowns',target:2},{id:'first-passengers',type:'deliverPassengers',target:200},{id:'profitable-railway',type:'operatingProfit',target:1000000}];
export const norwayV2:CampaignDefinition={
  id:'norwegian-fjords',version:2,title:'Norwegian Fjords',startingYear:1900,startingCash:250_000_000,
  world:{seed,widthM:norwayV2WorldProfile.widthM,depthM:norwayV2WorldProfile.depthM,cellM:norwayV2WorldProfile.cellM,generatorVersion:2,biomeId:norwayV2WorldProfile.biomeId},
  towns:[
    {id:'town:2',name:'Sundvik',position:{x:2200,y:norwayV2WorldGenerator.elevation(2200,3200,seed),z:3200},population:1800},
    {id:'town:3',name:'Granli',position:{x:4700,y:norwayV2WorldGenerator.elevation(4700,4900,seed),z:4900},population:1250},
    {id:'town:4',name:'Fjellhavn',position:{x:8500,y:norwayV2WorldGenerator.elevation(8500,7800,seed),z:7800},population:3200}
  ],objectives
};
export const norwayV3:CampaignDefinition={
  id:'norwegian-fjords',version:3,title:'Norwegian Fjords',startingYear:1900,startingCash:250_000_000,
  world:{seed,widthM:norwayV3WorldProfile.widthM,depthM:norwayV3WorldProfile.depthM,cellM:norwayV3WorldProfile.cellM,generatorVersion:3,biomeId:norwayV3WorldProfile.biomeId},
  towns:[
    {id:'town:2',name:'Sundvik',position:{x:2200,y:norwayV3WorldGenerator.elevation(2200,3200,seed),z:3200},population:1800},
    {id:'town:3',name:'Granli',position:{x:4700,y:norwayV3WorldGenerator.elevation(4700,4900,seed),z:4900},population:1250},
    {id:'town:4',name:'Fjellhavn',position:{x:8500,y:norwayV3WorldGenerator.elevation(8500,7800,seed),z:7800},population:3200}
  ],objectives
};
export const norway=norwayV3;
export function createInitialState(campaign:CampaignDefinition=norway):GameState {
  const nextEntityId=Math.max(1,...campaign.towns.map(town=>Number(town.id.split(':')[1])))+1;
  return {operations:emptyOperations(campaign.towns),tick:0,startingYear:campaign.startingYear,nextEntityId,rngState:campaign.world.seed>>>0,campaignId:campaign.id,campaignVersion:campaign.version,world:structuredClone(campaign.world),railway:{nodes:[],edges:[],revision:0},stations:[],trains:[],routes:[],towns:structuredClone(campaign.towns),industries:[],company:{id:'company:1',cash:campaign.startingCash,openingCash:campaign.startingCash,ledger:[]},objectiveProgress:{},learning:null};
}
