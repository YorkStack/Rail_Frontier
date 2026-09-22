import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Industry} from '../src/domain/model.js';
import {industryStatus} from '../src/ui/industry-status.js';
import {setLanguage} from '../src/i18n/index.js';

test('industry explanation distinguishes missing inputs, full storage and a ready recipe without mutating stock',()=>{
 const mill:Industry={id:'industry:1',definitionId:'sawmill',position:{x:0,y:0,z:0},inventory:{timber:4,lumber:14}};
 setLanguage('en');assert.deepEqual(industryStatus(mill,600),{production:'Waiting for 6 t timber',recipe:'10 t timber → 7 t lumber'});assert.deepEqual(mill.inventory,{timber:4,lumber:14});
 const forest:Industry={...mill,definitionId:'forest',inventory:{timber:490}};assert.equal(industryStatus(forest,1200).production,'Storage full · collect outgoing goods');
 mill.inventory={timber:10,lumber:490};assert.equal(industryStatus(mill,300).production,'Cycle: 50%');
 setLanguage('de');mill.inventory={};assert.equal(industryStatus(mill,600).production,'Wartet auf 10 t Holz');assert.equal(industryStatus(mill,600).recipe,'10 t Holz → 7 t Bretter');setLanguage('en');
});
