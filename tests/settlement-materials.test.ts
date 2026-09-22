import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {platformSurface,streetSurface,stationConstructionYear,stationAssetFor} from '../src/world/settlement-era.js';
import {createStationPlatform} from '../src/rendering/station-platform.js';
import {surfaceTextures,metricBox} from '../src/rendering/settlement-materials.js';

test('regional surface eras retain rural paths and fixed boarding geometry',()=>{
 for(const southwest of [false,true])for(const year of [1880,1900,1930,1960,2000]){
  assert.equal(streetSurface(year,southwest,true,true),'dirt');assert.equal(streetSurface(year,southwest,false,false),'dirt');
  const platform=createStationPlatform(140,year,southwest),slab=platform.getObjectByName('platform-slab') as THREE.Mesh;platform.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(slab);
  assert.equal(box.min.x,1.75);assert.equal(box.max.z-box.min.z,140);assert.ok(Math.abs(box.max.y-.55)<1e-5);assert.equal((slab.material as THREE.Material[])[2]!.name,'surface:'+platformSurface(year,southwest));assert.equal(Boolean(platform.getObjectByName('platform-safety-strip')),year>=1980);
 }
 assert.equal(platformSurface(1900,true),'timber');assert.equal(platformSurface(1900,false),'gravel');assert.equal(platformSurface(1930,false),'pavers');assert.equal(streetSurface(1900,false,false,true),'cobbles');assert.equal(streetSurface(2000,false,false,true),'asphalt');
});

test('surface tiles carry colour, relief and roughness at a fixed metric scale',()=>{
 const signatures=new Set<string>();for(const kind of ['dirt','cobbles','asphalt','pavers','timber','stone','gravel'] as const){const maps=surfaceTextures(kind);assert.equal(surfaceTextures(kind),maps);assert.equal(maps.map.colorSpace,THREE.SRGBColorSpace);assert.equal(maps.normalMap.colorSpace,THREE.NoColorSpace);assert.ok(new Set(maps.map.image.data).size>20);assert.ok(new Set(maps.normalMap.image.data).size>5);assert.ok(new Set(maps.roughnessMap.image.data).size>5);signatures.add(Buffer.from(maps.map.image.data as Uint8Array).toString('base64'));}assert.equal(signatures.size,7);
 const box=metricBox(7.5,1.1,140),uv=box.getAttribute('uv');assert.ok(Math.max(...Array.from(uv.array))>=70,'long platforms repeat tiles instead of stretching one image');
});

test('Blender stations retain the public door socket, pitched roofs and textured facades in both LODs',()=>{
 for(const region of ['norway','arizona'])for(const suffix of ['','-interwar','-modern'])for(const lod of [0,1]){
  const bytes=readFileSync(`assets/runtime/models/${region}/${region}-station${suffix}_lod${lod}.glb`),doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()),nodes=new Map<string,{translation:number[]}>(doc.nodes.map((n:{name:string;translation:number[]})=>[n.name,n]));
  const door=nodes.get('public_entrance')!.translation;assert.ok(Math.abs(door[0]!-9.15)<1e-5);assert.equal(door[1],0);assert.equal(door[2],-1.5);
  const ridge=nodes.get('roof_ridge')!.translation,eave=nodes.get('roof_eave_left')!.translation;assert.ok(ridge[1]!>eave[1]!+1.5);assert.ok(nodes.has('RF_Station_Window'));assert.ok(nodes.has('RF_Station_DoorGlazing'));assert.ok(nodes.has('RF_Station_Chimney'));assert.ok(!nodes.has('RF_Station_Platform'));
  const wall=doc.materials.find((m:{name:string})=>m.name==='RF_Station_Wall');assert.ok(wall.pbrMetallicRoughness.baseColorTexture);assert.ok(wall.normalTexture);assert.ok(doc.images.length>=8);
 }
});

test('station architecture follows its original purchase year and ignores later upgrades',()=>{
 const state={startingYear:1900,company:{ledger:[{category:'construction',description:'Station construction',amount:-100,entityId:'station:1',tick:0},{category:'construction',description:'Station upgrade to regional-station',amount:-100,entityId:'station:1',tick:43200000},{category:'construction',description:'Station construction',amount:-100,entityId:'station:2',tick:43200000}]}} as unknown as Parameters<typeof stationConstructionYear>[0];
 assert.equal(stationConstructionYear(state,'station:1'),1900);assert.equal(stationAssetFor('norway-station',stationConstructionYear(state,'station:1')),'norway-station');assert.equal(stationAssetFor('arizona-station',stationConstructionYear(state,'station:2')),'arizona-station-modern');assert.equal(stationConstructionYear(state,'station:3'),1900);assert.equal(stationAssetFor('norway-station',1930),'norway-station-interwar');
});
