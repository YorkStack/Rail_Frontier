import type {CameraPreset} from '../content/presentation.js';

export type ArizonaCameraPresetId='entry'|'regional'|'canyon'|'escarpment'|'wash'|'settlement'|'street'|'house-close'|'vegetation'|'industry'|'train';
export const arizonaCameraPresets:Readonly<Record<ArizonaCameraPresetId,CameraPreset>>=Object.freeze({
  entry:Object.freeze({targetXZ:Object.freeze({x:11930,z:10500}),offset:Object.freeze({x:170,y:78,z:210})}),
  regional:Object.freeze({targetXZ:Object.freeze({x:12000,z:12400}),offset:Object.freeze({x:9200,y:5400,z:8500})}),
  canyon:Object.freeze({targetXZ:Object.freeze({x:12600,z:13920}),offset:Object.freeze({x:-4300,y:2650,z:-3900})}),
  escarpment:Object.freeze({targetXZ:Object.freeze({x:17900,z:9600}),offset:Object.freeze({x:-5200,y:3000,z:-4300})}),
  wash:Object.freeze({targetXZ:Object.freeze({x:10500,z:11700}),offset:Object.freeze({x:-3700,y:2250,z:-3300})}),
  settlement:Object.freeze({targetXZ:Object.freeze({x:11930,z:10500}),offset:Object.freeze({x:440,y:220,z:530})}),
  street:Object.freeze({targetXZ:Object.freeze({x:11930,z:10500}),offset:Object.freeze({x:245,y:82,z:95})}),
  'house-close':Object.freeze({targetXZ:Object.freeze({x:12038,z:10476}),offset:Object.freeze({x:74,y:28,z:66})}),
  vegetation:Object.freeze({targetXZ:Object.freeze({x:12840,z:10540}),offset:Object.freeze({x:82,y:38,z:105})}),
  industry:Object.freeze({targetXZ:Object.freeze({x:17700,z:8500}),offset:Object.freeze({x:950,y:470,z:820})}),
  train:Object.freeze({targetXZ:Object.freeze({x:11700,z:13500}),offset:Object.freeze({x:120,y:65,z:155})})
});
