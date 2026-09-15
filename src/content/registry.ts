import type {CampaignDefinition,GameState,WorldDefinition} from '../domain/model.js';
import type {WorldGenerator} from '../world/generator.js';
import {norwayV1 as norwayV1Campaign,norwayV2} from './norway.js';
import {norwayBiome} from '../world/biome.js';
import type {CampaignPresentation} from './presentation.js';
import {norwayV1WorldGenerator,norwayV2WorldGenerator} from '../world/norway-generators.js';

export interface CampaignContent {
  readonly campaign:CampaignDefinition;
  readonly presentation:CampaignPresentation;
  readonly worldGenerator:WorldGenerator;
  validateWorld(world:WorldDefinition):void;
}

const norwayPresentation:CampaignPresentation=Object.freeze({id:'norway-fjord-v1',rendererId:'fjord',assetManifestUrl:'/packs/norway.json',biome:norwayBiome});
const validateNorwayWorld=(world:WorldDefinition,generator:WorldGenerator,seed:number,label:string)=>{try{generator.validate(world);}catch{throw new Error(`Save world definition is not compatible with ${label}`);}if(world.seed!==seed)throw new Error(`Save world definition is not compatible with ${label}`);};

const norwayV1:CampaignContent=Object.freeze({
  campaign:norwayV1Campaign,
  presentation:norwayPresentation,
  worldGenerator:norwayV1WorldGenerator,
  validateWorld(world:WorldDefinition):void {validateNorwayWorld(world,norwayV1WorldGenerator,norwayV1Campaign.world.seed,'Norway V1');}
});
const norwayV2Content:CampaignContent=Object.freeze({
  campaign:norwayV2,
  presentation:norwayPresentation,
  worldGenerator:norwayV2WorldGenerator,
  validateWorld(world:WorldDefinition):void {validateNorwayWorld(world,norwayV2WorldGenerator,norwayV2.world.seed,'Norway V2');}
});

export class ContentRegistry {
  private readonly content=new Map<string,CampaignContent>();
  constructor(entries:readonly CampaignContent[]=[norwayV1,norwayV2Content]) {for(const entry of entries){const key=this.key(entry.campaign.id,entry.campaign.version,entry.campaign.world.generatorVersion);if(entry.presentation.biome.id!==entry.campaign.world.biomeId||entry.worldGenerator.biomeId!==entry.campaign.world.biomeId||entry.worldGenerator.version!==entry.campaign.world.generatorVersion)throw new Error(`Campaign content does not match world definition: ${key}`);if(this.content.has(key))throw new Error(`Duplicate campaign content: ${key}`);this.content.set(key,entry);}}
  resolve(state:Pick<GameState,'campaignId'|'campaignVersion'|'world'>):CampaignContent {
    const key=this.key(state.campaignId,state.campaignVersion,state.world.generatorVersion),entry=this.content.get(key);
    if(!entry)throw new Error(`Unsupported campaign content: ${key}`);
    entry.validateWorld(state.world);return entry;
  }
  private key(campaignId:string,campaignVersion:number,generatorVersion:number):string {return `${campaignId}@${campaignVersion}/world-${generatorVersion}`;}
}

export const campaignContentRegistry=new ContentRegistry();
