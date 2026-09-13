import { performance } from 'node:perf_hooks';
import { compileCurve } from '../src/rail/geometry.js';
import { SimulationClock } from '../src/simulation/clock.js';
import { Heightfield } from '../src/world/terrain.js';
import { createInitialState } from '../src/content/norway.js';
import { serialize, deserialize } from '../src/persistence/save.js';

const start=performance.now();let samples=0;
for(let i=0;i<1000;i++) samples+=compileCurve({p0:{x:0,y:5,z:0},p1:{x:350,y:10,z:0},p2:{x:650,y:15,z:400},p3:{x:1000,y:20,z:500}}).samples.length;
const curveMs=performance.now()-start;
const heights=new Float64Array(641*641);for(let i=0;i<heights.length;i++)heights[i]=Math.sin(i*.01)*100;
const terrain=new Heightfield(641,641,25,heights);let sum=0;const queryStart=performance.now();
for(let i=0;i<100000;i++)sum+=terrain.sample(i%16000,(i*17)%16000).elevationM;
const terrainMs=performance.now()-queryStart;
let ticks=0;const clock=new SimulationClock(()=>ticks++);for(let i=0;i<600;i++)clock.advance(1/60,8);
const json=serialize(createInitialState());deserialize(json);
console.log(JSON.stringify({runtime:process.version,platform:process.platform,arch:process.arch,curves:1000,curveSamples:samples,curveMs,terrainQueries:100000,terrainMs,terrainChecksum:sum,ticksAt8xOver10Seconds:ticks,initialSaveBytes:Buffer.byteLength(json),renderingValidated:false},null,2));
