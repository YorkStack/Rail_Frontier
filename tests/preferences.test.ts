import test from 'node:test';
import assert from 'node:assert/strict';
import {readPresentationPreferences,writePresentationPreferences} from '../src/ui/preferences.js';

test('presentation preferences default to browser language and validate stored scale',()=>{
  assert.deepEqual(readPresentationPreferences(null,'de-NO'),{uiScale:1,language:'de'});
  const storage={getItem:()=>JSON.stringify({uiScale:1.25,language:'en'}),setItem:()=>{}};
  assert.deepEqual(readPresentationPreferences(storage,'de'),{uiScale:1.25,language:'en'});
  storage.getItem=()=>JSON.stringify({uiScale:9,language:'fr'});assert.deepEqual(readPresentationPreferences(storage,'en-GB'),{uiScale:1,language:'en'});
});

test('presentation preferences survive unavailable browser storage',()=>{
  const unavailable={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('quota');}};
  assert.deepEqual(readPresentationPreferences(unavailable,'en'),{uiScale:1,language:'en'});assert.equal(writePresentationPreferences(unavailable,{uiScale:1.5,language:'de'}),false);
});
