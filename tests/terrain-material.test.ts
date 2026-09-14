import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {terrainMesh} from '../src/rendering/terrain-mesh.js';
import {Heightfield} from '../src/world/terrain.js';
import {norwayBiome} from '../src/world/biome.js';

test('terrain material supplies colour-space-correct repeatable PBR maps and tangents',()=>{
  const terrain=new Heightfield(3,3,25,new Float64Array([0,6,18,5,20,55,12,45,95]),0,{forest:new Float32Array(9).fill(.5),rock:new Float32Array(9).fill(.25),urban:new Float32Array(9)}),mesh=terrainMesh(terrain,norwayBiome),material=mesh.material;
  assert.equal(material.name,'norway-terrain-pbr');assert.equal(material.map?.colorSpace,THREE.SRGBColorSpace);assert.equal(material.normalMap?.colorSpace,THREE.NoColorSpace);assert.equal(material.roughnessMap?.colorSpace,THREE.NoColorSpace);assert.equal(material.map?.wrapS,THREE.RepeatWrapping);assert.ok(mesh.geometry.getAttribute('uv'));assert.ok(mesh.geometry.getAttribute('tangent'));assert.equal(mesh.geometry.getAttribute('color').count,9);
  mesh.geometry.dispose();material.map?.dispose();material.normalMap?.dispose();material.roughnessMap?.dispose();material.dispose();
});
