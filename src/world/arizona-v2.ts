import type {WorldDefinition} from '../domain/model.js';
import type {WorldGenerator} from './generator.js';
import {Heightfield} from './terrain.js';
import {arizonaV1CorridorX} from './arizona-v1.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const hash=(x:number,z:number,seed:number)=>{let value=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041))|0;value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296;};
const valueNoise=(x:number,z:number,seed:number,scale:number)=>{const gx=x/scale,gz=z/scale,ix=Math.floor(gx),iz=Math.floor(gz),u=smooth(0,1,gx-ix),v=smooth(0,1,gz-iz),a=mix(hash(ix,iz,seed),hash(ix+1,iz,seed),u),b=mix(hash(ix,iz+1,seed),hash(ix+1,iz+1,seed),u);return mix(a,b,v)*2-1;};
const noise=(x:number,z:number,seed:number)=>valueNoise(x,z,seed,3100)*.5+valueNoise(x,z,seed^0x7421,1250)*.31+valueNoise(x,z,seed^0x39a7,430)*.19;

export const arizonaV2WorldProfile=Object.freeze({biomeId:'southwest',widthM:24000,depthM:24000,cellM:40,peakM:1450,generatorVersion:2});
export const arizonaV2CorridorX=(z:number)=>arizonaV1CorridorX(z)+70*Math.sin(z/2700);
export const arizonaV2SettlementSites=Object.freeze([3500,10500,20500].map(z=>Object.freeze({x:arizonaV2CorridorX(z),z})));

export const arizonaV2MainDrainage=Object.freeze([
  Object.freeze({x:6100,z:13200}),Object.freeze({x:8200,z:13680}),Object.freeze({x:10500,z:14180}),
  Object.freeze({x:12600,z:13920}),Object.freeze({x:15100,z:14580}),Object.freeze({x:17800,z:14140}),Object.freeze({x:22100,z:14920})
]);
const northBranch=Object.freeze([Object.freeze({x:9600,z:8500}),Object.freeze({x:10300,z:10500}),Object.freeze({x:11200,z:12400}),arizonaV2MainDrainage[2]!]);
const southBranch=Object.freeze([Object.freeze({x:16000,z:20500}),Object.freeze({x:15450,z:18100}),Object.freeze({x:15700,z:16000}),arizonaV2MainDrainage[4]!]);

function segmentDistance(x:number,z:number,a:{x:number;z:number},b:{x:number;z:number}):number {const dx=b.x-a.x,dz=b.z-a.z,lengthSquared=dx*dx+dz*dz,t=lengthSquared===0?0:clamp01(((x-a.x)*dx+(z-a.z)*dz)/lengthSquared),px=a.x+dx*t,pz=a.z+dz*t;return Math.hypot(x-px,z-pz);}
function pathDistance(x:number,z:number,path:readonly {x:number;z:number}[]):number {let distance=Number.POSITIVE_INFINITY;for(let index=1;index<path.length;index++)distance=Math.min(distance,segmentDistance(x,z,path[index-1]!,path[index]!));return distance;}

function mesaSurface(x:number,z:number,seed:number,cx:number,cz:number,rx:number,rz:number,top:number,turn:number):number|null {
  const c=Math.cos(turn),s=Math.sin(turn),rawX=x-cx,rawZ=z-cz,localX=(rawX*c+rawZ*s)/rx,localZ=(-rawX*s+rawZ*c)/rz,angle=Math.atan2(localZ,localX),warp=.075*Math.sin(angle*3+.4)+.045*Math.sin(angle*7-1.3)+.025*Math.sin(angle*11+.8),d=Math.hypot(localX,localZ)+warp+valueNoise(x,z,seed^0x8842,1100)*.055;
  if(d>=1.22)return null;const crown=top+valueNoise(x,z,seed^0x18af,760)*9;
  if(d<.52)return crown;
  if(d<.7)return mix(crown,crown-68,smooth(.52,.7,d));
  if(d<.82)return crown-68+valueNoise(x,z,seed^0x2f91,330)*5;
  return mix(crown-68,250,smooth(.82,1.2,d));
}

function talusFan(x:number,z:number,cx:number,cz:number,rx:number,rz:number,height:number):number {const distance=Math.hypot((x-cx)/rx,(z-cz)/rz);return height*(1-smooth(.12,1,distance));}

function drainageCut(x:number,z:number):{depth:number;wash:number} {
  const mainDistance=pathDistance(x,z,arizonaV2MainDrainage),northDistance=pathDistance(x,z,northBranch),southDistance=pathDistance(x,z,southBranch),main=(1-smooth(90,430,mainDistance))*235,north=(1-smooth(55,260,northDistance))*105,south=(1-smooth(65,300,southDistance))*125;
  return {depth:Math.max(main,north,south),wash:Math.max(1-smooth(35,260,mainDistance),1-smooth(25,170,northDistance),1-smooth(25,185,southDistance))};
}

