import type {CampaignDefinition,GameState,WorldDefinition} from '../domain/model.js';
import type {WorldGenerator} from '../world/generator.js';
import {norwayV2,norwayV3} from './norway.js';
import {norwayBiome} from '../world/biome.js';
import type {CampaignPresentation} from './presentation.js';
import {norwayV2WorldGenerator,norwayV3WorldGenerator} from '../world/norway-generators.js';
import {norwayCameraPresets} from '../rendering/norway-camera-presets.js';
import {arizonaV2} from './arizona.js';
import {arizonaBiome} from '../world/biome.js';
import {arizonaV2WorldGenerator} from '../world/arizona-v2.js';
import {arizonaCameraPresets} from '../rendering/arizona-camera-presets.js';

export interface CampaignContent {
  readonly campaign:CampaignDefinition;
  readonly presentation:CampaignPresentation;
  readonly worldGenerator:WorldGenerator;
  validateWorld(world:WorldDefinition):void;
}

const norwayPresentation:CampaignPresentation=Object.freeze({id:'norway-fjord-v1',rendererId:'fjord',assetManifestUrl:'/packs/norway.json',assetRoles:Object.freeze({station:'norway-station',bridgeSpan:'norway-bridge-span',tunnelPortal:'norway-tunnel-portal'}),biome:norwayBiome,cameraPresets:norwayCameraPresets,entryCameraId:'entry',cameraSweep:Object.freeze(['regional','shore','waterfall','forest-edge','train']),proceduralScenery:'norway-fallback'});
const arizonaPresentation:CampaignPresentation=Object.freeze({id:'arizona-basin-study-v2',rendererId:'terrain-study',assetManifestUrl:'/packs/arizona.json',assetRoles:Object.freeze({}),biome:arizonaBiome,cameraPresets:arizonaCameraPresets,entryCameraId:'entry',cameraSweep:Object.freeze(['regional','escarpment','canyon','wash','settlement','street','house-close','vegetation','industry','train']),proceduralScenery:'southwest-study'});
const validateNorwayWorld=(world:WorldDefinition,generator:WorldGenerator,seed:number,label:string)=>{try{generator.validate(world);}catch{throw new Error(`Save world definition is not compatible with ${label}`);}if(world.seed!==seed)throw new Error(`Save world definition is not compatible with ${label}`);};

const norwayV2Content:CampaignContent=Object.freeze({
  campaign:norwayV2,
  presentation:norwayPresentation,
  worldGenerator:norwayV2WorldGenerator,
  validateWorld(world:WorldDefinition):void {validateNorwayWorld(world,norwayV2WorldGenerator,norwayV2.world.seed,'Norway V2');}
});
const norwayV3Content:CampaignContent=Object.freeze({
  campaign:norwayV3,presentation:norwayPresentation,worldGenerator:norwayV3WorldGenerator,
  validateWorld(world:WorldDefinition):void {validateNorwayWorld(world,norwayV3WorldGenerator,norwayV3.world.seed,'Norway V3');}
});
const arizonaV2Content:CampaignContent=Object.freeze({
  campaign:arizonaV2,presentation:arizonaPresentation,worldGenerator:arizonaV2WorldGenerator,
  validateWorld(world:WorldDefinition):void {try{arizonaV2WorldGenerator.validate(world);}catch{throw new Error('Save world definition is not compatible with Arizona terrain study V2');}if(world.seed!==arizonaV2.world.seed)throw new Error('Save world definition is not compatible with Arizona terrain study V2');}
});

export class ContentRegistry {
  private readonly content=new Map<string,CampaignContent>();
  constructor(entries:readonly CampaignContent[]=[norwayV2Content,norwayV3Content,arizonaV2Content]) {for(const entry of entries){const key=this.key(entry.campaign.id,entry.campaign.version,entry.campaign.world.generatorVersion);if(entry.presentation.biome.id!==entry.campaign.world.biomeId||entry.worldGenerator.biomeId!==entry.campaign.world.biomeId||entry.worldGenerator.version!==entry.campaign.world.generatorVersion)throw new Error(`Campaign content does not match world definition: ${key}`);if(this.content.has(key))throw new Error(`Duplicate campaign content: ${key}`);this.content.set(key,entry);}}
  resolve(state:Pick<GameState,'campaignId'|'campaignVersion'|'world'>):CampaignContent {
    const key=this.key(state.campaignId,state.campaignVersion,state.world.generatorVersion),entry=this.content.get(key);
    if(!entry)throw new Error(`Unsupported campaign content: ${key}`);
    entry.validateWorld(state.world);return entry;
  }
  private key(campaignId:string,campaignVersion:number,generatorVersion:number):string {return `${campaignId}@${campaignVersion}/world-${generatorVersion}`;}
}

export const campaignContentRegistry=new ContentRegistry();
