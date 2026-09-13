import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { shorelineX } from '../src/world/fjord-study.js';
import { compileGraph, findPath } from '../src/rail/graph.js';
import { advanceMotion } from '../src/simulation/motion.js';
import { FIXED_DT } from '../src/simulation/clock.js';

export const railPoint=(z:number):Vec3=>({x:shorelineX(z)+75,y:15,z});
export function studyCurve(start:number,end:number):CubicCurve {
  const p0=railPoint(start),p3=railPoint(end),span=(end-start)/3;
  return {p0,p1:{x:p0.x+95/720*Math.cos((start-750)/720)*span,y:15,z:start+span},p2:{x:p3.x-95/720*Math.cos((end-750)/720)*span,y:15,z:end-span},p3};
}
export function createStudyState():GameState {
  const state=createInitialState();
  state.campaignId='fjord-study';state.world={seed:140919,widthM:4000,depthM:4000,cellM:20,generatorVersion:2,biomeId:'fjord-study'};
  const stops=[850,1370,2050,2850];
  state.railway={revision:1,nodes:stops.map((z,i)=>({id:`node:${5+i}`,position:railPoint(z)})),edges:stops.slice(1).map((z,i)=>({id:`edge:${9+i}`,from:`node:${5+i}`,to:`node:${6+i}`,curve:studyCurve(stops[i]!,z),speedLimitMps:18,ownerId:'company:1'}))};
  state.towns=state.towns.map((town,i)=>({...town,position:{...railPoint([920,2040,2790][i]!),x:railPoint([920,2040,2790][i]!).x+60}}));
  state.stations=[{id:'station:12',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[]},{id:'station:13',nodeId:'node:8',townId:'town:4',classId:'rural-halt',storage:[]}];
  state.routes=[{id:'route:14',stops:['station:12','station:13'],mode:'shuttle'}];
  state.trains=[{id:'train:15',routeId:'route:14',locomotiveId:'wagon-motion-probe',vehicleIds:[],speedMps:18,phase:'running',dwellTicks:0,cargo:[],motion:{path:findPath(state.railway,'node:5','node:8')!,leg:1,distanceM:120,arrived:false}}];
  state.nextEntityId=16;
  return state;
}
export function studyStepper(state:GameState):()=>void {
  const geometry=compileGraph(state.railway);
  return ()=>{
    state.tick++;
    const train=state.trains[0]!;
    if(train.motion.arrived) {
      train.phase='dwelling';train.dwellTicks++;
      if(train.dwellTicks<60)return;
      train.motion={path:[...train.motion.path].reverse().map(leg=>({...leg,reverse:!leg.reverse})),leg:0,distanceM:0,arrived:false};train.dwellTicks=0;train.phase='running';
    }
    advanceMotion(train.motion,train.speedMps*FIXED_DT,geometry);
  };
}