/** Authoritative Arizona V2 terrain with broken escarpments and connected drainage. */
export function arizonaV2Elevation(x:number,z:number,seed:number):number {
  const basinFloor=208+z*.002,edge=Math.min(x,arizonaV2WorldProfile.widthM-x),broad=noise(x,z,seed),range=1-smooth(1550,6600,edge),rangeRibs=.78+.14*noise(x+1700,z-900,seed^0x51c3)+.08*Math.sin(z/510+Math.sin(z/1700));
  let elevation=basinFloor+broad*18+range*range*(810*rangeRibs);

  const rimX=17800+420*Math.sin(z/1750)+190*valueNoise(0,z,seed^0xa312,980),east=x-rimX,plateau=smooth(-180,720,east)*315+smooth(650,1500,east)*115+smooth(1600,2900,east)*75;
  elevation=Math.max(elevation,basinFloor+plateau+valueNoise(x,z,seed^0xa313,1450)*18*smooth(-150,1600,east));

  for(const mesa of [[6900,6750,2100,1420,720,-.18],[15400,17700,2400,1700,675,.27]] as const){const surface=mesaSurface(x,z,seed,mesa[0],mesa[1],mesa[2],mesa[3],mesa[4],mesa[5]);if(surface!==null)elevation=Math.max(elevation,surface);}
  elevation+=talusFan(x,z,8350,7300,1700,920,54)+talusFan(x,z,16800,18100,1900,1050,62)+talusFan(x,z,rimX-650,z,820,1500,38);

  const shelfDistance=Math.abs(x-arizonaV2CorridorX(z)),shelfWeight=1-smooth(240,860,shelfDistance),shelfElevation=basinFloor+valueNoise(x,z,seed^0x2fd1,1900)*2.5;elevation=mix(elevation,shelfElevation,shelfWeight);
  const drainage=drainageCut(x,z);elevation-=drainage.depth*(.88+.12*valueNoise(x,z,seed^0xc191,520));

  for(const site of arizonaV2SettlementSites){const distance=Math.hypot(x-site.x,z-site.z),weight=1-smooth(140,500,distance),floor=208+site.z*.002;elevation=mix(elevation,floor,weight);}
  return Math.max(24,Math.min(arizonaV2WorldProfile.peakM,elevation));
}

function urbanMask(x:number,z:number):number {let urban=0;for(const site of arizonaV2SettlementSites)urban=Math.max(urban,1-Math.hypot(x-site.x,z-site.z)/640);return clamp01(urban);}
function validate(definition:WorldDefinition):void {const profile=arizonaV2WorldProfile;if(definition.generatorVersion!==profile.generatorVersion||definition.biomeId!==profile.biomeId)throw new Error('Unsupported world generator');if(definition.widthM!==profile.widthM||definition.depthM!==profile.depthM||definition.cellM!==profile.cellM)throw new Error('World definition does not match its biome profile');}

export function generateArizonaV2World(definition:WorldDefinition):Heightfield {
  validate(definition);const columns=Math.round(definition.widthM/definition.cellM)+1,rows=Math.round(definition.depthM/definition.cellM)+1,size=columns*rows,heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){const x=ix*definition.cellM,z=iz*definition.cellM;heights[iz*columns+ix]=arizonaV2Elevation(x,z,definition.seed);}
  const at=(ix:number,iz:number)=>heights[Math.max(0,Math.min(rows-1,iz))*columns+Math.max(0,Math.min(columns-1,ix))]!;
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){
    const index=iz*columns+ix,x=ix*definition.cellM,z=iz*definition.cellM,y=heights[index]!,city=urbanMask(x,z),dx=(at(ix+1,iz)-at(ix-1,iz))/(2*definition.cellM),dz=(at(ix,iz+1)-at(ix,iz-1))/(2*definition.cellM),slope=Math.hypot(dx,dz),dryVariation=.42+.58*hash(ix,iz,definition.seed),highCountry=smooth(500,900,y)*(1-smooth(1160,1400,y)),drainage=drainageCut(x,z),talus=.5+.5*Math.sin(x*.0027-z*.0018+Math.sin(z*.0007)*2.1);
    urban[index]=city;forest[index]=clamp01((.1+.38*highCountry)*dryVariation*(1-city)*(1-drainage.wash*.72)*(1-smooth(.25,.68,slope)));rock[index]=clamp01((smooth(.18,.74,slope)*.84+smooth(500,1040,y)*.28+drainage.wash*.22+talus*.16*smooth(.2,.48,slope))*(1-city*.78));
  }
  return new Heightfield(columns,rows,definition.cellM,heights,null,{forest,rock,urban});
}

export const arizonaV2WorldGenerator:WorldGenerator=Object.freeze({
  id:'arizona-basin-v2',biomeId:'southwest',version:2,
  landforms:Object.freeze({anchors:Object.freeze({
    'settlement-1':arizonaV2SettlementSites[0]!,'settlement-2':arizonaV2SettlementSites[1]!,'settlement-3':arizonaV2SettlementSites[2]!,
    'mesa-west':Object.freeze({x:6900,z:6750}),'mesa-east':Object.freeze({x:15400,z:17700}),'canyon-crossing':Object.freeze({x:arizonaV2CorridorX(14100),z:14100}),
    'plateau-rim':Object.freeze({x:17900,z:9600}),'talus-fan':Object.freeze({x:8350,z:7300}),'wash':Object.freeze({x:10500,z:11700}),'industry-shelf':Object.freeze({x:17700,z:8500})
  }),corridorX:arizonaV2CorridorX,waterCrossSection:()=>({westBankX:null,eastBankX:null}),waterfall:null}),
  validate,elevation:arizonaV2Elevation,generate:generateArizonaV2World
});
