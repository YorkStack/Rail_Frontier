import type {Vec3} from '../domain/model.js';

export type NorwayCameraPresetId='regional'|'shore'|'station'|'train'|'forest-edge'|'rock-face'|'village';
export interface NorwayCameraPreset {targetXZ:Readonly<{x:number;z:number}>;offset:Readonly<Vec3>}

/** Fixed GFX comparison views. Target elevation is sampled from the active terrain. */
export const norwayCameraPresets:Readonly<Record<NorwayCameraPresetId,NorwayCameraPreset>>=Object.freeze({
  regional:Object.freeze({targetXZ:Object.freeze({x:5200,z:5600}),offset:Object.freeze({x:7800,y:6320,z:8900})}),
  shore:Object.freeze({targetXZ:Object.freeze({x:2200,z:3200}),offset:Object.freeze({x:-520,y:190,z:-520})}),
  station:Object.freeze({targetXZ:Object.freeze({x:2200,z:3200}),offset:Object.freeze({x:150,y:90,z:180})}),
  train:Object.freeze({targetXZ:Object.freeze({x:2299,z:3267}),offset:Object.freeze({x:38,y:23,z:48})}),
  'forest-edge':Object.freeze({targetXZ:Object.freeze({x:5200,z:5000}),offset:Object.freeze({x:210,y:120,z:235})}),
  'rock-face':Object.freeze({targetXZ:Object.freeze({x:9500,z:7000}),offset:Object.freeze({x:-470,y:220,z:410})}),
  village:Object.freeze({targetXZ:Object.freeze({x:4700,z:4900}),offset:Object.freeze({x:190,y:105,z:215})})
});
