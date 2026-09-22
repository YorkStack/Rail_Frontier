import * as THREE from 'three';
import type {SurfaceKind} from '../world/settlement-era.js';

const SIZE=256,TILE_M=4;
const textures=new Map<string,{map:THREE.DataTexture;normalMap:THREE.DataTexture;roughnessMap:THREE.DataTexture}>();
const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const noise=(x:number,y:number)=>{const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return (hash(a,b)*(1-s)+hash(a+1,b)*s)*(1-t)+(hash(a,b+1)*(1-s)+hash(a+1,b+1)*s)*t;};
const palettes:Record<SurfaceKind,[number,number,number]>={dirt:[133,108,74],cobbles:[139,139,127],asphalt:[70,76,75],pavers:[166,153,129],timber:[137,103,60],stone:[125,125,113],gravel:[153,145,119]};
/** Small original repeating albedo/normal/roughness tiles, shared by all meshes. */
export function surfaceTextures(kind:SurfaceKind,southwest=false){
 const key=kind+':'+southwest,cached=textures.get(key);if(cached)return cached;
 const color=new Uint8Array(SIZE*SIZE*4),height=new Float32Array(SIZE*SIZE),rough=new Uint8Array(SIZE*SIZE*4),base=palettes[kind];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const i=y*SIZE+x,u=x/SIZE,v=y/SIZE,g=hash(x,y),patch=noise(u*8,v*8);let shade=.86+.2*patch+.07*g,h=.04*g;
  if(kind==='cobbles'||kind==='pavers'||kind==='stone'){
   const rows=kind==='pavers'?7:kind==='stone'?8:16,cols=kind==='pavers'?7:kind==='stone'?5:12,row=Math.floor(v*rows),tx=u*cols+(row%2)*.5,xx=tx-Math.floor(tx),yy=v*rows-row,edge=Math.min(xx,1-xx,yy,1-yy),seam=kind==='pavers'?.026:.065,bevel=Math.max(0,Math.min(1,(edge-seam)/.10)),stone=hash(Math.floor(tx),row);
   shade=(.80+stone*.16)*((kind==='stone'?.70:.54)+(kind==='stone'?.30:.46)*bevel)+g*.035;h=bevel*(kind==='stone'?.25:.55);
  }else if(kind==='timber'){
   const board=Math.floor(u*16),edge=Math.min(u*16-board,1-(u*16-board)),grain=Math.sin(v*175+noise(u*4,v*12)*9);
   shade=(.72+hash(board,3)*.30+grain*.065)*(edge<.065?.4:1);h=edge<.065?0:.4+grain*.015;
   if((y%112)<3&&(x%16)<3){shade=.27;h=.1;}
  }else if(kind==='dirt'){
   const pebble=g>.963;shade=.73+patch*.36+noise(u*32,v*32)*.13+(pebble?.18:0);h=.12*patch+(pebble?.22:0);
  }else if(kind==='gravel'){
   const pebble=hash(Math.floor(x/2),Math.floor(y/2));shade=.69+pebble*.48+patch*.10;h=pebble*.26;
  }else {shade=.80+g*.18+patch*.16;h=g*.035;}
  height[i]=h;const warm=southwest&&(kind==='dirt'||kind==='gravel');
  for(let c=0;c<3;c++)color[i*4+c]=Math.max(0,Math.min(255,base[c]! * shade*(warm?(c===0?1.13:c===2?.88:1):1)));
  color[i*4+3]=255;rough.set([255,kind==='asphalt'?196+Math.floor(g*28):225+Math.floor(g*27),0,255],i*4);
 }
 const normals=new Uint8Array(SIZE*SIZE*4);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const at=(a:number,b:number)=>height[((b+SIZE)%SIZE)*SIZE+(a+SIZE)%SIZE]!,dx=(at(x-1,y)-at(x+1,y))*.9,dy=(at(x,y-1)-at(x,y+1))*.9,n=new THREE.Vector3(dx,dy,1).normalize(),i=(y*SIZE+x)*4;
  normals.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],i);
 }
 const make=(bytes:Uint8Array,srgb=false)=>{const t=new THREE.DataTexture(bytes,SIZE,SIZE);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.setScalar(1/TILE_M);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;t.userData.assetLibrary=true;t.needsUpdate=true;return t;};
 const value={map:make(color,true),normalMap:make(normals),roughnessMap:make(rough)};textures.set(key,value);return value;
}
export function surfaceMaterial(kind:SurfaceKind,southwest=false):THREE.MeshStandardMaterial {
 const material=new THREE.MeshStandardMaterial({...surfaceTextures(kind,southwest),roughness:1,normalScale:new THREE.Vector2(.7,.7)});material.name='surface:'+kind;return material;
}
/** Meter-scaled planar UVs on all six box faces, including platform retaining walls. */
export function metricBox(width:number,height:number,length:number):THREE.BoxGeometry {
 const g=new THREE.BoxGeometry(width,height,length),p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
 for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,nx>.5?p.getZ(i):p.getX(i),ny>.5?p.getZ(i):p.getY(i));}return g;
}
