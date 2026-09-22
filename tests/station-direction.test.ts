import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stationBearingDegrees} from '../src/ui/station-direction.js';

test('station bearing follows the geometry axes, wraps and rejects a coincident target',()=>{
 const from={x:100,z:100};
 assert.equal(stationBearingDegrees(from,{x:100,z:200}),0);
 assert.equal(stationBearingDegrees(from,{x:200,z:100}),90);
 assert.equal(stationBearingDegrees(from,{x:100,z:0}),180);
 assert.equal(stationBearingDegrees(from,{x:0,z:100}),270);
 assert.equal(stationBearingDegrees(from,{x:200,z:200}),45);
 assert.equal(stationBearingDegrees(from,{x:99,z:200}),0);
 assert.equal(stationBearingDegrees(from,from),null);
});
