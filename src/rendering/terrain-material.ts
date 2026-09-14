import * as THREE from 'three';

const SIZE=128;
const height=(x:number,y:number)=>.5+.22*Math.sin(Math.PI*2*(3*x+2*y)/SIZE+.7)+.13*Math.sin(Math.PI*2*(7*x-5*y)/SIZE+2.1)+.075*Math.sin(Math.PI*2*(19*x+13*y)/SIZE+.2)+.04*Math.cos(Math.PI*2*(31*x-23*y)/SIZE+1.4);

function texture(data:Uint8Array,colorSpace:THREE.ColorSpace):THREE.DataTexture {const value=new THREE.DataTexture(data,SIZE,SIZE,THREE.RGBAFormat);value.wrapS=value.wrapT=THREE.RepeatWrapping;value.minFilter=THREE.LinearMipmapLinearFilter;value.magFilter=THREE.LinearFilter;value.colorSpace=colorSpace;value.needsUpdate=true;return value;}

export function createTerrainMaterial():THREE.MeshStandardMaterial {
  const color=new Uint8Array(SIZE*SIZE*4),normal=new Uint8Array(SIZE*SIZE*4),roughness=new Uint8Array(SIZE*SIZE*4);
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const i=(y*SIZE+x)*4,h=height(x,y),dx=height((x+1)%SIZE,y)-height((x-1+SIZE)%SIZE,y),dy=height(x,(y+1)%SIZE)-height(x,(y-1+SIZE)%SIZE),n=new THREE.Vector3(-dx*.72,-dy*.72,1).normalize(),grain=Math.round(224+h*18);
    color[i]=grain;color[i+1]=Math.min(255,grain+2);color[i+2]=Math.max(0,grain-3);color[i+3]=255;
    normal[i]=Math.round((n.x*.5+.5)*255);normal[i+1]=Math.round((n.y*.5+.5)*255);normal[i+2]=Math.round((n.z*.5+.5)*255);normal[i+3]=255;
    const r=Math.round(218+h*22);roughness[i]=r;roughness[i+1]=r;roughness[i+2]=r;roughness[i+3]=255;
  }
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,map:texture(color,THREE.SRGBColorSpace),normalMap:texture(normal,THREE.NoColorSpace),roughnessMap:texture(roughness,THREE.NoColorSpace),normalScale:new THREE.Vector2(.11,.11)});
  material.name='norway-terrain-pbr';return material;
}
