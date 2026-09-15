import type {CampaignDefinition,GameState,WorldDefinition} from '../domain/model.js';
import type {Heightfield} from '../world/terrain.js';
import {generateNorwayV1World,norwayV1WorldProfile} from '../world/norway-v1.js';
import {generateNorwayV2World,norwayV2WorldProfile} from '../world/norway-v2.js';
import {norwayV1 as norwayV1Campaign,norwayV2} from './norway.js';
import {norwayBiome} from '../world/biome.js';
import type {CampaignPresentation} from './presentation.js';

export interface CampaignContent {
  readonly campaign:CampaignDefinition;
  readonly presentation:CampaignPresentation;
  validateWorld(world:WorldDefinition):void;
  generateWorld(world:WorldDefinition):Heightfield;
}

const norwayPresentation:CampaignPresentation=Object.freeze({id:'norway-fjord-v1',rendererId:'fjord',assetManifestUrl:'/packs/norway.json',biome:norwayBiome});

const norwayV1:CampaignContent=Object.freeze({
  campaign:norwayV1Campaign,
  presentation:norwayPresentation,
  validateWorld(world:WorldDefinition):void {
    const expected=norwayV1WorldProfile;
    if(world.seed!==norwayV1Campaign.world.seed||world.biomeId!==expected.biomeId||world.generatorVersion!==expected.generatorVersion||world.widthM!==expected.widthM||world.depthM!==expected.depthM||world.cellM!==expected.cellM)throw new Error('Save world definition is not compatible with Norway V1');
  },
  generateWorld(world:WorldDefinition):Heightfield {this.validateWorld(world);return generateNorwayV1World(world);}
});
const norwayV2Content:CampaignContent=Object.freeze({
  campaign:norwayV2,
  presentation:norwayPresentation,
  validateWorld(world:WorldDefinition):void {const expected=norwayV2WorldProfile;if(world.seed!==norwayV2.world.seed||world.biomeId!==expected.biomeId||world.generatorVersion!==expected.generatorVersion||world.widthM!==expected.widthM||world.depthM!==expected.depthM||world.cellM!==expected.cellM)throw new Error('Save world definition is not compatible with Norway V2');},
  generateWorld(world:WorldDefinition):Heightfield {this.validateWorld(world);return generateNorwayV2World(world);}
});

export class ContentRegistry {
  private readonly content=new Map<string,CampaignContent>();
  constructor(entries:readonly CampaignContent[]=[norwayV1,norwayV2Content]) {for(const entry of entries){const key=this.key(entry.campaign.id,entry.campaign.version,entry.campaign.world.generatorVersion);if(entry.presentation.biome.id!==entry.campaign.world.biomeId)throw new Error(`Campaign presentation biome does not match world content: ${key}`);if(this.content.has(key))throw new Error(`Duplicate campaign content: ${key}`);this.content.set(key,entry);}}
  resolve(state:Pick<GameState,'campaignId'|'campaignVersion'|'world'>):CampaignContent {
    const key=this.key(state.campaignId,state.campaignVersion,state.world.generatorVersion),entry=this.content.get(key);
    if(!entry)throw new Error(`Unsupported campaign content: ${key}`);
    entry.validateWorld(state.world);return entry;
  }
  private key(campaignId:string,campaignVersion:number,generatorVersion:number):string {return `${campaignId}@${campaignVersion}/world-${generatorVersion}`;}
}

export const campaignContentRegistry=new ContentRegistry();
