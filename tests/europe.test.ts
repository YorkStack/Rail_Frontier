import test from 'node:test';
import assert from 'node:assert/strict';
import {europeCampaigns} from '../src/content/europe.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {europeDem,geoPoint} from '../src/world/europe.js';
import {createInitialState} from '../src/content/norway.js';
import {addRegionalIndustries,industryDefinition} from '../src/content/industries.js';
import {availableVehicles,vehicleDefinition} from '../src/content/vehicles.js';
import {generateRegionalPlots,generateRegionalScenery} from '../src/rendering/regional-placement.js';
import {waterSurfacePositions} from '../src/rendering/water-surface.js';
import {Heightfield} from '../src/world/terrain.js';
import {RailFrontierGame} from '../src/application/game.js';
import {bestStationOrientation,surveyStationSite,straightCurve} from '../src/rail/station-layout.js';
import {stationDefinitions} from '../src/content/stations.js';
import {deserialize,serialize} from '../src/persistence/save.js';
import {freightRoom,serviceFreight} from '../src/simulation/transfer.js';
import {advanceIndustries} from '../src/simulation/industry.js';
import {evaluateObjectives} from '../src/simulation/objectives.js';
import type {GameState,Train} from '../src/domain/model.js';
import {readFileSync} from 'node:fs';

test('regional water clips at the interpolated shoreline instead of filling dry grid squares',()=>{
 const terrain=new Heightfield(2,2,80,new Float64Array([-2,4,4,4]),0),positions=waterSurfacePositions(terrain);
 assert.ok(positions.length>=9);assert.equal(positions.length%9,0);
 const shoreline=[...positions].filter((_,index)=>index%3!==1);assert.ok(shoreline.some(value=>value>0&&value<80));
 for(let i=0;i<positions.length;i+=3)assert.ok(positions[i]!>=0&&positions[i]!<=80&&positions[i+2]!>=0&&positions[i+2]!<=80);
});

for(const region of ['rhine','tyne'] as const)test(`${region}: real DEM, playable towns, region catalogue and save round trip`,()=>{
 const campaign=europeCampaigns[region],state=createInitialState(campaign),content=campaignContentRegistry.resolve(state),terrain=content.worldGenerator.generate(state.world),dem=europeDem[region];addRegionalIndustries(state,terrain);
 assert.equal(terrain.widthM,32000);assert.equal(terrain.depthM,32000);assert.equal(dem.heights.length,401*401);assert.ok(Math.max(...dem.heights.slice(0,100000))>200);assert.ok(dem.sources.every(s=>s.sha256.length===64&&s.url.startsWith('https://s3.amazonaws.com/')));
 const origin=geoPoint(region,dem.northLatitude,dem.westLongitude);assert.deepEqual(origin,{x:0,z:0});assert.equal(terrain.sample(0,0).elevationM,dem.heights[0]);
 assert.equal(state.industries.length,5);for(const i of state.industries){assert.ok(industryDefinition(i.definitionId));assert.ok(i.position.y>terrain.sample(i.position.x,i.position.z).waterLevelM!);}
 const game=new RailFrontierGame(state,terrain);for(const town of state.towns){const d=stationDefinitions['rural-halt'],orientationRad=bestStationOrientation(terrain,town.position,d.platformLengthM);assert.notEqual(orientationRad,null,`${town.name} needs a buildable platform direction`);const site=surveyStationSite(terrain,town.position,orientationRad!,d.platformLengthM),before=game.snapshot(),result=game.dispatch({sequence:before.operations.lastCommandSequence+1,command:{type:'placeStation',classId:d.id,position:town.position,orientationRad:orientationRad!,expectedRevision:before.railway.revision,quotedCost:d.purchaseCost+site.earthworkCost}});assert.equal(result.ok,true,JSON.stringify(result));}
 const saved=deserialize(serialize(game.snapshot() as GameState));assert.equal(campaignContentRegistry.resolve(saved).campaign.id,campaign.id);assert.equal(saved.stations.length,3);
 const pack=JSON.parse(readFileSync(`assets/runtime/packs/${region}.json`,'utf8')),ids=new Set(pack.assets.map((a:{id:string})=>a.id));const available=availableVehicles(1900,undefined,campaign.id);assert.ok(available.length>=6);for(const v of available)assert.ok(ids.has(v.id),v.id);assert.equal(available.filter(d=>d.kind==='locomotive').length,1);assert.equal(availableVehicles(2000,'locomotive',campaign.id).length,4);assert.equal(available.some(v=>v.id.startsWith('nord')),false);
 const plots=generateRegionalPlots(terrain,state);assert.ok(plots.filter(p=>p.townId).length>60);assert.deepEqual(plots,generateRegionalPlots(terrain,state));for(const p of plots)assert.ok(ids.has(p.assetId),p.assetId);
 const plants=generateRegionalScenery(terrain,state,2500);assert.equal(plants.length,2500);assert.ok(plants.some(p=>p.category==='understorey'));for(const p of plants){assert.ok(ids.has(p.assetId),p.assetId);assert.ok(p.y>terrain.sample(p.x,p.z).waterLevelM!);}
 if(region==='rhine')for(let z=0;z<=terrain.depthM;z+=terrain.cellM)assert.ok(Array.from({length:401},(_,ix)=>terrain.sample(ix*terrain.cellM,z)).some(sample=>sample.elevationM<sample.waterLevelM!),`Rhine channel interrupted at ${z} m`);
});

