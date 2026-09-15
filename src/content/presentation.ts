import type {BiomeDefinition} from '../world/profiles.js';
import type {Vec3} from '../domain/model.js';

export interface CameraPreset {
  readonly targetXZ:Readonly<{x:number;z:number}>;
  readonly offset:Readonly<Vec3>;
}

/** Visual content selected with a campaign save; simulation state stays renderer-agnostic. */
export interface CampaignPresentation {
  readonly id:string;
  readonly rendererId:string;
  readonly assetManifestUrl:string|null;
  readonly biome:Readonly<BiomeDefinition>;
  readonly cameraPresets:Readonly<Record<string,CameraPreset>>;
  readonly cameraSweep:readonly string[];
  readonly proceduralScenery:'norway-fallback'|'southwest-study';
}
