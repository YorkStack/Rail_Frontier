import type { WorldDefinition } from '../domain/model.js';
import { norwayBiome, norwaySettlementSites } from './biome.js';
import { Heightfield } from './terrain.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};
const hash=(x:number,z:number,seed:number)=>{
  let value=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041))|0;
  value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296;
};

export function norwayShorelineX(z:number,seed:number):number {
  return 900+z*.15+260*Math.sin(z/1050+(seed%997)/997)+120*Math.sin(z/370);
}

export function norwayCorridorX(z:number):number {
  const sites=norwaySettlementSites;
  if(z<=sites[0]!.z)return sites[0]!.x-(sites[0]!.z-z)*.08;
  for(let i=1;i<sites.length;i++)if(z<=sites[i]!.z) {
    const a=sites[i-1]!,b=sites[i]!,t=(z-a.z)/(b.z-a.z);return a.x+(b.x-a.x)*t;
  }
  const last=sites[sites.length-1]!;return last.x+(z-last.z)*.1;
}

/** Analytic source sampled by generator version 1. Rendering uses the resulting triangle field. */
export function norwayElevation(x:number,z:number,seed:number):number {
  const shore=norwayShorelineX(z,seed),inland=x-shore;
  if(inland<0)return -18-Math.min(70,-inland*.018)+5*Math.sin(x/290+z/410);
  const corridorDistance=Math.abs(x-norwayCorridorX(z));
  const valley=smooth(260,1900,corridorDistance);
  const broadRelief=norwayBiome.terrain.peakM*valley*(.52+.17*Math.sin(z/880)+.12*Math.cos(x/730+z/1200));
  const foothill=smooth(80,850,inland)*(14+inland*.012);
  const detail=valley*smooth(150,650,inland)*(28*Math.sin(x/230+z/310)+17*Math.cos(x/97-z/270));
  const tributary=Math.exp(-Math.pow((z-6100)/430,2))*Math.exp(-Math.pow((x-5900)/1500,2))*180;
  return Math.max(4,14+z*.0014+foothill+broadRelief+detail-tributary);
}

function urbanMask(x:number,z:number):number {
  let urban=0;
  for(const site of norwaySettlementSites)urban=Math.max(urban,1-Math.hypot(x-site.x,z-site.z)/500);
  return clamp01(urban);
}

export function generateWorld(definition:WorldDefinition):Heightfield {
  if(definition.generatorVersion!==1||definition.biomeId!==norwayBiome.id)throw new Error('Unsupported world generator');
  if(definition.widthM!==norwayBiome.terrain.widthM||definition.depthM!==norwayBiome.terrain.depthM||definition.cellM!==norwayBiome.terrain.cellM)throw new Error('World definition does not match its biome profile');
  const columns=Math.round(definition.widthM/definition.cellM)+1,rows=Math.round(definition.depthM/definition.cellM)+1,size=columns*rows;
  const heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++) {
    const index=iz*columns+ix,x=ix*definition.cellM,z=iz*definition.cellM,elevation=norwayElevation(x,z,definition.seed),city=urbanMask(x,z);
    const variation=.72+.28*hash(ix,iz,definition.seed),aboveSea=smooth(2,30,elevation),treeline=1-smooth(480,760,elevation);
    heights[index]=elevation;urban[index]=city;
    forest[index]=clamp01(aboveSea*treeline*(1-city)*variation);
    rock[index]=clamp01(smooth(360,850,elevation)*(1-city)*(.75+.25*hash(ix,iz,definition.seed^0x51f15e)));
  }
  return new Heightfield(columns,rows,definition.cellM,heights,0,{forest,rock,urban});
}
