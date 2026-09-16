import * as THREE from 'three';
import type {BiomeDefinition} from '../world/profiles.js';

export const TERRAIN_ATLAS_SIZE=512;
const TILE_SIZE=TERRAIN_ATLAS_SIZE/2;
const SOURCE_SIZE=TILE_SIZE/2;
const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(value:number)=>value*value*(3-2*value);
const wrap=(value:number,period:number)=>((value%period)+period)%period;

function hash(x:number,y:number,seed:number):number {
  let value=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1442695041);
  value=Math.imul(value^(value>>>13),1274126177);
  return ((value^(value>>>16))>>>0)/4294967295;
}

function valueNoise(x:number,y:number,cell:number,seed:number):number {
  const period=Math.max(1,Math.round(SOURCE_SIZE/cell));
  const gx=x/cell,gy=y/cell,ix=Math.floor(gx),iy=Math.floor(gy);
  const fx=smooth(gx-ix),fy=smooth(gy-iy);
  const sample=(dx:number,dy:number)=>hash(wrap(ix+dx,period),wrap(iy+dy,period),seed);
  const a=sample(0,0)+(sample(1,0)-sample(0,0))*fx;
  const b=sample(0,1)+(sample(1,1)-sample(0,1))*fx;
  return a+(b-a)*fy;
}

function familyHeight(x:number,y:number,family:number,seed:number):number {
  const base=valueNoise(x,y,32,seed+family*71)*.42
    +valueNoise(x,y,12,seed+family*109)*.33
    +valueNoise(x,y,4,seed+family*163)*.25;
  if(family===3) {
    const fracture=Math.abs(valueNoise(x,y,9,seed+991)-.5);
    return clamp01(base*.72+(fracture<.055?.05:.25));
  }
  if(family===2) {
    const gravel=hash(x,y,seed+733)>.965?.22:0;
    return clamp01(base*.72+gravel+.12);
  }
  if(family===1)return clamp01(base*.82+valueNoise(x,y,5,seed+419)*.12);
  return clamp01(base*.72+.14);
}

const norwayTints=[[.88,.96,.82],[.68,.78,.63],[.84,.76,.62],[.78,.8,.77]] as const;
const arizonaTints=[[1,.86,.68],[.91,.7,.53],[.82,.64,.49],[.98,.66,.48]] as const;

function dataTexture(data:Uint8Array,colorSpace:THREE.ColorSpace):THREE.DataTexture {
  const texture=new THREE.DataTexture(data,TERRAIN_ATLAS_SIZE,TERRAIN_ATLAS_SIZE,THREE.RGBAFormat);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=true;
  texture.anisotropy=8;
  texture.colorSpace=colorSpace;
  texture.needsUpdate=true;
  return texture;
}

export interface TerrainAtlases {
  color:THREE.DataTexture;
  normal:THREE.DataTexture;
  roughness:THREE.DataTexture;
  families:readonly string[];
}

export function createTerrainAtlases(profile:BiomeDefinition):TerrainAtlases {
  const desert=profile.id==='southwest',seed=desert?0x51a7:0x6f21;
  const tints=desert?arizonaTints:norwayTints;
  const heights=Array.from({length:4},(_,family)=>{
    const values=new Float32Array(SOURCE_SIZE*SOURCE_SIZE);
    for(let y=0;y<SOURCE_SIZE;y++)for(let x=0;x<SOURCE_SIZE;x++)values[y*SOURCE_SIZE+x]=familyHeight(x,y,family,seed);
    return values;
  });
  const color=new Uint8Array(TERRAIN_ATLAS_SIZE*TERRAIN_ATLAS_SIZE*4);
  const normal=new Uint8Array(color.length),roughness=new Uint8Array(color.length);
  for(let family=0;family<4;family++)for(let y=0;y<TILE_SIZE;y++)for(let x=0;x<TILE_SIZE;x++) {
    const atlasX=x+(family%2)*TILE_SIZE,atlasY=y+Math.floor(family/2)*TILE_SIZE;
    const index=(atlasY*TERRAIN_ATLAS_SIZE+atlasX)*4,values=heights[family]!,sourceX=Math.floor(x/2),sourceY=Math.floor(y/2);
    const at=(dx:number,dy:number)=>values[wrap(sourceY+dy,SOURCE_SIZE)*SOURCE_SIZE+wrap(sourceX+dx,SOURCE_SIZE)]!;
    const height=at(0,0),dx=at(1,0)-at(-1,0),dy=at(0,1)-at(0,-1);
    const strength=family===3?2.2:family===2?1.35:.85,nx=-dx*strength,ny=-dy*strength,nz=1/Math.hypot(nx,ny,1);
    const tint=tints[family]!,brightness=.79+height*.27;
    color[index]=Math.round(clamp01(tint[0]*brightness)*255);
    color[index+1]=Math.round(clamp01(tint[1]*brightness)*255);
    color[index+2]=Math.round(clamp01(tint[2]*brightness)*255);
    color[index+3]=255;
    normal[index]=Math.round((nx*nz*.5+.5)*255);
    normal[index+1]=Math.round((ny*nz*.5+.5)*255);
    normal[index+2]=Math.round((nz*.5+.5)*255);
    normal[index+3]=255;
    const value=clamp01([.88,.96,.9,.82][family]!+(height-.5)*.12);
    roughness[index]=roughness[index+1]=roughness[index+2]=Math.round(value*255);
    roughness[index+3]=255;
  }
  return {
    color:dataTexture(color,THREE.SRGBColorSpace),
    normal:dataTexture(normal,THREE.NoColorSpace),
    roughness:dataTexture(roughness,THREE.NoColorSpace),
    families:desert?['dust','talus','compacted-soil','sandstone']:['meadow','forest-floor','gravel-soil','rock']
  };
}

export function terrainVariation(x:number,z:number,seed=0):number {
  const cell=420,ix=Math.floor(x/cell),iz=Math.floor(z/cell);
  const fx=smooth(x/cell-ix),fz=smooth(z/cell-iz);
  const sample=(dx:number,dz:number)=>hash(ix+dx,iz+dz,seed);
  const a=sample(0,0)+(sample(1,0)-sample(0,0))*fx;
  const b=sample(0,1)+(sample(1,1)-sample(0,1))*fx;
  return a+(b-a)*fz;
}
