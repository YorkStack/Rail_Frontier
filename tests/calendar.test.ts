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

test('vehicle catalogue unlocks the Di 3B in 1960 with its measured dimensions and power',()=>{
  assert.deepEqual(availableVehicles(1959,'locomotive').map(vehicle=>vehicle.id),['nord-2-6-0']);assert.deepEqual(availableVehicles(1960,'locomotive').map(vehicle=>vehicle.id),['nord-2-6-0','nord-di-3b']);
  const diesel=vehicleDefinition('nord-di-3b')!;assert.equal(diesel.traction,'diesel');assert.equal(diesel.lengthM,18.9);assert.equal(diesel.massKg,103_000);assert.equal(diesel.powerW,1_305_000);assert.equal(diesel.maxSpeedMps,39.72);
});
