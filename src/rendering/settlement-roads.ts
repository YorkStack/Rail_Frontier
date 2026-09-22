import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {GameState} from '../domain/model.js';
import type {Terrain} from '../world/terrain.js';

export interface Plot {x:number;z:number;townId:string|null;footprintRadiusM?:number}
export type RoadSurface='dirt'|'cobbles'|'asphalt';
interface Point {x:number;z:number}
export interface VillageRoad {points:Point[];width:number;surface:RoadSurface;townId?:string}
/** Art-direction eras: paving reaches town streets first; farm access remains unpaved. */
export const streetEra=(year:number)=>year>=1950?'motor':'horse';
export function villageRoadSeeds(state:Pick<GameState,'towns'>,plots:readonly Plot[],southwest:boolean,year:number):VillageRoad[]{
 const roads:VillageRoad[]=[],modern=streetEra(year)==='motor';
 for(const [index,town] of state.towns.entries()){
  const houses=plots.filter(p=>p.townId===town.id);if(!houses.length)continue;
  const add=(points:Point[],width:number,central=false)=>roads.push({points,width,townId:town.id,surface:modern?'asphalt':central&&!southwest?'cobbles':'dirt'});
  if(southwest){
   for(const offset of [0,-142,142])add([-330,-180,0,180,330].map((z,i)=>({x:town.position.x+offset+Math.sin(i*1.5)*3,z:town.position.z+z})),offset===0?11:6,true);
   for(const offset of [-188,0,188])add([-200,-100,0,100,200].map((x,i)=>({x:town.position.x+x,z:town.position.z+offset+Math.sin(i*1.8)*2})),6);
  }else if(index!==1){
   const base=index===0?78:-112,spacing=index===0?38:42,rows=new Map<number,Plot[]>();
   for(const house of houses){const row=Math.round((house.z-town.position.z-base)/spacing);const group=rows.get(row)??[];group.push(house);rows.set(row,group);}
   const junctions:Point[]=[];
   for(const [row,group] of [...rows].sort((a,b)=>a[0]-b[0])){
    const z=town.position.z+base+row*spacing+(index===0?-17:17),minX=Math.min(...group.map(p=>p.x))-22,maxX=Math.max(...group.map(p=>p.x))+20;
    add(Array.from({length:6},(_,i)=>({x:minX+(maxX-minX)*i/5,z:z+Math.sin(i*1.3+row)*2})),5.5,row===0);
    junctions.push({x:minX-4,z});
   }
   if(junctions.length>1)add(junctions,4);
   // A short winding approach ends at the town forecourt, not across its railway site.
   const first=junctions[0]!;add([{x:town.position.x-48,z:town.position.z+22},{x:first.x-14,z:(town.position.z+first.z)/2},first],4);
  }else{
   // Farm courts are connected by a wandering lane, with compact loops between yards.
   const centres=[{x:town.position.x-82,z:town.position.z-65},{x:town.position.x+94,z:town.position.z+18},{x:town.position.x-8,z:town.position.z+108}];
   add([centres[0]!,{x:town.position.x-8,z:town.position.z-32},centres[1]!,{x:town.position.x+68,z:town.position.z+83},centres[2]!],4);
   for(const c of centres)roads.push({points:Array.from({length:9},(_,i)=>({x:c.x+Math.cos(i/8*Math.PI*2)*17,z:c.z+Math.sin(i/8*Math.PI*2)*17})),width:3,townId:town.id,surface:'dirt'});
  }
 }
 return roads;
}
function roadMaterial(surface:RoadSurface):THREE.MeshStandardMaterial {
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:surface==='asphalt'?.93:1,transparent:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('void main() {','varying vec2 roadUV;varying vec2 roadWorld;\nvoid main() {\nroadUV=uv;roadWorld=(modelMatrix*vec4(position,1.0)).xz;');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',`varying vec2 roadUV;varying vec2 roadWorld;
float roadHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float roadNoise(vec2 p){vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(roadHash(cell),roadHash(cell+vec2(1.,0.)),f.x),mix(roadHash(cell+vec2(0.,1.)),roadHash(cell+vec2(1.,1.)),f.x),f.y);}
void main() {`);
  const color=surface==='cobbles'?`vec2 tile=vec2(roadWorld.x*2.4+mod(floor(roadWorld.y*3.3),2.0)*.5,roadWorld.y*3.3);vec2 f=fract(tile);float seam=smoothstep(.025,.12,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));float stone=roadHash(floor(tile));vec3 roadColor=mix(vec3(.09,.085,.07),mix(vec3(.15,.15,.13),vec3(.26,.25,.22),stone),seam);roadColor=mix(roadColor,vec3(.20,.195,.17),smoothstep(.22,.9,max(fwidth(tile.x),fwidth(tile.y))));`
   :surface==='asphalt'?`vec3 roadColor=vec3(.085,.09,.09)*(0.9+.2*roadHash(floor(roadWorld*32.)));`
   :`float grain=mix(roadHash(floor(roadWorld*12.)),.5,smoothstep(.3,1.,max(fwidth(roadWorld.x),fwidth(roadWorld.y))*12.));float roadPatch=roadNoise(roadWorld*.7);vec3 roadColor=mix(vec3(.14,.095,.045),vec3(.29,.20,.10),.35*grain+.65*roadPatch);`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\n${color}\ndiffuseColor.rgb*=roadColor;diffuseColor.a*=smoothstep(0.,.35,roadUV.x)*smoothstep(0.,.35,roadWidth-roadUV.x);`);
  shader.fragmentShader=shader.fragmentShader.replace('varying vec2 roadUV;',`varying vec2 roadUV;uniform float roadWidth;`);shader.uniforms.roadWidth={value:material.userData.width};
 };
 material.customProgramCacheKey=()=>`village-road-${surface}`;return material;
}
/** Checked polylines are sampled without a spline that could cut obstacle corners. */
export function createVillageRoads(terrain:Terrain,roads:readonly VillageRoad[]):THREE.Group {
 const group=new THREE.Group();group.name='village-roads';const batches=new Map<string,{surface:RoadSurface;width:number;geometries:THREE.BufferGeometry[]}>();
 for(const road of roads){
  if(road.points.length<2)continue;
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];let distance=0;
  const vertex=(x:number,z:number,u:number,v:number)=>{positions.push(x,terrain.sample(Math.max(0,Math.min(terrain.widthM,x)),Math.max(0,Math.min(terrain.depthM,z))).elevationM+.16,z);uv.push(u,v);return positions.length/3-1;};
  for(let j=1;j<road.points.length;j++){
   const a=road.points[j-1]!,b=road.points[j]!,length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.001)continue;
   const dx=(b.x-a.x)/length,dz=(b.z-a.z)/length,steps=Math.max(1,Math.ceil(length/1.5)),base=positions.length/3;
   for(let i=0;i<=steps;i++){for(const side of [-1,1])vertex(a.x+(b.x-a.x)*i/steps-dz*road.width*.5*side,a.z+(b.z-a.z)*i/steps+dx*road.width*.5*side,(side+1)*road.width/2,distance+length*i/steps);if(i){const k=base+i*2;indices.push(k-2,k-1,k,k-1,k+1,k);}}
   distance+=length;
  }
  // Rounded, overlapping caps make junctions continuous without clipped road pieces.
  for(const p of road.points){const center=vertex(p.x,p.z,road.width/2,distance);for(let i=0;i<=16;i++){const angle=i/16*Math.PI*2;vertex(p.x+Math.cos(angle)*road.width/2,p.z+Math.sin(angle)*road.width/2,road.width/2+Math.cos(angle)*road.width/2,distance+Math.sin(angle)*road.width/2);if(i)indices.push(center,center+i+1,center+i);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const key=road.surface+':'+road.width,batch=batches.get(key)??{surface:road.surface,width:road.width,geometries:[]};batch.geometries.push(geometry);batches.set(key,batch);
 }
 for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometries,false);batch.geometries.forEach(g=>g.dispose());if(!geometry)continue;const material=roadMaterial(batch.surface);material.userData.width=batch.width;const mesh=new THREE.Mesh(geometry,material);mesh.name='village-road-'+batch.surface;mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
