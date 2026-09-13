import type { CampaignDefinition, GameState } from '../domain/model.js';
export const norway:CampaignDefinition={
  id:'norwegian-fjords',version:1,title:'Norwegian Fjords',startingYear:1900,startingCash:250_000_000,
  world:{seed:140919, widthM:16000,depthM:16000,cellM:25,generatorVersion:1,biomeId:'fjord'},
  towns:[
    {id:'town:2',name:'Sundvik',position:{x:2200,y:12,z:3200},population:1800},
    {id:'town:3',name:'Granli',position:{x:4700,y:36,z:4900},population:1250},
    {id:'town:4',name:'Fjellhavn',position:{x:8500,y:15,z:7800},population:3200}
  ],
  objectives:[{id:'first-connection',type:'connectTowns',target:2},{id:'first-passengers',type:'deliverPassengers',target:200},{id:'profitable-railway',type:'operatingProfit',target:1000000}]
};
export function createInitialState(campaign:CampaignDefinition=norway):GameState {
  const nextEntityId=Math.max(1,...campaign.towns.map(town=>Number(town.id.split(':')[1])))+1;
  return {tick:0,nextEntityId,rngState:campaign.world.seed>>>0,campaignId:campaign.id,campaignVersion:campaign.version,world:structuredClone(campaign.world),railway:{nodes:[],edges:[],revision:0},stations:[],trains:[],routes:[],towns:structuredClone(campaign.towns),industries:[],company:{id:'company:1',cash:campaign.startingCash,openingCash:campaign.startingCash,ledger:[]},objectiveProgress:{}};
}
