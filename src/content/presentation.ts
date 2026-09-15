import type {BiomeDefinition} from '../world/profiles.js';

/** Visual content selected with a campaign save; simulation state stays renderer-agnostic. */
export interface CampaignPresentation {
  readonly id:string;
  readonly rendererId:string;
  readonly assetManifestUrl:string;
  readonly biome:Readonly<BiomeDefinition>;
}
