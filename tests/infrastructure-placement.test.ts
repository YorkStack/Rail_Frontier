import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Id} from '../src/domain/model.js';
import {emptyOperations} from '../src/domain/operations.js';
import {compileCurve} from '../src/rail/geometry.js';
import {deriveInfrastructurePlacements} from '../src/rendering/infrastructure-placement.js';

const edgeId='edge:1' as Id<'edge'>;
const curve={p0:{x:0,y:10,z:0},p1:{x:0,y:10,z:40},p2:{x:0,y:10,z:80},p3:{x:0,y:10,z:120}};
const geometry=new Map([[edgeId,compileCurve(curve)]]) as ReadonlyMap<Id<'edge'>,ReturnType<typeof compileCurve>>;

test('saved bridge and tunnel boundaries are the sole source of visible structure transitions',()=>{
  const operations=emptyOperations();
  operations.infrastructure[edgeId]={spans:[{startM:6,endM:58,kind:'bridge'},{startM:75,endM:110,kind:'tunnel'}],constructionCost:1,maintenancePerDay:1,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};
  const result=deriveInfrastructurePlacements(geometry,operations.infrastructure,operations.terrain);
  const portals=result.transitions.filter(p=>p.kind==='tunnel-portal');assert.ok(Math.cos(portals[0]!.rotationY)<-.99);assert.ok(Math.cos(portals[1]!.rotationY)>.99);
  assert.deepEqual(result.bridgeModules.map(item=>item.lengthM),[24,24,4]);
  assert.deepEqual(result.transitions.map(item=>[item.kind,item.boundary,item.position.z]),[
    ['bridge-abutment','start',6],['bridge-abutment','end',58],['tunnel-portal','start',75],['tunnel-portal','end',110]
  ]);
});

test('track geometry without persisted engineered spans creates no bridge or portal guesses',()=>{
  const operations=emptyOperations(),result=deriveInfrastructurePlacements(geometry,operations.infrastructure,operations.terrain);
  assert.equal(result.bridgeModules.length,0);assert.equal(result.transitions.length,0);assert.equal(result.retainingWalls.length,0);
});

test('continuous structures across curve joins omit internal transitions',()=>{
  const secondId='edge:2' as Id<'edge'>,secondCurve={p0:curve.p3,p1:{x:0,y:10,z:130},p2:{x:0,y:10,z:140},p3:{x:0,y:10,z:150}},joined=new Map([...geometry,[secondId,compileCurve(secondCurve)]]) as ReadonlyMap<Id<'edge'>,ReturnType<typeof compileCurve>>,operations=emptyOperations();
  operations.infrastructure[edgeId]={spans:[{startM:20,endM:120,kind:'bridge'}],constructionCost:1,maintenancePerDay:1,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};operations.infrastructure[secondId]={spans:[{startM:0,endM:30,kind:'bridge'}],constructionCost:1,maintenancePerDay:1,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};
  const result=deriveInfrastructurePlacements(joined,operations.infrastructure,operations.terrain);
  assert.deepEqual(result.transitions.map(item=>[item.boundary,item.position.z]),[['start',20],['end',150]]);
});

test('deep saved cut and fill sections create deterministic paired retaining-wall modules',()=>{
  const operations=emptyOperations();operations.terrain={revision:1,patchGeneratorVersion:1,operations:[{id:'terrain:1:edge:1',kind:'alignment',version:1,sequence:1,sourceId:edgeId,curve,formationWidthM:6,shoulderWidthM:9,sections:[{startM:0,endM:25,kind:'cut',maxDepthM:3,crossSectionAreaM2:1,volumeM3:25},{startM:25,endM:35,kind:'formation',maxDepthM:.2,crossSectionAreaM2:1,volumeM3:10},{startM:35,endM:43,kind:'fill',maxDepthM:1,crossSectionAreaM2:1,volumeM3:8}],bounds:{minX:-20,minZ:-20,maxX:20,maxZ:140}}]};
  const first=deriveInfrastructurePlacements(geometry,operations.infrastructure,operations.terrain),second=deriveInfrastructurePlacements(geometry,operations.infrastructure,structuredClone(operations.terrain));
  assert.equal(first.retainingWalls.length,6);assert.ok(first.retainingWalls.every(item=>item.earthwork==='cut'&&item.heightM===3));assert.deepEqual(first.retainingWalls,second.retainingWalls);
});

test('wall tops follow each local shoulder, tapering instead of repeating the section maximum',()=>{
 const operations=emptyOperations();operations.terrain={revision:1,patchGeneratorVersion:1,operations:[{id:'terrain:1:edge:1',kind:'alignment',version:1,sequence:1,sourceId:edgeId,curve,formationWidthM:6,shoulderWidthM:9,sections:[{startM:0,endM:36,kind:'cut',maxDepthM:8,crossSectionAreaM2:1,volumeM3:36}],bounds:{minX:-20,minZ:-20,maxX:20,maxZ:140}}]};
 const surface={widthM:500,depthM:500,waterLevelM:null,sample:(x:number,z:number)=>({elevationM:10+z/12,waterLevelM:null,forest:0,rock:1,urban:0})};
 const walls=deriveInfrastructurePlacements(geometry,operations.infrastructure,operations.terrain,surface).retainingWalls;
 assert.equal(walls.length,3); // The opposite shoulder is outside this test heightfield.
 assert.ok(walls.every(w=>w.heightM<4&&w.endHeightM>w.startHeightM));
 for(const wall of walls)assert.ok(Math.abs(wall.startRailY-.55+wall.startHeightM-surface.sample(wall.position.x,wall.position.z-wall.lengthM/2).elevationM)<1e-9);
});
