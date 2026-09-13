import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { z } from 'zod';
const tuple=z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]);
const schema=z.object({asset:z.object({version:z.literal('2.0')}),nodes:z.array(z.object({name:z.string().optional(),translation:tuple.optional(),rotation:z.array(z.number().finite()).length(4).optional(),scale:tuple.optional(),mesh:z.number().int().optional()})),meshes:z.array(z.object({primitives:z.array(z.object({attributes:z.object({POSITION:z.number().int(),NORMAL:z.number().int()}),indices:z.number().int()}))})),accessors:z.array(z.object({count:z.number().int(),min:z.array(z.number().finite()).optional(),max:z.array(z.number().finite()).optional()})),materials:z.array(z.unknown())});
const results=[];
for(const lod of [0,1]) {
  const file=`assets/runtime/models/core/wagon_probe_lod${lod}.glb`,bytes=readFileSync(file);
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
  const doc=schema.parse(JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8')));
  const forward=doc.nodes.find(n=>n.name==='forward_probe'),up=doc.nodes.find(n=>n.name==='up_probe');assert.ok(forward&&up);
  const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} differs from ${expected}`);
  close(forward.translation![0],0);close(forward.translation![1],0);close(forward.translation![2],-6);
  close(up.translation![0],0);close(up.translation![1],2);close(up.translation![2],0);
  for(const name of ['coupler_front','coupler_rear'])assert.ok(doc.nodes.some(n=>n.name===name));
  const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let triangles=0;
  for(const node of doc.nodes) {
    if(node.mesh===undefined)continue;
    assert.ok(node.rotation===undefined||node.rotation.every((v,i)=>Math.abs(v-(i===3?1:0))<1e-5),'Unexpected unapplied rotation');
    assert.ok(node.scale===undefined||node.scale.every(v=>Math.abs(v-1)<1e-5),'Unexpected scale');
    for(const primitive of doc.meshes[node.mesh]!.primitives) {
      const positions=doc.accessors[primitive.attributes.POSITION]!;assert.ok(positions.min&&positions.max);assert.equal(doc.accessors[primitive.attributes.NORMAL]!.count,positions.count);
      triangles+=doc.accessors[primitive.indices]!.count/3;
      for(let axis=0;axis<3;axis++) {bounds.min[axis]=Math.min(bounds.min[axis]!,positions.min[axis]!+(node.translation?.[axis]??0));bounds.max[axis]=Math.max(bounds.max[axis]!,positions.max[axis]!+(node.translation?.[axis]??0));}
    }
  }
  const dimensions=bounds.max.map((max,i)=>max-bounds.min[i]!);
  close(dimensions[0]!,2.8);assert.ok(dimensions[1]!<=3.21&&dimensions[1]!>=2.4);close(dimensions[2]!,10.1);
  assert.ok(triangles<2000&&bytes.length<100000&&doc.materials.length<=4);
  results.push({file,bytes:bytes.length,triangles,materials:doc.materials.length,bounds,dimensions});
}
assert.ok(results[1]!.triangles<results[0]!.triangles);
console.log(JSON.stringify({formatValidated:true,engineImportValidated:false,results},null,2));
