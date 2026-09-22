import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RailFrontierGame} from '../src/application/game.js';
import {createInitialState} from '../src/content/norway.js';
import {Heightfield} from '../src/world/terrain.js';
import {surveyStationSite} from '../src/rail/station-layout.js';
import {stationDefinitions} from '../src/content/stations.js';
import {compileCurve,sampleDistance} from '../src/rail/geometry.js';
import {createTrack} from '../src/rendering/track-mesh.js';
import {createStationPlatform} from '../src/rendering/station-platform.js';
import {deserialize,deserializeDocument,serialize} from '../src/persistence/save.js';
import type {GameState} from '../src/domain/model.js';

function placed(angle:number){
 const base=new Heightfield(3,3,500,new Float64Array(9).fill(12));
 const game=new RailFrontierGame(createInitialState(),base),site=surveyStationSite(game.terrain,{x:450,z:450},angle,140);
 const result=game.dispatch({sequence:1,command:{type:'placeStation',classId:'small-station',position:site.center,orientationRad:angle,expectedRevision:0,quotedCost:stationDefinitions['small-station'].purchaseCost+site.earthworkCost}});
 assert.ok(result.ok);return game;
}

test('station ballast, sleepers and rails clear actual ground along the complete rotated platform',()=>{
 for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI*1.7]){
  const game=placed(angle),state=game.snapshot();
  for(const edge of state.railway.edges){
   const geometry=compileCurve(edge.curve),track=createTrack(geometry,game.terrain);track.updateMatrixWorld(true);
   for(let d=0;d<=geometry.lengthM;d+=2){
    const p=sampleDistance(geometry,d);
    // Include the outer ballast, rather than checking only the centre of the track.
    for(const side of [-2.2,0,2.2]){
     const x=p.x+Math.cos(angle)*side,z=p.z-Math.sin(angle)*side;
     assert.ok(p.y-.36-game.terrain.sample(x,z).elevationM>.1,'ballast must not be buried in grass');
    }
   }
   const p=sampleDistance(geometry,geometry.lengthM/2),x=p.x+Math.cos(angle)*.7175,z=p.z-Math.sin(angle)*.7175;
   const hits=new THREE.Raycaster(new THREE.Vector3(x,p.y+5,z),new THREE.Vector3(0,-1,0)).intersectObject(track,true);
   assert.ok(hits.length>0);assert.ok(Math.abs(hits[0]!.point.y-p.y)<.001,'visible railhead follows the saved train path');
   track.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();}});
  }
  const platform=createStationPlatform(140);platform.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(platform.getObjectByName('platform-slab')!);
  assert.equal(bounds.min.x,1.75);assert.equal(bounds.max.z-bounds.min.z,140);
  assert.ok(bounds.min.y<-.54&&bounds.max.y>.54,'platform has a grounded foundation and a raised boarding edge');
 }
});

test('schema 10 station ground migrates once without moving rails, spending money or losing drafts',()=>{
 const game=placed(Math.PI/4),current=structuredClone(game.snapshot()) as GameState,legacy=JSON.parse(serialize(current));
 legacy.schemaVersion=10;legacy.gameVersion='0.10.0';
 for(const op of legacy.state.operations.terrain.operations)if(op.kind==='station-pad')op.targetElevationM=op.center.y;
 const point=current.railway.nodes[0]!.position;legacy.planning={version:1,current:{points:[point],complete:false,trackClassId:'local',design:null},past:[],future:[]};
 const original=JSON.stringify(legacy),loaded=deserializeDocument(original);
 assert.deepEqual(loaded.state,current);assert.deepEqual(loaded.planning,legacy.planning);assert.equal(JSON.stringify(legacy),original);
 assert.deepEqual(deserialize(serialize(loaded.state)),current,'new-format reload must not lower the ground twice');
 legacy.state.operations.terrain.operations[0].targetElevationM+=10;
 assert.throws(()=>deserialize(JSON.stringify(legacy)),/Invalid legacy station/);
});
