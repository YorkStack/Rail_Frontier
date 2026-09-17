import type {CameraPreset} from '../content/presentation.js';

export type NorwayCameraPresetId='entry'|'regional'|'shore'|'waterfall'|'station'|'train'|'forest-edge'|'rock-face'|'village';
export type NorwayCameraPreset=CameraPreset;

/** Fixed GFX comparison views. Target elevation is sampled from the active terrain. */
export const norwayCameraPresets:Readonly<Record<NorwayCameraPresetId,NorwayCameraPreset>>=Object.freeze({
  entry:Object.freeze({targetXZ:Object.freeze({x:2200,z:3200}),offset:Object.freeze({x:140,y:95,z:220})}),
  regional:Object.freeze({targetXZ:Object.freeze({x:5200,z:5600}),offset:Object.freeze({x:7800,y:6320,z:8900})}),
  shore:Object.freeze({targetXZ:Object.freeze({x:2200,z:3200}),offset:Object.freeze({x:-520,y:190,z:-520})}),
  waterfall:Object.freeze({targetXZ:Object.freeze({x:3200,z:6350}),offset:Object.freeze({x:-500,y:210,z:-80})}),
  station:Object.freeze({targetXZ:Object.freeze({x:2200,z:3200}),offset:Object.freeze({x:150,y:90,z:180})}),
  train:Object.freeze({targetXZ:Object.freeze({x:2299,z:3267}),offset:Object.freeze({x:38,y:23,z:48})}),
  'forest-edge':Object.freeze({targetXZ:Object.freeze({x:5200,z:5000}),offset:Object.freeze({x:210,y:120,z:235})}),
  'rock-face':Object.freeze({targetXZ:Object.freeze({x:10100,z:8850}),offset:Object.freeze({x:-800,y:500,z:120})}),
  village:Object.freeze({targetXZ:Object.freeze({x:4700,z:4900}),offset:Object.freeze({x:190,y:105,z:215})})
});
