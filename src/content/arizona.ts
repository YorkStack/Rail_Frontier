import type {CampaignDefinition} from '../domain/model.js';
import {arizonaV1SettlementSites,arizonaV1WorldGenerator,arizonaV1WorldProfile} from '../world/arizona-v1.js';

const seed=270519;
export const arizonaTerrainStudy:CampaignDefinition={
  id:'arizona-terrain-study',version:1,title:'Arizona Basin Terrain Study',startingYear:1900,startingCash:250_000_000,
  world:{seed,widthM:arizonaV1WorldProfile.widthM,depthM:arizonaV1WorldProfile.depthM,cellM:arizonaV1WorldProfile.cellM,generatorVersion:1,biomeId:arizonaV1WorldProfile.biomeId},
  towns:[
    {id:'town:2',name:'Coyote Wells',position:{...arizonaV1SettlementSites[0]!,y:arizonaV1WorldGenerator.elevation(arizonaV1SettlementSites[0]!.x,arizonaV1SettlementSites[0]!.z,seed)},population:920},
    {id:'town:3',name:'Red Mesa',position:{...arizonaV1SettlementSites[1]!,y:arizonaV1WorldGenerator.elevation(arizonaV1SettlementSites[1]!.x,arizonaV1SettlementSites[1]!.z,seed)},population:1450},
    {id:'town:4',name:'Juniper Crossing',position:{...arizonaV1SettlementSites[2]!,y:arizonaV1WorldGenerator.elevation(arizonaV1SettlementSites[2]!.x,arizonaV1SettlementSites[2]!.z,seed)},population:2100}
  ],
  objectives:[
    {id:'first-connection',type:'connectTowns',target:2},
    {id:'first-passengers',type:'deliverPassengers',target:200},
    {id:'profitable-railway',type:'operatingProfit',target:1_000_000}
  ]
};
