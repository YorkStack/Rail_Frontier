import type {WorldDefinition} from '../domain/model.js';
import {Heightfield} from './terrain.js';
import {norwayV2Elevation} from './norway-v2.js';
import {norwayV2FjordAtZ,norwayV2Landforms} from './norway-landforms.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const hash=(x:number,z:number,seed:number)=>{let value=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041))|0;value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296;};

export const norwayV3WorldProfile=Object.freeze({biomeId:'fjord',widthM:16000,depthM:16000,cellM:25,peakM:1540,seaLevelM:0,generatorVersion:3});
export const norwayV3SettlementSites=Object.freeze(norwayV2Landforms.valley.slice(0,3).map(site=>Object.freeze({x:site.x,z:site.z})));
export const norwayV3Watercourse=Object.freeze({
  upstream:Object.freeze({x:4380,z:6460}),lip:Object.freeze({x:3540,z:6380}),plunge:Object.freeze({x:3200,z:6350}),outlet:Object.freeze({x:2700,z:6320}),cameraAnchor:Object.freeze({x:3300,z:6200})
});

const cliffClusters=Object.freeze([
  Object.freeze({x:4300,z:7350,angle:-.38,length:1500,width:1150,height:330}),
  Object.freeze({x:10100,z:8850,angle:3.8616,length:1900,width:1350,height:410}),
  Object.freeze({x:900,z:10600,angle:-.18,length:1650,width:1100,height:300})
]);

function cliffRelief(x:number,z:number):number {
  let relief=0;
  for(const cluster of cliffClusters){const dx=x-cluster.x,dz=z-cluster.z,c=Math.cos(cluster.angle),s=Math.sin(cluster.angle),along=dx*c+dz*s,across=-dx*s+dz*c,taper=1-smooth(cluster.length*.58,cluster.length,Math.abs(along)),ridge=across+72*Math.sin(along/190)+28*Math.sin(along/63),face=smooth(-85,105,ridge)*(1-smooth(cluster.width*.7,cluster.width,ridge)),gully=.76+.17*Math.sin(along/135+Math.sin(along/410)*1.8)+.07*Math.sin(along/47);relief+=cluster.height*taper*face*gully;}
  return relief;
}

function watercourseTarget(x:number,z:number):{weight:number;height:number} {
  if(x<2580||x>4550)return {weight:0,height:0};const centre=6320+(x-2700)*.075+38*Math.sin((x-2700)/360),distance=Math.abs(z-centre),weight=1-smooth(24,145,distance);let height=22;
  if(x>=3540)height=300+(x-3540)*.115;else if(x>=3260)height=285+(x-3260)*.05;else height=18+(x-2580)*.025;
  return {weight,height};
}

export function norwayV3Elevation(x:number,z:number,seed:number):number {
  let elevation=norwayV2Elevation(x,z,seed)+cliffRelief(x,z),channel=watercourseTarget(x,z);elevation=mix(elevation,channel.height,channel.weight*.94);
  for(const site of norwayV3SettlementSites){const distance=Math.hypot(x-site.x,z-site.z),weight=1-smooth(90,340,distance),floor=norwayV2Landforms.valley.find(point=>point.x===site.x&&point.z===site.z)!.floorM;elevation=mix(elevation,floor,weight);}
  return Math.max(4,Math.min(norwayV3WorldProfile.peakM,elevation));
}

function urbanMask(x:number,z:number):number {let urban=0;for(const site of norwayV3SettlementSites)urban=Math.max(urban,1-Math.hypot(x-site.x,z-site.z)/500);return clamp01(urban);}

export function generateNorwayV3World(definition:WorldDefinition):Heightfield {
  const profile=norwayV3WorldProfile;if(definition.generatorVersion!==3||definition.biomeId!==profile.biomeId||definition.widthM!==profile.widthM||definition.depthM!==profile.depthM||definition.cellM!==profile.cellM)throw new Error('World definition does not match Norway V3');
  const columns=Math.round(definition.widthM/definition.cellM)+1,rows=Math.round(definition.depthM/definition.cellM)+1,size=columns*rows,heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){const x=ix*definition.cellM,z=iz*definition.cellM;heights[iz*columns+ix]=norwayV3Elevation(x,z,definition.seed);}
  const at=(ix:number,iz:number)=>heights[Math.max(0,Math.min(rows-1,iz))*columns+Math.max(0,Math.min(columns-1,ix))]!;
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){const index=iz*columns+ix,x=ix*definition.cellM,z=iz*definition.cellM,elevation=heights[index]!,city=urbanMask(x,z),dx=(at(ix+1,iz)-at(ix-1,iz))/(2*definition.cellM),dz=(at(ix,iz+1)-at(ix,iz-1))/(2*definition.cellM),slope=Math.hypot(dx,dz),aboveSea=smooth(2,24,elevation),treeline=1-smooth(650,930,elevation),cliff=smooth(.34,.92,slope),highRock=smooth(610,1120,elevation);urban[index]=city;forest[index]=clamp01(aboveSea*treeline*(1-city)*(1-smooth(.38,.82,slope))*(.58+.42*hash(ix,iz,definition.seed)));rock[index]=clamp01((cliff*.9+highRock*.5)*(1-city*.8)*(.8+.2*hash(ix,iz,definition.seed^0x51f15e)));}
  return new Heightfield(columns,rows,definition.cellM,heights,profile.seaLevelM,{forest,rock,urban});
}

export function norwayV3FjordAtZ(z:number):{centerX:number;halfWidthM:number} {return norwayV2FjordAtZ(z);}
