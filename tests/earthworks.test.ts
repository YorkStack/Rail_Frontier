import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {compileCurve} from '../src/rail/geometry.js';
import {quoteTrack} from '../src/rail/planner.js';
import {alignmentTerrainOperation,stationPadTerrainOperation} from '../src/rail/earthworks.js';
import {EngineeredTerrain} from '../src/world/engineered-terrain.js';
import type {CubicCurve} from '../src/domain/model.js';
import {terrainMesh} from '../src/rendering/terrain-mesh.js';
import {norwayBiome} from '../src/world/biome.js';
import * as THREE from 'three';

const line=(y:number):CubicCurve=>({p0:{x:20,y,z:100},p1:{x:80,y,z:100},p2:{x:140,y,z:100},p3:{x:180,y,z:100}});

test('semantic earthworks classify fill and rebuild an identical formation surface',()=>{
  const base=new Heightfield(3,3,100,new Float64Array(9)),curve=line(3),geometry=compileCurve(curve),quote=quoteTrack(geometry,base);assert.equal(quote.valid,true);
  const operation=alignmentTerrainOperation('edge:7',curve,base,quote.intervals,1);assert.equal(operation.kind,'alignment');if(operation.kind!=='alignment')return;assert.ok(operation.sections.some(section=>section.kind==='fill'&&section.volumeM3>0));
  const state={revision:1,patchGeneratorVersion:1 as const,operations:[operation]},first=new EngineeredTerrain(base,state),second=new EngineeredTerrain(base,structuredClone(state));
  assert.ok(Math.abs(first.sample(100,100).elevationM-2.45)<.01);assert.equal(first.sample(100,100).elevationM,second.sample(100,100).elevationM);assert.equal(first.sample(100,160).elevationM,0);
});

test('station pad operation levels its footprint and preserves distant terrain',()=>{
  const base=new Heightfield(3,3,100,new Float64Array([0,1,2,1,2,3,2,3,4])),operation=stationPadTerrainOperation('station:5',{x:100,y:2,z:100},0,80,18,1),terrain=new EngineeredTerrain(base,{revision:1,patchGeneratorVersion:1,operations:[operation]});
  assert.equal(terrain.sample(100,100).elevationM,1.45);assert.equal(terrain.sample(100,108).elevationM,1.45);assert.equal(terrain.sample(10,10).elevationM,base.sample(10,10).elevationM);
});

test('bridge and tunnel intervals do not flatten the surface',()=>{
  const bridgeBase=new Heightfield(3,3,100,new Float64Array(9).fill(-20),0),bridgeCurve=line(5),bridgeQuote=quoteTrack(compileCurve(bridgeCurve),bridgeBase),bridge=alignmentTerrainOperation('edge:8',bridgeCurve,bridgeBase,bridgeQuote.intervals,1),bridgeTerrain=new EngineeredTerrain(bridgeBase,{revision:1,patchGeneratorVersion:1,operations:[bridge]});
  assert.equal(bridgeTerrain.sample(100,100).elevationM,-20);
  const tunnelBase=new Heightfield(3,3,100,new Float64Array(9).fill(30)),tunnelCurve=line(5),tunnelQuote=quoteTrack(compileCurve(tunnelCurve),tunnelBase),tunnel=alignmentTerrainOperation('edge:9',tunnelCurve,tunnelBase,tunnelQuote.intervals,1),tunnelTerrain=new EngineeredTerrain(tunnelBase,{revision:1,patchGeneratorVersion:1,operations:[tunnel]});
  assert.equal(tunnelTerrain.sample(100,100).elevationM,30);
});

test('refined engineered cells render the same triangle surface used by terrain queries',()=>{
  const base=new Heightfield(3,3,100,new Float64Array(9)),curve=line(3),quote=quoteTrack(compileCurve(curve),base),operation=alignmentTerrainOperation('edge:10',curve,base,quote.intervals,1),terrain=new EngineeredTerrain(base,{revision:1,patchGeneratorVersion:1,operations:[operation]}),mesh=terrainMesh(terrain,norwayBiome);mesh.updateMatrixWorld(true);
  const x=100,z=100,hit=new THREE.Raycaster(new THREE.Vector3(x,100,z),new THREE.Vector3(0,-1,0)).intersectObject(mesh)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-terrain.sample(x,z).elevationM)<.001);assert.ok(mesh.geometry.getIndex()!.count/3>8);mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
});
