import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {terrainMesh} from '../src/rendering/terrain-mesh.js';
import {Heightfield} from '../src/world/terrain.js';
import {arizonaBiome,norwayBiome} from '../src/world/biome.js';

test('terrain material supplies natural world-space PBR families, mipmaps and tangents',()=>{
  const terrain=new Heightfield(3,3,25,new Float64Array([0,6,18,5,20,55,12,45,95]),0,{forest:new Float32Array(9).fill(.5),rock:new Float32Array(9).fill(.25),urban:new Float32Array(9)}),mesh=terrainMesh(terrain,norwayBiome),material=mesh.material;
  assert.equal(material.name,'norway-terrain-pbr-v2');assert.equal(material.map?.colorSpace,THREE.SRGBColorSpace);assert.equal(material.normalMap?.colorSpace,THREE.NoColorSpace);assert.equal(material.roughnessMap?.colorSpace,THREE.NoColorSpace);assert.equal((material.map?.image as {width:number}).width,512);assert.equal(material.map?.minFilter,THREE.LinearMipmapLinearFilter);assert.equal(material.map?.generateMipmaps,true);assert.equal(material.map?.anisotropy,8);assert.deepEqual(material.userData.terrainAtlas.families,['meadow','forest-floor','gravel-soil','rock']);assert.equal(material.userData.terrainAtlas.triplanarRock,true);assert.ok(mesh.geometry.getAttribute('uv'));assert.ok(mesh.geometry.getAttribute('tangent'));assert.equal(mesh.geometry.getAttribute('terrainMask').count,9);assert.equal(mesh.geometry.getAttribute('color').count,9);
  mesh.geometry.dispose();material.map?.dispose();material.normalMap?.dispose();material.roughnessMap?.dispose();material.dispose();
});

test('Arizona terrain selects dust, talus, compacted soil and sandstone families',()=>{
  const terrain=new Heightfield(2,2,25,new Float64Array([40,55,70,110]),0,{forest:new Float32Array([0,.1,.2,.3]),rock:new Float32Array([0,.25,.6,1]),urban:new Float32Array([1,.4,0,0])}),mesh=terrainMesh(terrain,arizonaBiome),material=mesh.material;
  assert.equal(material.name,'arizona-terrain-pbr-v2');
  assert.deepEqual(material.userData.terrainAtlas.families,['dust','talus','compacted-soil','sandstone']);
  assert.deepEqual(Array.from(mesh.geometry.getAttribute('terrainMask').array,value=>Number(value.toFixed(2))),[0,0,1,.1,.25,.4,.2,.6,0,.3,1,0]);
  mesh.geometry.dispose();material.map?.dispose();material.normalMap?.dispose();material.roughnessMap?.dispose();material.dispose();
});
