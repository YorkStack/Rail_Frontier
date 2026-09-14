import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentYear,dayOfYear,DAYS_PER_YEAR,elapsedDays } from '../src/simulation/calendar.js';
import { ECONOMY_INTERVAL_TICKS } from '../src/simulation/clock.js';

test('compressed calendar derives day and year from the persisted campaign epoch',()=>{
  const state={tick:0,startingYear:1922};assert.equal(elapsedDays(state),0);assert.equal(dayOfYear(state),1);assert.equal(currentYear(state),1922);
  state.tick=ECONOMY_INTERVAL_TICKS*(DAYS_PER_YEAR-1);assert.equal(dayOfYear(state),DAYS_PER_YEAR);assert.equal(currentYear(state),1922);
  state.tick=ECONOMY_INTERVAL_TICKS*DAYS_PER_YEAR;assert.equal(dayOfYear(state),1);assert.equal(currentYear(state),1923);
});
