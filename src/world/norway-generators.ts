import type {WorldDefinition} from '../domain/model.js';
import type {WorldGenerator} from './generator.js';
import {generateNorwayV1World,norwayV1CorridorX,norwayV1Elevation,norwayV1SettlementSites,norwayV1ShorelineX,norwayV1WorldProfile} from './norway-v1.js';
import {generateNorwayV2World,norwayV2Elevation,norwayV2WorldProfile} from './norway-v2.js';
import {generateNorwayV3World,norwayV3Elevation,norwayV3FjordAtZ,norwayV3Watercourse,norwayV3WorldProfile} from './norway-v3.js';
import {norwayV2FjordAtZ,norwayV2Landforms,norwayV2ValleyX} from './norway-landforms.js';

const validate=(definition:WorldDefinition,profile:typeof norwayV1WorldProfile|typeof norwayV2WorldProfile|typeof norwayV3WorldProfile)=>{
  if(definition.generatorVersion!==profile.generatorVersion||definition.biomeId!==profile.biomeId)throw new Error('Unsupported world generator');
  if(definition.widthM!==profile.widthM||definition.depthM!==profile.depthM||definition.cellM!==profile.cellM)throw new Error('World definition does not match its biome profile');
};

export const norwayV1WorldGenerator:WorldGenerator=Object.freeze({
  id:'norway-fjord-v1',biomeId:'fjord',version:1,
  landforms:Object.freeze({anchors:Object.freeze(Object.fromEntries(norwayV1SettlementSites.map((point,index)=>[`settlement-${index+1}`,point]))),corridorX:norwayV1CorridorX,waterCrossSection:(z:number)=>({westBankX:null,eastBankX:norwayV1ShorelineX(z,140919)}),waterfall:Object.freeze({z:6100,bank:'east' as const,offsetFromBankM:620})}),
  validate(definition:WorldDefinition){validate(definition,norwayV1WorldProfile);},elevation:norwayV1Elevation,
  generate(definition:WorldDefinition){validate(definition,norwayV1WorldProfile);return generateNorwayV1World(definition);}
});

export const norwayV2WorldGenerator:WorldGenerator=Object.freeze({
  id:'norway-fjord-v2',biomeId:'fjord',version:2,
  landforms:Object.freeze({anchors:Object.freeze(Object.fromEntries(norwayV2Landforms.valley.slice(0,3).map((point,index)=>[`settlement-${index+1}`,Object.freeze({x:point.x,z:point.z})]))),corridorX:norwayV2ValleyX,waterCrossSection:(z:number)=>{const section=norwayV2FjordAtZ(z);return {westBankX:section.centerX-section.halfWidthM,eastBankX:section.centerX+section.halfWidthM};},waterfall:Object.freeze({z:norwayV2Landforms.waterfall.z,bank:'east' as const,offsetFromBankM:norwayV2Landforms.waterfall.offsetFromEastShoreM})}),
  validate(definition:WorldDefinition){validate(definition,norwayV2WorldProfile);},elevation:norwayV2Elevation,
  generate(definition:WorldDefinition){validate(definition,norwayV2WorldProfile);return generateNorwayV2World(definition);}
});

export const norwayV3WorldGenerator:WorldGenerator=Object.freeze({
  id:'norway-fjord-v3',biomeId:'fjord',version:3,
  landforms:Object.freeze({anchors:Object.freeze({...Object.fromEntries(norwayV2Landforms.valley.slice(0,3).map((point,index)=>[`settlement-${index+1}`,Object.freeze({x:point.x,z:point.z})])),waterfall:norwayV3Watercourse.cameraAnchor}),corridorX:norwayV2ValleyX,waterCrossSection:(z:number)=>{const section=norwayV3FjordAtZ(z);return {westBankX:section.centerX-section.halfWidthM,eastBankX:section.centerX+section.halfWidthM};},waterfall:Object.freeze({z:norwayV3Watercourse.lip.z,bank:'east' as const,offsetFromBankM:850}),watercourse:norwayV3Watercourse}),
  validate(definition:WorldDefinition){validate(definition,norwayV3WorldProfile);},elevation:norwayV3Elevation,
  generate(definition:WorldDefinition){validate(definition,norwayV3WorldProfile);return generateNorwayV3World(definition);}
});

const generators:ReadonlyMap<number,WorldGenerator>=new Map([[1,norwayV1WorldGenerator],[2,norwayV2WorldGenerator],[3,norwayV3WorldGenerator]]);
export function norwayWorldGeneratorFor(definition:WorldDefinition):WorldGenerator {
  const generator=generators.get(definition.generatorVersion);if(!generator)throw new Error('Unsupported Norway world generator');generator.validate(definition);return generator;
}
