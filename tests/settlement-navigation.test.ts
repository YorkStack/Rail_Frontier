import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildSettlementNavigation,SettlementNavigator} from '../src/world/settlement-navigation.js';
import {connectSettlementPaths,pathValidator,type PathEntrance,type SettlementPath} from '../src/world/settlement-paths.js';
import {Heightfield} from '../src/world/terrain.js';
const path=(points:[number,number][],kind:SettlementPath['kind']='street'):SettlementPath=>({townId:'town:1',kind,width:kind==='street'?3.4:2.2,points:points.map(([x,z])=>({x,z}))});
const entrance=(id:string,x:number,z:number):PathEntrance=>({id,townId:'town:1',kind:'house',door:{x,z},approach:{x,z}});

test('walking graph splits crossings, T junctions, interior hubs and overlapping roads once',()=>{
 const paths=[path([[100,100],[200,100]]),path([[150,50],[150,100]],'door'),path([[175,80],[175,120]]),path([[125,100],[180,100]])],entries=[entrance('home',150,50),entrance('shop',175,120)],hubs={'town:1':{x:140,z:100}},access={home:'connected',shop:'connected'},input=JSON.stringify(paths),graph=buildSettlementNavigation(paths,entries,hubs,access),navigator=new SettlementNavigator(graph);
 const route=navigator.route('home','shop')!;assert.equal(route.lengthM,95);assert.deepEqual(route.points[0],{x:150,z:50});assert.deepEqual(route.points.at(-1),{x:175,z:120});assert.equal(navigator.routeToTown('home')!.lengthM,60);
 assert.ok(graph.nodes.find(n=>n.x===150&&n.z===100)!.junction);assert.ok(graph.nodes.find(n=>n.x===175&&n.z===100)!.junction);
 assert.equal(new Set(graph.edges.map(e=>e.id)).size,graph.edges.length);assert.equal(JSON.stringify(paths),input);
 assert.deepEqual(buildSettlementNavigation([...paths].reverse().map(p=>({...p,points:[...p.points].reverse()})),[...entries].reverse(),hubs,access),graph);
});

test('nearby disconnected lanes never create a shortcut or a route to a missing entrance',()=>{
 const paths=[path([[50,50],[100,50]]),path([[100.02,50],[150,50]]),path([[50,50.1],[100,50.1]])],entries=[entrance('a',50,50),entrance('b',150,50),entrance('c',50,50.1)],graph=buildSettlementNavigation(paths,entries,{'town:1':{x:100,z:50}},{a:'connected',b:'connected',c:'connected'}),navigator=new SettlementNavigator(graph);
 assert.equal(navigator.route('a','b'),null);assert.equal(navigator.route('a','c'),null);assert.equal(navigator.route('a','unknown'),null);assert.equal(navigator.routeToTown('b'),null);assert.deepEqual(navigator.route('a','a'),{points:[{x:50,z:50}],lengthM:0});
 assert.equal(new Set(graph.nodes.map(n=>n.component)).size,3);
});

test('a railway cutting a settlement invalidates routes and removal deterministically restores them',()=>{
 const terrain=new Heightfield(2,2,1000,new Float64Array([10,10,10,10])),entries=[{...entrance('home',100,100),approach:{x:100,z:104}},{...entrance('station',200,100),kind:'station' as const,approach:{x:200,z:104}}],seeds=[{townId:'town:1',points:[{x:100,z:120},{x:200,z:120}]}],rail=[[{x:150,z:0},{x:150,z:1000}]];
 const build=(rails:typeof rail)=>{const result=connectSettlementPaths(terrain,[],rails,entries,seeds);return {...result,navigation:buildSettlementNavigation(result.paths,entries,result.hubs,result.access)};};
 const before=build([]),cut=build(rail);assert.ok(new SettlementNavigator(before.navigation).route('home','station'));assert.equal(cut.access.station,'blocked');assert.equal(cut.navigation.entrances.station!.nodeId,null);assert.equal(new SettlementNavigator(cut.navigation).route('home','station'),null);
 const valid=pathValidator(terrain,[],rail);for(const e of cut.navigation.edges){const a=cut.navigation.nodes.find(n=>n.id===e.from)!,b=cut.navigation.nodes.find(n=>n.id===e.to)!;assert.ok(valid(a,b,2.2),'no graph edge silently crosses the railway');}
 assert.deepEqual(build([]),before);assert.deepEqual(build(rail),cut);
});

test('a finite rail obstruction is walked around on checked paths, never cut across',()=>{
 const terrain=new Heightfield(2,2,1000,new Float64Array([10,10,10,10])),entries=[{...entrance('home',100,100),approach:{x:100,z:104}},{...entrance('station',200,100),kind:'station' as const,approach:{x:200,z:104}}],rails=[[{x:150,z:80},{x:150,z:130}]],result=connectSettlementPaths(terrain,[],rails,entries,[{townId:'town:1',points:[{x:100,z:120}]}]),graph=buildSettlementNavigation(result.paths,entries,result.hubs,result.access),route=new SettlementNavigator(graph).route('home','station')!;
 assert.ok(route);assert.ok(route.lengthM>110);const valid=pathValidator(terrain,[],rails);for(let i=1;i<route.points.length;i++)assert.ok(valid(route.points[i-1]!,route.points[i]!,2.2));
});
