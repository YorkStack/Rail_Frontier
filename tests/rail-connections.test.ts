import {test} from 'node:test';
import assert from 'node:assert/strict';
import {railConnectionNodes,visibleConnectionLabels} from '../src/ui/rail-connections.js';
import {createConstructionPractice} from '../src/application/construction-practice.js';

test('construction targets omit alignment subdivision nodes but retain endpoints and junctions',()=>{
 const state=createConstructionPractice('valley'),station=state.stations[0]!;
 if(station.layout.kind!=='single-platform')throw Error('Expected platform');
 const port=station.layout.ports[1].nodeId,template=state.railway.edges[0]!;
 state.railway.nodes.push(...[100,101,102,103].map(id=>({id:`node:${id}` as const,position:{x:id,y:0,z:0}})));
 for(const [i,from,to] of [[100,port,'node:100'],[101,'node:100','node:101'],[102,'node:101','node:102'],[103,'node:101','node:103']] as const)state.railway.edges.push({...template,id:`edge:${i}`,from,to});
 const ids=railConnectionNodes(state).map(n=>n.id);
 assert.ok(!ids.includes(port));assert.ok(!ids.includes(station.layout.stopNodeId));assert.ok(!ids.includes('node:100'));
 assert.ok(ids.includes('node:101'));assert.ok(ids.includes('node:102'));assert.ok(ids.includes('node:103'));assert.ok(ids.includes(station.layout.ports[0].nodeId));
});
test('overlapping names prefer stations and the focused connection without losing separate labels',()=>{
 const boxes=[{x:10,y:10,width:220,height:44,priority:0},{x:20,y:20,width:220,height:44,priority:1},{x:400,y:20,width:220,height:44,priority:0}];
 assert.deepEqual([...visibleConnectionLabels(boxes)].sort(),[1,2]);boxes[0]!.priority=3;assert.deepEqual([...visibleConnectionLabels(boxes)].sort(),[0,2]);
});
