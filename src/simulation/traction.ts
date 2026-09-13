import { vehicleDefinition } from '../content/vehicles.js';
import type { Train } from '../domain/model.js';

export const GRAVITY=9.80665;
export const SERVICE_BRAKE_MPS2=.6;

export interface ConsistPhysics {massKg:number;powerW:number;tractiveForceN:number;maxSpeedMps:number;runningCostPerKm:number}

export function consistPhysics(train:Pick<Train,'locomotiveId'|'vehicleIds'>):ConsistPhysics {
  const definitions=[vehicleDefinition(train.locomotiveId),...train.vehicleIds.map(vehicleDefinition)];
  if(definitions.some(value=>!value))throw new Error('Train contains unknown vehicle content');
  const values=definitions.map(value=>value!);
  return {
    massKg:values.reduce((sum,value)=>sum+value.massKg,0),
    powerW:values.reduce((sum,value)=>sum+value.powerW,0),
    tractiveForceN:values.reduce((sum,value)=>sum+value.tractiveForceN,0),
    maxSpeedMps:Math.min(...values.map(value=>value.maxSpeedMps)),
    runningCostPerKm:values.reduce((sum,value)=>sum+value.runningCostPerKm,0)
  };
}

export function tractionAcceleration(physics:ConsistPhysics,speedMps:number,signedGrade:number):number {
  if(physics.massKg<=0||speedMps<0||!Number.isFinite(signedGrade))throw new Error('Invalid traction input');
  const traction=Math.min(physics.tractiveForceN,physics.powerW/Math.max(speedMps,1));
  const resistance=.002*physics.massKg*GRAVITY+physics.massKg*GRAVITY*signedGrade;
  return (traction-resistance)/physics.massKg;
}

export const brakingSpeed=(distanceM:number)=>Math.sqrt(Math.max(0,2*SERVICE_BRAKE_MPS2*distanceM));
