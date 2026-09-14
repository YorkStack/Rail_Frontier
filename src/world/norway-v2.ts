import type {WorldDefinition} from '../domain/model.js';
import {Heightfield} from './terrain.js';
import {norwayV2FjordAtZ,norwayV2Landforms} from './norway-landforms.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const hash=(x:number,z:number,seed:number)=>{let value=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041))|0;value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296;};
const valueNoise=(x:number,z:number,seed:number,scale:number)=>{const gx=x/scale,gz=z/scale,ix=Math.floor(gx),iz=Math.floor(gz),u=smooth(0,1,gx-ix),v=smooth(0,1,gz-iz),a=mix(hash(ix,iz,seed),hash(ix+1,iz,seed),u),b=mix(hash(ix,iz+1,seed),hash(ix+1,iz+1,seed),u);return mix(a,b,v)*2-1;};
const noise=(x:number,z:number,seed:number)=>valueNoise(x,z,seed,1700)*.58+valueNoise(x,z,seed^0x71a5,720)*.29+valueNoise(x,z,seed^0x2f31,280)*.13;

export const norwayV2WorldProfile=Object.freeze({biomeId:'fjord',widthM:16000,depthM:16000,cellM:25,peakM:1420,seaLevelM:0,generatorVersion:2});
export const norwayV2SettlementSites=Object.freeze(norwayV2Landforms.valley.slice(0,3).map(site=>Object.freeze({x:site.x,z:site.z})));

function nearestValley(x:number,z:number):{distanceM:number;floorM:number} {
  let best={distanceM:Number.POSITIVE_INFINITY,floorM:0};const anchors=norwayV2Landforms.valley;
  for(let i=1;i<anchors.length;i++){const a=anchors[i-1]!,b=anchors[i]!,dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz,t=clamp01(((x-a.x)*dx+(z-a.z)*dz)/length2),px=a.x+dx*t,pz=a.z+dz*t,distanceM=Math.hypot(x-px,z-pz);if(distanceM<best.distanceM)best={distanceM,floorM:mix(a.floorM,b.floorM,t)};}
  return best;
}

export function norwayV2Elevation(x:number,z:number,seed:number):number {
  const fjord=norwayV2FjordAtZ(z),fromCentre=Math.abs(x-fjord.centerX),inside=fjord.halfWidthM-fromCentre;
  if(inside>0)return -16-Math.min(74,inside*.038)+valueNoise(x,z,seed^0x5512,480)*3;
  const shoreDistance=-inside,n=noise(x+valueNoise(x,z,seed,2400)*260,z,seed),side=x<fjord.centerX?-1:1,wall=smooth(0,1050,shoreDistance),shoulder=smooth(700,3100,shoreDistance);
  let mountain=24+wall*(620+170*n)+shoulder*(310+110*valueNoise(x,z,seed^0x91aa,2200))+side*55*valueNoise(x,z,seed^0x4231,3000);
  mountain+=Math.max(0,valueNoise(x,z,seed^0x1229,900))*smooth(240,1100,shoreDistance)*170;
  const valley=nearestValley(x,z),valleyWeight=1-smooth(360,1750,valley.distanceM),valleyFloor=valley.floorM+Math.pow(Math.min(valley.distanceM,1800)/1050,1.55)*300+valueNoise(x,z,seed^0x8891,420)*18*smooth(180,900,valley.distanceM);
  let elevation=mix(mountain,valleyFloor,valleyWeight),tributary=Math.exp(-Math.pow((z-6350)/360,2))*Math.exp(-Math.pow((x-7000)/1700,2));elevation-=tributary*110;
  for(const site of norwayV2SettlementSites){const distance=Math.hypot(x-site.x,z-site.z),weight=1-smooth(90,330,distance),floor=nearestValley(site.x,site.z).floorM;elevation=mix(elevation,floor,weight);}
  return Math.max(4,Math.min(norwayV2WorldProfile.peakM,elevation));
}

function urbanMask(x:number,z:number):number {let urban=0;for(const site of norwayV2SettlementSites)urban=Math.max(urban,1-Math.hypot(x-site.x,z-site.z)/500);return clamp01(urban);}

export function generateNorwayV2World(definition:WorldDefinition):Heightfield {
  const profile=norwayV2WorldProfile;if(definition.generatorVersion!==profile.generatorVersion||definition.biomeId!==profile.biomeId)throw new Error('Unsupported world generator');if(definition.widthM!==profile.widthM||definition.depthM!==profile.depthM||definition.cellM!==profile.cellM)throw new Error('World definition does not match its biome profile');
  const columns=Math.round(definition.widthM/definition.cellM)+1,rows=Math.round(definition.depthM/definition.cellM)+1,size=columns*rows,heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){const x=ix*definition.cellM,z=iz*definition.cellM;heights[iz*columns+ix]=norwayV2Elevation(x,z,definition.seed);}
  const at=(ix:number,iz:number)=>heights[Math.max(0,Math.min(rows-1,iz))*columns+Math.max(0,Math.min(columns-1,ix))]!;
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){const index=iz*columns+ix,x=ix*definition.cellM,z=iz*definition.cellM,elevation=heights[index]!,city=urbanMask(x,z),dx=(at(ix+1,iz)-at(ix-1,iz))/(2*definition.cellM),dz=(at(ix,iz+1)-at(ix,iz-1))/(2*definition.cellM),slope=Math.hypot(dx,dz),aboveSea=smooth(2,24,elevation),treeline=1-smooth(620,880,elevation),cliff=smooth(.42,1.15,slope),highRock=smooth(620,1120,elevation);urban[index]=city;forest[index]=clamp01(aboveSea*treeline*(1-city)*(1-smooth(.45,.95,slope))*(.62+.38*hash(ix,iz,definition.seed)));rock[index]=clamp01((cliff*.78+highRock*.48)*(1-city*.8)*(.82+.18*hash(ix,iz,definition.seed^0x51f15e)));}
  return new Heightfield(columns,rows,definition.cellM,heights,profile.seaLevelM,{forest,rock,urban});
}
