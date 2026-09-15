import type {CameraPreset} from '../content/presentation.js';

export type ArizonaCameraPresetId='regional'|'canyon'|'settlement'|'industry'|'train';
export const arizonaCameraPresets:Readonly<Record<ArizonaCameraPresetId,CameraPreset>>=Object.freeze({
  regional:Object.freeze({targetXZ:Object.freeze({x:12000,z:12000}),offset:Object.freeze({x:13600,y:7600,z:12800})}),
  canyon:Object.freeze({targetXZ:Object.freeze({x:11900,z:14200}),offset:Object.freeze({x:-760,y:440,z:-980})}),
  settlement:Object.freeze({targetXZ:Object.freeze({x:11970,z:10500}),offset:Object.freeze({x:430,y:210,z:520})}),
  industry:Object.freeze({targetXZ:Object.freeze({x:17700,z:8500}),offset:Object.freeze({x:950,y:470,z:820})}),
  train:Object.freeze({targetXZ:Object.freeze({x:11700,z:13500}),offset:Object.freeze({x:120,y:65,z:155})})
});
