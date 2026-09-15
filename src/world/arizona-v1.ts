import type {WorldDefinition} from '../domain/model.js';
import type {WorldGenerator} from './generator.js';
import {Heightfield} from './terrain.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const hash=(x:number,z:number,seed:number)=>{let value=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041))|0;value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296;};
const valueNoise=(x:number,z:number,seed:number,scale:number)=>{const gx=x/scale,gz=z/scale,ix=Math.floor(gx),iz=Math.floor(gz),u=smooth(0,1,gx-ix),v=smooth(0,1,gz-iz),a=mix(hash(ix,iz,seed),hash(ix+1,iz,seed),u),b=mix(hash(ix,iz+1,seed),hash(ix+1,iz+1,seed),u);return mix(a,b,v)*2-1;};
const noise=(x:number,z:number,seed:number)=>valueNoise(x,z,seed,2600)*.58+valueNoise(x,z,seed^0x7421,1050)*.29+valueNoise(x,z,seed^0x39a7,390)*.13;

export const arizonaV1WorldProfile=Object.freeze({biomeId:'southwest',widthM:24000,depthM:24000,cellM:40,peakM:1450,generatorVersion:1});
export const arizonaV1CorridorX=(z:number)=>11700+280*Math.sin((z-3500)/5000);
export const arizonaV1SettlementSites=Object.freeze([3500,10500,20500].map(z=>Object.freeze({x:arizonaV1CorridorX(z),z})));

function mesaSurface(x:number,z:number,seed:number,cx:number,cz:number,rx:number,rz:number,top:number):number|null {
  const nx=(x-cx)/rx,nz=(z-cz)/rz,angle=Math.atan2(nz,nx),d=Math.hypot(nx,nz)+Math.sin(angle*3+.6)*.055+Math.sin(angle*7-1.1)*.028+valueNoise(x,z,seed^0x8842,1350)*.035;if(d>=1.18)return null;
  const crown=top+valueNoise(x,z,seed^0x18af,850)*7,weight=1-smooth(.54,1.16,d);
  return mix(205,crown,weight);
}

/** Analytic source for the fictional Arizona Basin terrain study. */
export function arizonaV1Elevation(x:number,z:number,seed:number):number {
  const edge=Math.min(x,arizonaV1WorldProfile.widthM-x),basinFloor=205+z*.0022;
  let elevation=basinFloor+noise(x,z,seed)*24;
  const range=1-smooth(1700,6100,edge),rangeNoise=.82+.18*noise(x+1800,z,seed^0x51c3);
  elevation+=range*range*(760*rangeNoise+130*Math.sin(z/740)+75*Math.sin(z/250));
  const plateau=smooth(16400,18700,x),plateauRim=smooth(0,1,plateau)*(500+80*valueNoise(x,z,seed^0xa312,2100));
  elevation=Math.max(elevation,basinFloor+plateauRim);
  for(const mesa of [[7000,6700,1900,1450,690],[15400,17700,2200,1650,640]] as const){const surface=mesaSurface(x,z,seed,mesa[0],mesa[1],mesa[2],mesa[3],mesa[4]);if(surface!==null)elevation=Math.max(elevation,surface);}
  const shelfDistance=Math.abs(x-arizonaV1CorridorX(z)),shelfWeight=1-smooth(250,950,shelfDistance),shelfElevation=basinFloor+valueNoise(x,z,seed^0x2fd1,1800)*3;
  elevation=mix(elevation,shelfElevation,shelfWeight);
  const canyonCentre=13900+330*Math.sin((x-8000)/2300),canyonReach=smooth(6200,8500,x)*(1-smooth(20600,22500,x)),canyonWeight=(1-smooth(130,680,Math.abs(z-canyonCentre)))*canyonReach;
  elevation-=canyonWeight*(185+35*valueNoise(x,z,seed^0xc191,900));
  for(const site of arizonaV1SettlementSites){const distance=Math.hypot(x-site.x,z-site.z),weight=1-smooth(130,470,distance),floor=205+site.z*.0022;elevation=mix(elevation,floor,weight);}
  return Math.max(24,Math.min(arizonaV1WorldProfile.peakM,elevation));
}

function urbanMask(x:number,z:number):number {let urban=0;for(const site of arizonaV1SettlementSites)urban=Math.max(urban,1-Math.hypot(x-site.x,z-site.z)/620);return clamp01(urban);}

function validate(definition:WorldDefinition):void {
  const profile=arizonaV1WorldProfile;
  if(definition.generatorVersion!==profile.generatorVersion||definition.biomeId!==profile.biomeId)throw new Error('Unsupported world generator');
  if(definition.widthM!==profile.widthM||definition.depthM!==profile.depthM||definition.cellM!==profile.cellM)throw new Error('World definition does not match its biome profile');
}

export function generateArizonaV1World(definition:WorldDefinition):Heightfield {
  validate(definition);const columns=Math.round(definition.widthM/definition.cellM)+1,rows=Math.round(definition.depthM/definition.cellM)+1,size=columns*rows,heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){const x=ix*definition.cellM,z=iz*definition.cellM;heights[iz*columns+ix]=arizonaV1Elevation(x,z,definition.seed);}
  const at=(ix:number,iz:number)=>heights[Math.max(0,Math.min(rows-1,iz))*columns+Math.max(0,Math.min(columns-1,ix))]!;
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++){
    const index=iz*columns+ix,x=ix*definition.cellM,z=iz*definition.cellM,y=heights[index]!,city=urbanMask(x,z),dx=(at(ix+1,iz)-at(ix-1,iz))/(2*definition.cellM),dz=(at(ix,iz+1)-at(ix,iz-1))/(2*definition.cellM),slope=Math.hypot(dx,dz),dryVariation=.45+.55*hash(ix,iz,definition.seed),highCountry=smooth(500,900,y)*(1-smooth(1120,1400,y));
    urban[index]=city;forest[index]=clamp01((.12+.35*highCountry)*dryVariation*(1-city)*(1-smooth(.28,.72,slope)));rock[index]=clamp01((smooth(.24,.85,slope)*.82+smooth(540,1100,y)*.3)*(1-city*.75));
  }
  return new Heightfield(columns,rows,definition.cellM,heights,null,{forest,rock,urban});
}

export const arizonaV1WorldGenerator:WorldGenerator=Object.freeze({
  id:'arizona-basin-v1',biomeId:'southwest',version:1,
  landforms:Object.freeze({
    anchors:Object.freeze({
      'settlement-1':arizonaV1SettlementSites[0]!,
      'settlement-2':arizonaV1SettlementSites[1]!,
      'settlement-3':arizonaV1SettlementSites[2]!,
      'mesa-west':Object.freeze({x:7000,z:6700}),
      'mesa-east':Object.freeze({x:15400,z:17700}),
      'canyon-crossing':Object.freeze({x:arizonaV1CorridorX(13900),z:13900}),
      'industry-shelf':Object.freeze({x:17700,z:8500})
    }),
    corridorX:arizonaV1CorridorX,
    waterCrossSection:()=>({westBankX:null,eastBankX:null}),
    waterfall:null
  }),
  validate,elevation:arizonaV1Elevation,generate:generateArizonaV1World
});
