import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {captureTerrainWindow,hydrateTerrainWindow} from '../src/rail/terrain-window.js';
import {samePlanningIdentity} from '../src/rail/corridor-worker-protocol.js';

test('planning terrain window is bounded, serializable and preserves sampled nodes',()=>{
  const size=81,cellM=25,heights=new Float64Array(size*size),forest=new Float32Array(size*size);for(let z=0;z<size;z++)for(let x=0;x<size;x++){heights[z*size+x]=x*.5+z*.25;forest[z*size+x]=(x+z)/(size*2);}
  const terrain=new Heightfield(size,size,cellM,heights,0,{forest}),anchors=[{x:500,y:0,z:600},{x:1500,y:0,z:1400}],snapshot=captureTerrainWindow(terrain,anchors,200,10_000),hydrated=hydrateTerrainWindow(snapshot);
  assert.ok(snapshot.columns*snapshot.rows<=10_000);assert.ok(snapshot.originX<=500&&snapshot.originZ<=600);structuredClone(snapshot);
  for(const [column,row] of [[0,0],[snapshot.columns-1,snapshot.rows-1],[3,5]]){const x=snapshot.originX+column!*snapshot.cellM,z=snapshot.originZ+row!*snapshot.cellM;assert.deepEqual(hydrated.sample(x,z),terrain.sample(x,z));}
});

test('planning identity rejects stale worker responses across every authoritative revision',()=>{
  const current={requestId:4,railwayRevision:3,terrainRevision:2,trackClassId:'local' as const,draftKey:'a'};assert.equal(samePlanningIdentity(current,{...current}),true);
  for(const changed of [{requestId:5},{railwayRevision:4},{terrainRevision:3},{trackClassId:'regional' as const},{draftKey:'b'}])assert.equal(samePlanningIdentity(current,{...current,...changed}),false);
});
