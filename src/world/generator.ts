import type {WorldDefinition} from '../domain/model.js';
import type {Heightfield} from './terrain.js';

export interface WorldPoint {readonly x:number;readonly z:number}
export interface WaterCrossSection {readonly westBankX:number|null;readonly eastBankX:number|null}
export interface WaterfallLandmark {readonly z:number;readonly bank:'west'|'east';readonly offsetFromBankM:number}
export interface WorldLandforms {
  readonly anchors:Readonly<Record<string,WorldPoint>>;
  corridorX(z:number):number;
  waterCrossSection(z:number):WaterCrossSection;
  readonly waterfall:WaterfallLandmark|null;
}

/** Versioned world content. New biomes register an implementation with CampaignContent. */
export interface WorldGenerator {
  readonly id:string;
  readonly biomeId:string;
  readonly version:number;
  readonly landforms:WorldLandforms;
  validate(definition:WorldDefinition):void;
  elevation(x:number,z:number,seed:number):number;
  generate(definition:WorldDefinition):Heightfield;
}
