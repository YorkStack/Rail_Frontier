/** Run with npx tsx tools/benchmark-route-planning.ts.
 * Three full-terrain candidate-generation + live-quote runs per practice/width.
 * World creation, drawing, worker transfer and rendering are excluded. This is
 * a repeatable solver smoke measurement, not browser latency acceptance.
 */
import {createConstructionPractice} from '../src/application/construction-practice.js';
import {RailFrontierGame} from '../src/application/game.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {trackClasses} from '../src/content/track-classes.js';
import {searchOrderedCorridor} from '../src/rail/ordered-corridor.js';
console.log(JSON.stringify({measurement:'route-planning',runtime:process.version,platform:process.platform,arch:process.arch,runs:3}));
for(const id of ['valley','inlet','ridge','highland'] as const){
 const state=createConstructionPractice(id),base=campaignContentRegistry.resolve(state).worldGenerator.generate(state.world),game=new RailFrontierGame(state,base);
 const ports=state.stations.map((s,i)=>{if(s.layout.kind!=='single-platform')throw Error('No platform');const port=s.layout.ports[i===0?1:0]!;return {point:state.railway.nodes.find(n=>n.id===port.nodeId)!.position,outward:port.outward};});
 for(const width of [60,300]){
 const request={anchors:ports.map(p=>p.point),terrain:game.terrain,trackClass:trackClasses.local,maxOffsetM:width,tangents:{start:ports[0]!.outward,end:{x:-ports[1]!.outward.x,z:-ports[1]!.outward.z}}};
 const times=[],counts=[];
 for(let i=0;i<3;i++){const t=performance.now(),choices=evaluateCorridorAlternatives(generateWishCandidates(request),game.terrain,trackClasses.local,true);times.push(Math.round(performance.now()-t));counts.push(choices.length);}
 const search=searchOrderedCorridor(request);console.log(JSON.stringify({id,width,ms:times,choices:counts,expansions:search.expansions,exhausted:search.exhausted}));
 }
}
