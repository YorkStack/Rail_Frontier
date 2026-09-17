import type {CampaignDefinition} from '../domain/model.js';
import {arizonaV2SettlementSites,arizonaV2WorldGenerator,arizonaV2WorldProfile} from '../world/arizona-v2.js';

const seed=270519;
const objectives=[
  {id:'first-connection',type:'connectTowns' as const,target:2},
  {id:'first-passengers',type:'deliverPassengers' as const,target:200},
  {id:'profitable-railway',type:'operatingProfit' as const,target:1_000_000}
];
const towns=(sites:typeof arizonaV2SettlementSites,generator:typeof arizonaV2WorldGenerator)=>[
  {id:'town:2' as const,name:'Coyote Wells',position:{...sites[0]!,y:generator.elevation(sites[0]!.x,sites[0]!.z,seed)},population:920},
  {id:'town:3' as const,name:'Red Mesa',position:{...sites[1]!,y:generator.elevation(sites[1]!.x,sites[1]!.z,seed)},population:1450},
  {id:'town:4' as const,name:'Juniper Crossing',position:{...sites[2]!,y:generator.elevation(sites[2]!.x,sites[2]!.z,seed)},population:2100}
];

export const arizonaV2:CampaignDefinition={
  id:'arizona-terrain-study',version:2,title:'Arizona Basin Terrain Study',startingYear:1900,startingCash:250_000_000,
  world:{seed,widthM:arizonaV2WorldProfile.widthM,depthM:arizonaV2WorldProfile.depthM,cellM:arizonaV2WorldProfile.cellM,generatorVersion:2,biomeId:arizonaV2WorldProfile.biomeId},towns:towns(arizonaV2SettlementSites,arizonaV2WorldGenerator),objectives
};

export const arizonaTerrainStudy=arizonaV2;
