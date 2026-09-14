import type { WorldDefinition } from '../domain/model.js';
import { Heightfield } from './terrain.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};
const hash=(x:number,z:number,seed:number)=>{
  let value=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041))|0;
  value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296;
};

/**
 * Frozen simulation inputs for existing Norway saves. Rendering colours, lighting,
 * textures and decorative scenery must not be added here.
 */
export const norwayV1WorldProfile=Object.freeze({
  biomeId:'fjord',widthM:16000,depthM:16000,cellM:25,peakM:1250,seaLevelM:0,generatorVersion:1
});

export const norwayV1SettlementSites=Object.freeze([
  Object.freeze({x:2200,z:3200}),
  Object.freeze({x:4700,z:4900}),
  Object.freeze({x:8500,z:7800})
]);

export function norwayV1ShorelineX(z:number,seed:number):number {
  return 900+z*.15+260*Math.sin(z/1050+(seed%997)/997)+120*Math.sin(z/370);
}

export function norwayV1CorridorX(z:number):number {
  const sites=norwayV1SettlementSites;
  if(z<=sites[0]!.z)return sites[0]!.x-(sites[0]!.z-z)*.08;
  for(let i=1;i<sites.length;i++)if(z<=sites[i]!.z) {
    const a=sites[i-1]!,b=sites[i]!,t=(z-a.z)/(b.z-a.z);return a.x+(b.x-a.x)*t;
  }
  const last=sites[sites.length-1]!;return last.x+(z-last.z)*.1;
}

/** Analytic source sampled only by Norway generator version 1. */
export function norwayV1Elevation(x:number,z:number,seed:number):number {
  const shore=norwayV1ShorelineX(z,seed),inland=x-shore;
  if(inland<0)return -18-Math.min(70,-inland*.018)+5*Math.sin(x/290+z/410);
  const corridorDistance=Math.abs(x-norwayV1CorridorX(z));
  const valley=smooth(260,1900,corridorDistance);
  const broadRelief=norwayV1WorldProfile.peakM*valley*(.52+.17*Math.sin(z/880)+.12*Math.cos(x/730+z/1200));
  const foothill=smooth(80,850,inland)*(14+inland*.012);
  const detail=valley*smooth(150,650,inland)*(28*Math.sin(x/230+z/310)+17*Math.cos(x/97-z/270));
  const tributary=Math.exp(-Math.pow((z-6100)/430,2))*Math.exp(-Math.pow((x-5900)/1500,2))*180;
  return Math.max(4,14+z*.0014+foothill+broadRelief+detail-tributary);
}

function urbanMask(x:number,z:number):number {
  let urban=0;
  for(const site of norwayV1SettlementSites)urban=Math.max(urban,1-Math.hypot(x-site.x,z-site.z)/500);
  return clamp01(urban);
}

export function generateNorwayV1World(definition:WorldDefinition):Heightfield {
  const profile=norwayV1WorldProfile;
  if(definition.generatorVersion!==profile.generatorVersion||definition.biomeId!==profile.biomeId)throw new Error('Unsupported world generator');
  if(definition.widthM!==profile.widthM||definition.depthM!==profile.depthM||definition.cellM!==profile.cellM)throw new Error('World definition does not match its biome profile');
  const columns=Math.round(definition.widthM/definition.cellM)+1,rows=Math.round(definition.depthM/definition.cellM)+1,size=columns*rows;
  const heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++) {
    const index=iz*columns+ix,x=ix*definition.cellM,z=iz*definition.cellM,elevation=norwayV1Elevation(x,z,definition.seed),city=urbanMask(x,z);
    const variation=.72+.28*hash(ix,iz,definition.seed),aboveSea=smooth(2,30,elevation),treeline=1-smooth(480,760,elevation);
    heights[index]=elevation;urban[index]=city;
    forest[index]=clamp01(aboveSea*treeline*(1-city)*variation);
    rock[index]=clamp01(smooth(360,850,elevation)*(1-city)*(.75+.25*hash(ix,iz,definition.seed^0x51f15e)));
  }
  return new Heightfield(columns,rows,definition.cellM,heights,profile.seaLevelM,{forest,rock,urban});
}
