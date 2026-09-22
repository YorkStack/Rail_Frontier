import {buildSettlementNavigation,SettlementNavigator} from '../src/world/settlement-navigation.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Heightfield} from '../src/world/terrain.js';
import {pathValidator,routeSettlementPath,connectSettlementPaths,localToWorld,type PathObstacle} from '../src/world/settlement-paths.js';
import {readBuildingAccess,placedBuildingAccess,placedStationAccess} from '../src/rendering/building-access.js';
import {generateNorwaySettlements} from '../src/rendering/settlement-placement.js';
import {generateNorwayV3World} from '../src/world/norway-v3.js';
import {norwayV3} from '../src/content/norway.js';
import {createNorwayPreviewState} from '../src/content/norway-preview.js';
import {villageRoadSeeds} from '../src/rendering/settlement-roads.js';
import {compileGraph} from '../src/rail/graph.js';
const flat=()=>new Heightfield(2,2,1000,new Float64Array([10,10,10,10]));

test('pedestrian routes detour around buildings and never invent rail or water crossings',()=>{
 const terrain=flat(),obstacles:PathObstacle[]=[{id:'house',x:150,z:100,halfX:10,halfZ:15,rotationY:.3}],valid=pathValidator(terrain,obstacles,[]),a={x:100,z:100},b={x:200,z:100};
 assert.equal(valid(a,b,3.4),false);const path=routeSettlementPath(a,[b],valid)!;assert.ok(path.length>2);for(let i=1;i<path.length;i++)assert.ok(valid(path[i-1]!,path[i]!,3.4));
 const railway=pathValidator(terrain,[],[[{x:150,z:0},{x:150,z:1000}]]);assert.equal(routeSettlementPath(a,[b],railway),null);
 const water=new Heightfield(3,2,100,new Float64Array([10,-20,10,10,-20,10]),0);assert.equal(routeSettlementPath({x:20,z:50},[{x:180,z:50}],pathValidator(water,[],[])),null);
});

test('rotated station access stays on its street side and unreachable access is explicit',()=>{
 const terrain=flat(),station=placedStationAccess('station:1','town:1',{x:100,z:100},Math.PI/2);
 assert.deepEqual(station.entrance.door,localToWorld({x:100,z:100},Math.PI/2,14.7,-1.5));assert.ok(station.entrance.approach.z<station.entrance.door.z);
 const house={id:'house',townId:'town:1',kind:'house' as const,door:{x:100,z:150},approach:{x:100,z:146}},seeds=[{townId:'town:1',points:[{x:100,z:140}]}];
 const connected=connectSettlementPaths(terrain,[station.obstacle],[],[house,station.entrance],seeds);assert.equal(connected.access['station:1'],'connected');
 const blocked=connectSettlementPaths(terrain,[station.obstacle],[[{x:0,z:120},{x:1000,z:120}]],[house,station.entrance],seeds);assert.equal(blocked.access['station:1'],'blocked');
 assert.deepEqual(connectSettlementPaths(terrain,[station.obstacle],[],[house,station.entrance],seeds),connected);
});

test('authored Norway thresholds connect all residential plots on the actual fjord terrain',async()=>{
 const terrain=generateNorwayV3World(norwayV3.world),state=createNorwayPreviewState(terrain,norwayV3);state.railway.edges=[];state.railway.nodes=[];const plots=generateNorwaySettlements(terrain,state),obstacles:PathObstacle[]=[],entrances=[];
 const loader=new GLTFLoader();
 for(const assetId of new Set(plots.map(p=>p.assetId))){const bytes=readFileSync(`assets/runtime/models/norway/${assetId}_lod0.glb`),asset=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const access=readBuildingAccess(asset.scene);
  for(const plot of plots.filter(p=>p.assetId===assetId)){if(access){const placed=placedBuildingAccess(plot,access);obstacles.push(placed.obstacle);if(placed.entrance)entrances.push(placed.entrance);}else obstacles.push({id:plot.id,x:plot.x,z:plot.z,halfX:plot.footprintRadiusM,halfZ:plot.footprintRadiusM,rotationY:plot.rotationY});}
 }
 const rails=[...compileGraph(state.railway).values()].map(g=>g.samples.map(s=>s.position)),seeds=villageRoadSeeds(state,plots,false,1900).map(r=>({townId:r.townId!,points:r.points})),before=JSON.stringify(state),result=connectSettlementPaths(terrain,obstacles,rails,entrances,seeds);
 const navigation=buildSettlementNavigation(result.paths,entrances,result.hubs,result.access),navigator=new SettlementNavigator(navigation);for(const entrance of entrances)assert.ok(navigator.routeToTown(entrance.id),entrance.id+' must reach its town hub');
 assert.equal(entrances.length,45);assert.deepEqual(Object.entries(result.access).filter(([,value])=>value!=='connected'),[]);assert.equal(JSON.stringify(state),before);assert.deepEqual(result,connectSettlementPaths(terrain,obstacles,rails,entrances,seeds));
});
