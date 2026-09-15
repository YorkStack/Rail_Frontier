import type { GameState, Id, Train } from '../domain/model.js';
import { derivative } from '../rail/constraints.js';
import { RailNetwork } from '../rail/graph.js';
import { advanceMotion, motionPosition } from './motion.js';
import { FIXED_DT } from './clock.js';
import { accrueRunningCost } from './finance.js';
import { advanceDwell } from './station-service.js';
import { brakingSpeed, consistPhysics, SERVICE_BRAKE_MPS2, tractionAcceleration } from './traction.js';
import { serviceStop } from './transfer.js';
import { updateReservations } from './occupancy.js';

function remainingDistance(train:Train,network:RailNetwork):number {
  let result=network.geometry.get(train.motion.path[train.motion.leg]!.edgeId)!.lengthM-train.motion.distanceM;
  for(let index=train.motion.leg+1;index<train.motion.path.length;index++)result+=network.geometry.get(train.motion.path[index]!.edgeId)!.lengthM;
  return result;
}

function signedGrade(train:Train,network:RailNetwork):number {
  const traversal=train.motion.path[train.motion.leg]!,geometry=network.geometry.get(traversal.edgeId)!;
  const sample=geometry.samples;
  const forwardDistance=traversal.reverse?geometry.lengthM-train.motion.distanceM:train.motion.distanceM;
  let index=1;while(index<sample.length&&sample[index]!.distanceM<forwardDistance)index++;
  const a=sample[index-1]!,b=sample[Math.min(index,sample.length-1)]!,fraction=b.distanceM===a.distanceM?0:(forwardDistance-a.distanceM)/(b.distanceM-a.distanceM),t=a.t+(b.t-a.t)*fraction,d=derivative(geometry.curve,t),horizontal=Math.hypot(d.x,d.z);
  return horizontal<1e-9?0:(traversal.reverse?-d.y:d.y)/horizontal;
}

function stepTrain(state:GameState,train:Train,network:RailNetwork,reservedNext:boolean):void {
  if(train.phase==='dwelling'||(train.phase==='blocked'&&train.motion.arrived)){advanceDwell(state,train,network);return;}
  if(train.phase!=='running'||train.motion.arrived)return;
  const traversal=train.motion.path[train.motion.leg];if(!traversal){train.phase='blocked';train.speedMps=0;return;}
  const geometry=network.geometry.get(traversal.edgeId);if(!geometry)throw new Error('Train path uses missing track');
  const currentRemaining=geometry.lengthM-train.motion.distanceM,pathRemaining=remainingDistance(train,network),stopDistance=reservedNext?pathRemaining:currentRemaining;
  const physics=consistPhysics(train),limit=Math.min(physics.maxSpeedMps,state.railway.edges.find(edge=>edge.id===traversal.edgeId)!.speedLimitMps),target=Math.min(limit,brakingSpeed(stopDistance));
  const acceleration=train.speedMps>target? -SERVICE_BRAKE_MPS2:tractionAcceleration(physics,train.speedMps,signedGrade(train,network));
  const nextSpeed=Math.max(0,Math.min(target,train.speedMps+acceleration*FIXED_DT)),travelLimit=reservedNext?pathRemaining:Math.max(0,currentRemaining-1e-6),distanceM=Math.min(travelLimit,(train.speedMps+nextSpeed)*.5*FIXED_DT);
  try {accrueRunningCost(state,train.id,distanceM,physics.runningCostPerKm);} catch(error) {if(error instanceof Error&&error.message==='Insufficient funds'){train.phase='blocked';train.speedMps=0;return;}throw error;}
  advanceMotion(train.motion,distanceM,network.geometry);train.speedMps=nextSpeed;
  for(const lot of train.cargo)lot.distanceM+=distanceM;
  if(train.motion.arrived){train.speedMps=0;train.phase='dwelling';train.dwellTicks=0;const service=state.operations.trainServices[train.id],route=train.routeId===null?null:state.routes.find(candidate=>candidate.id===train.routeId);if(service&&route)serviceStop(state,train,route.stops[service.nextStopIndex]!);}
}

/** Cache graph geometry exactly once per revision and step trains in stable ID order. */
export function createTrainSimulation():(state:GameState)=>void {
  let revision=-1,network:RailNetwork|null=null;
  return state=>{
    if(network===null||revision!==state.railway.revision){network=new RailNetwork(state.railway);revision=state.railway.revision;}
    const occupancy=updateReservations(state);
    for(const train of [...state.trains].sort((a,b)=>a.id.localeCompare(b.id)))if(train.phase==='dwelling'||(train.phase==='blocked'&&train.motion.arrived)||occupancy.allowed.has(train.id))stepTrain(state,train,network,occupancy.reservedNext.has(train.id));
  };
}

export function trainPosition(state:GameState,trainId:Id<'train'>):ReturnType<typeof motionPosition> {
  const train=state.trains.find(candidate=>candidate.id===trainId);if(!train)throw new Error('Unknown train');
  return motionPosition(train.motion,new RailNetwork(state.railway).geometry);
}
