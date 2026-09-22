import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Heightfield} from '../src/world/terrain.js';
import {surveyStationForecourt} from '../src/world/station-forecourt.js';
import {createStationForecourt} from '../src/rendering/station-forecourt.js';
import {readBuildingAccess,type BuildingAccess} from '../src/rendering/building-access.js';
import {previewStationAccess} from '../src/application/station-access-preview.js';
import {RailFrontierGame} from '../src/application/game.js';
import {createInitialState} from '../src/content/norway.js';
import {arizonaV2} from '../src/content/arizona.js';
import {generateArizonaSettlements} from '../src/rendering/arizona-settlement-placement.js';
import {createNorwayGameState} from '../src/content/industries.js';
import {ContentRegistry} from '../src/content/registry.js';
import {surveyStationSite} from '../src/rail/station-layout.js';
import {stationDefinition} from '../src/content/stations.js';
import {generateSettlementAccess} from '../src/world/settlement-access.js';
import {generateNorwaySettlements} from '../src/rendering/settlement-placement.js';

test('forecourt meets the doorway and ground with solid support; buried or submerged sites are rejected',()=>{
 const terrain=new Heightfield(2,2,1000,new Float64Array([10,10,10,10])),center={x:100,y:10.55,z:100};
 for(const yaw of [0,.7,Math.PI/2,Math.PI]){const court=surveyStationForecourt(terrain,'station:1',center,yaw);assert.ok(court.valid);assert.equal(court.entrance.y,10.63);assert.equal(court.exit.y,10.16);for(const row of court.rows)for(const p of row)assert.ok(p.y>terrain.sample(p.x,p.z).elevationM);const mesh=createStationForecourt(court,terrain);assert.ok(mesh.getObjectByName('forecourt-paving'));assert.ok(mesh.getObjectByName('forecourt-support'));}
 assert.equal(surveyStationForecourt(terrain,'station:1',{...center,y:9},0).valid,false);
 assert.equal(surveyStationForecourt(terrain,'station:1',{...center,y:15},0).valid,false);
 const flooded=new Heightfield(2,2,1000,new Float64Array([10,10,10,10]),11);assert.equal(surveyStationForecourt(flooded,'station:1',center,0).valid,false);
 assert.equal(surveyStationForecourt(terrain,'station:1',{x:995,y:10.55,z:100},0).valid,false);
});

for(const southwest of [false,true])test(`access preview matches actual construction without mutating state (${southwest?'Arizona':'Norway'})`,async()=>{
 const generate=southwest?generateArizonaSettlements:generateNorwaySettlements,state=southwest?createInitialState(arizonaV2):createNorwayGameState(),base=new ContentRegistry().resolve(state).worldGenerator.generate(state.world),loader=new GLTFLoader(),assets=new Map<string,BuildingAccess>();
 for(const id of new Set(generate(base,state).map(p=>p.assetId))){const bytes=readFileSync(`assets/runtime/models/${southwest?'arizona':'norway'}/${id}_lod0.glb`),scene=(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene,access=readBuildingAccess(scene);if(access)assets.set(id,access);}
 const before=JSON.stringify(state),ground=base.sample(state.towns[0]!.position.x,state.towns[0]!.position.z);
 for(const angle of [0,55,180]){
  const game=new RailFrontierGame(state,base),position=state.towns[0]!.position,definition=stationDefinition('rural-halt')!,site=surveyStationSite(game.terrain,position,angle*Math.PI/180,definition.platformLengthM),quotedCost=definition.purchaseCost+site.earthworkCost,request={requestId:angle,state:structuredClone(state),assets:[...assets],position,orientationRad:site.orientationRad,classId:definition.id,quotedCost};
  const preview=previewStationAccess(request,base);assert.equal(JSON.stringify(state),before);assert.deepEqual(base.sample(position.x,position.z),ground);
  const result=game.dispatch({sequence:1,command:{type:'placeStation',position,orientationRad:site.orientationRad,classId:definition.id,quotedCost,expectedRevision:state.railway.revision}});assert.ok(result.ok);const built=game.snapshot(),actual=generateSettlementAccess(game.terrain,built,generate(game.terrain,built),assets,southwest);assert.deepEqual(actual,preview.network);assert.equal(preview.stationId,result.createdIds[0]);assert.ok(preview.court.valid);assert.equal(preview.status,'connected');
  assert.equal(game.snapshot().company.cash,state.company.cash-quotedCost);
 }
});
