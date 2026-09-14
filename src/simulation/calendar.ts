import type { GameState } from '../domain/model.js';
import { ECONOMY_INTERVAL_TICKS } from './clock.js';

export const DAYS_PER_YEAR=360;
export const elapsedDays=(state:Pick<GameState,'tick'>):number=>Math.floor(state.tick/ECONOMY_INTERVAL_TICKS);
export const currentYear=(state:Pick<GameState,'tick'|'startingYear'>):number=>state.startingYear+Math.floor(elapsedDays(state)/DAYS_PER_YEAR);
export const dayOfYear=(state:Pick<GameState,'tick'>):number=>elapsedDays(state)%DAYS_PER_YEAR+1;
