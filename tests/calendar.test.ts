import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentYear,dayOfYear,DAYS_PER_YEAR,elapsedDays } from '../src/simulation/calendar.js';
import { ECONOMY_INTERVAL_TICKS } from '../src/simulation/clock.js';
import { availableVehicles,vehicleDefinition } from '../src/content/vehicles.js';

test('compressed calendar derives day and year from the persisted campaign epoch',()=>{
  const state={tick:0,startingYear:1922};assert.equal(elapsedDays(state),0);assert.equal(dayOfYear(state),1);assert.equal(currentYear(state),1922);
  state.tick=ECONOMY_INTERVAL_TICKS*(DAYS_PER_YEAR-1);assert.equal(dayOfYear(state),DAYS_PER_YEAR);assert.equal(currentYear(state),1922);
  state.tick=ECONOMY_INTERVAL_TICKS*DAYS_PER_YEAR;assert.equal(dayOfYear(state),1);assert.equal(currentYear(state),1923);
});

test('vehicle catalogue unlocks researched electric and diesel locomotives in their eras',()=>{
  assert.deepEqual(availableVehicles(1921,'locomotive').map(vehicle=>vehicle.id),['nord-2-6-0']);assert.deepEqual(availableVehicles(1922,'locomotive').map(vehicle=>vehicle.id),['nord-2-6-0','nord-el-1']);assert.deepEqual(availableVehicles(1959,'locomotive').map(vehicle=>vehicle.id),['nord-2-6-0','nord-el-1']);assert.deepEqual(availableVehicles(1960,'locomotive').map(vehicle=>vehicle.id),['nord-2-6-0','nord-el-1','nord-di-3b']);
  const electric=vehicleDefinition('nord-el-1')!;assert.equal(electric.traction,'electric');assert.equal(electric.lengthM,12.7);assert.equal(electric.massKg,61_300);assert.equal(electric.powerW,690_000);assert.equal(electric.tractiveForceN,157_000);assert.equal(electric.maxSpeedMps,19.44);
  const diesel=vehicleDefinition('nord-di-3b')!;assert.equal(diesel.traction,'diesel');assert.equal(diesel.lengthM,18.9);assert.equal(diesel.massKg,103_000);assert.equal(diesel.powerW,1_305_000);assert.equal(diesel.maxSpeedMps,39.72);
  assert.equal(availableVehicles(1980,'locomotive').some(vehicle=>vehicle.id==='nord-di-4'),false);assert.equal(availableVehicles(1981,'locomotive').some(vehicle=>vehicle.id==='nord-di-4'),true);const di4=vehicleDefinition('nord-di-4')!;assert.equal(di4.traction,'diesel');assert.equal(di4.lengthM,20.8);assert.equal(di4.massKg,120_000);assert.equal(di4.powerW,2_450_000);assert.equal(di4.tractiveForceN,360_000);assert.equal(di4.maxSpeedMps,38.89);
  assert.equal(availableVehicles(1995,'locomotive').some(vehicle=>vehicle.id==='nord-el-18'),false);assert.equal(availableVehicles(1996,'locomotive').some(vehicle=>vehicle.id==='nord-el-18'),true);const el18=vehicleDefinition('nord-el-18')!;assert.equal(el18.traction,'electric');assert.equal(el18.lengthM,18.5);assert.equal(el18.massKg,88_310);assert.equal(el18.powerW,5_400_000);assert.equal(el18.tractiveForceN,275_000);assert.equal(el18.maxSpeedMps,55.56);
});
