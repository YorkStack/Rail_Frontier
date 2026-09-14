import type {CampaignDefinition,GameState,WorldDefinition} from '../domain/model.js';
import type {Heightfield} from '../world/terrain.js';
import {generateNorwayV1World,norwayV1WorldProfile} from '../world/norway-v1.js';
import {norway} from './norway.js';

export interface CampaignContent {
  readonly campaign:CampaignDefinition;
  validateWorld(world:WorldDefinition):void;
  generateWorld(world:WorldDefinition):Heightfield;
}

const norwayV1:CampaignContent=Object.freeze({
  campaign:norway,
  validateWorld(world:WorldDefinition):void {
    const expected=norwayV1WorldProfile;
    if(world.seed!==norway.world.seed||world.biomeId!==expected.biomeId||world.generatorVersion!==expected.generatorVersion||world.widthM!==expected.widthM||world.depthM!==expected.depthM||world.cellM!==expected.cellM)throw new Error('Save world definition is not compatible with Norway V1');
  },
  generateWorld(world:WorldDefinition):Heightfield {this.validateWorld(world);return generateNorwayV1World(world);}
});

export class ContentRegistry {
  private readonly content=new Map<string,CampaignContent>();
  constructor(entries:readonly CampaignContent[]=[norwayV1]) {for(const entry of entries){const key=this.key(entry.campaign.id,entry.campaign.version,entry.campaign.world.generatorVersion);if(this.content.has(key))throw new Error(`Duplicate campaign content: ${key}`);this.content.set(key,entry);}}
  resolve(state:Pick<GameState,'campaignId'|'campaignVersion'|'world'>):CampaignContent {
    const key=this.key(state.campaignId,state.campaignVersion,state.world.generatorVersion),entry=this.content.get(key);
    if(!entry)throw new Error(`Unsupported campaign content: ${key}`);
    entry.validateWorld(state.world);return entry;
  }
  private key(campaignId:string,campaignVersion:number,generatorVersion:number):string {return `${campaignId}@${campaignVersion}/world-${generatorVersion}`;}
}

export const campaignContentRegistry=new ContentRegistry();