function industrialFixture():GameState {
 const state=createInitialState(europeCampaigns.tyne),a={x:100,y:20,z:100},b={x:1000,y:20,z:100};
 state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:straightCurve(a,b),speedLimitMps:18,ownerId:'company:1'}]};
 state.stations=[{id:'station:8',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2500000},{id:'station:9',nodeId:'node:6',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2500000}];
 state.routes=[{id:'route:10',stops:['station:8','station:9'],mode:'shuttle'}];
 state.trains=[{id:'train:11',routeId:'route:10',locomotiveId:'tyne-j21',vehicleIds:['tyne-coal','tyne-goods'],motion:{path:[{edgeId:'edge:7',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]}];
 state.industries=[{id:'industry:12',definitionId:'coal-mine',position:a,inventory:{coal:40}},{id:'industry:13',definitionId:'steelworks',position:b,inventory:{ore:30}},{id:'industry:14',definitionId:'freight-port',position:a,inventory:{oil:12}}];state.nextEntityId=15;
 state.operations.trainServices['train:11']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.operations.industryCycleTicks={'industry:12':0,'industry:13':0,'industry:14':0};return state;
}
test('regional mixed freight respects compatible wagon space, converts coal and ore, delivers steel once and reloads',()=>{
 const s=industrialFixture(),t=s.trains[0]!;serviceFreight(s,t,'station:8');assert.equal(t.cargo[0]!.kind,'coal');assert.equal(t.cargo[0]!.quantity,25);assert.equal(freightRoom(t,'coal'),0);assert.equal(freightRoom(t,'steel'),28);assert.equal(freightRoom(t,'oil'),0);
 t.cargo[0]!.distanceM=3000;serviceFreight(s,t,'station:9');assert.equal(s.industries[1]!.inventory.coal,25);assert.equal(s.operations.delivered.coal,25);
 for(let i=0;i<900;i++)advanceIndustries(s);assert.equal(s.industries[1]!.inventory.steel,12);serviceFreight(s,t,'station:9');assert.equal(t.cargo[0]!.kind,'steel');
 const restored=deserialize(serialize(s)),train=restored.trains[0]!;train.cargo[0]!.distanceM=3000;serviceFreight(restored,train,'station:8');assert.equal(restored.operations.delivered.steel,12);const cash=restored.company.cash;serviceFreight(restored,train,'station:8');assert.equal(restored.company.cash,cash);
 for(let i=0;i<600;i++)advanceIndustries(restored);assert.equal(restored.industries[2]!.inventory.steel,4);assert.equal(restored.industries[2]!.inventory.oil,8);
 const bad=structuredClone(restored);bad.trains[0]!.locomotiveId='nord-2-6-0';assert.throws(()=>serialize(bad),/another region/);bad.trains[0]!.locomotiveId='tyne-class91';assert.throws(()=>serialize(bad),/future year/);
});
test('Tyne freight charter progresses from delivered industrial cargo',()=>{
 const state=industrialFixture();state.operations.delivered.coal=55;state.operations.delivered.ore=25;state.operations.delivered.steel=20;evaluateObjectives(state);
 assert.equal(state.objectiveProgress['tyne-freight'],100);assert.ok(state.operations.completedObjectives.includes('tyne-freight'));assert.equal(state.objectiveProgress['first-passengers'],undefined);
});
test('v11 companies migrate without inventing freight or changing their balances',()=>{
 const s=createInitialState(),doc=JSON.parse(serialize(s));doc.schemaVersion=11;doc.gameVersion='0.11.0';assert.deepEqual(deserialize(JSON.stringify(doc)),s);
});
