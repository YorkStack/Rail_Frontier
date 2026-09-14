import type { WorldDefinition } from '../domain/model.js';
import { Heightfield } from './terrain.js';
import {generateNorwayV1World,norwayV1CorridorX,norwayV1Elevation,norwayV1ShorelineX} from './norway-v1.js';

// Compatibility exports for callers that still render V1-specific landmarks.
export const norwayShorelineX=norwayV1ShorelineX;
export const norwayCorridorX=norwayV1CorridorX;
export const norwayElevation=norwayV1Elevation;

export function generateWorld(definition:WorldDefinition):Heightfield {
  if(definition.generatorVersion===1)return generateNorwayV1World(definition);
  throw new Error('Unsupported world generator');
}
