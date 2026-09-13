import type { GameState } from '../domain/model.js';
/** UI cannot mutate the live simulation through a snapshot, even from plain JavaScript. */
export function snapshotState(state:GameState):Readonly<GameState> {
  const snapshot=structuredClone(state);
  const freeze=(value:unknown):void=>{if(value!==null&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}};
  freeze(snapshot);return snapshot;
}
