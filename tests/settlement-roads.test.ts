import {test} from 'node:test';
import assert from 'node:assert/strict';
import {villageRoads,createVillageRoads} from '../src/rendering/settlement-roads.js';
import {Heightfield} from '../src/world/terrain.js';
import {createInitialState} from '../src/content/norway.js';

test('village roads follow populated rows, change surfaces with the era and conform to sloped terrain',()=>{
 const state=createInitialState();state.towns=[{...state.towns[0]!,position:{x:200,y:0,z:200}}];const plots=[0,1,2].map(i=>({x:170+i*29,z:278,y:0,townId:state.towns[0]!.id,footprintRadiusM:7.5}));
 const roads=villageRoads(state,plots,false,1900),modern=villageRoads(state,plots,false,1960);assert.ok(roads.some(r=>r.surface==='cobbles'));assert.ok(roads.some(r=>r.surface==='dirt'));assert.ok(modern.every(r=>r.surface==='asphalt'));assert.ok(roads[0]!.points.every(p=>p.z>250));
 const terrain=new Heightfield(2,2,1000,new Float64Array([0,50,20,70])),mesh=createVillageRoads(terrain,roads,plots);
 mesh.traverse(object=>{if('geometry' in object){const geometry=(object as import('three').Mesh).geometry,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');for(let i=0;i<p.count;i++){assert.ok(Math.abs(p.getY(i)-terrain.sample(p.getX(i),p.getZ(i)).elevationM-.16)<1e-4);assert.ok(n.getY(i)>=0);}}});
});
