import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { z } from 'zod';

const tuple=z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]);
const gltfSchema=z.object({asset:z.object({version:z.literal('2.0')}),nodes:z.array(z.object({name:z.string().optional(),translation:tuple.optional(),rotation:z.array(z.number().finite()).length(4).optional(),scale:tuple.optional(),mesh:z.number().int().optional()})),meshes:z.array(z.object({primitives:z.array(z.object({attributes:z.object({POSITION:z.number().int(),NORMAL:z.number().int()}),indices:z.number().int()}))})),accessors:z.array(z.object({count:z.number().int(),min:z.array(z.number().finite()).optional(),max:z.array(z.number().finite()).optional()})),materials:z.array(z.unknown())});
const packSchema=z.object({version:z.literal(1),campaignId:z.literal('norwegian-fjords'),generator:z.object({blender:z.string(),script:z.string(),sceneryScript:z.string().optional()}),assets:z.array(z.object({id:z.string(),kind:z.enum(['vehicle','station','building','vegetation','rock','infrastructure']),requiredNodes:z.array(z.string()),maxDimensionsM:tuple,lods:z.array(z.object({path:z.string(),maxTriangles:z.number().int().positive(),maxBytes:z.number().int().positive()})).length(2)}))});

interface Inspection {file:string;bytes:number;triangles:number;materials:number;bounds:{min:number[];max:number[]};dimensions:number[];nodes:Map<string,number[]>}
function inspect(file:string):Inspection {
  const bytes=readFileSync(file);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
  const doc=gltfSchema.parse(JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'))),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},nodes=new Map<string,number[]>();let triangles=0;
  for(const node of doc.nodes) {
    if(node.name)nodes.set(node.name,[...(node.translation??[0,0,0])]);
    if(node.mesh===undefined)continue;
    assert.ok(node.rotation===undefined||node.rotation.every((value,index)=>Math.abs(value-(index===3?1:0))<1e-5),`${file}: unapplied rotation on ${node.name}`);
    assert.ok(node.scale===undefined||node.scale.every(value=>Math.abs(value-1)<1e-5),`${file}: unapplied scale on ${node.name}`);
    for(const primitive of doc.meshes[node.mesh]!.primitives) {
      const positions=doc.accessors[primitive.attributes.POSITION]!;assert.ok(positions.min&&positions.max);assert.equal(doc.accessors[primitive.attributes.NORMAL]!.count,positions.count);
      triangles+=doc.accessors[primitive.indices]!.count/3;
      for(let axis=0;axis<3;axis++){bounds.min[axis]=Math.min(bounds.min[axis]!,positions.min[axis]!+(node.translation?.[axis]??0));bounds.max[axis]=Math.max(bounds.max[axis]!,positions.max[axis]!+(node.translation?.[axis]??0));}
    }
  }
  return {file,bytes:bytes.length,triangles,materials:doc.materials.length,bounds,dimensions:bounds.max.map((max,index)=>max-bounds.min[index]!),nodes};
}

const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} differs from ${expected}`);
const probeResults:Omit<Inspection,'nodes'>[]=[];
for(const lod of [0,1]) {
  const result=inspect(`assets/runtime/models/core/wagon_probe_lod${lod}.glb`),forward=result.nodes.get('forward_probe'),up=result.nodes.get('up_probe');assert.ok(forward&&up);
  close(forward[0]!,0);close(forward[1]!,0);close(forward[2]!,-6);close(up[1]!,2);close(result.dimensions[0]!,2.8);assert.ok(result.triangles<2000&&result.bytes<100000&&result.materials<=4);
  const {nodes:_,...report}=result;probeResults.push(report);
}
assert.ok(probeResults[1]!.triangles<probeResults[0]!.triangles);

const pack=packSchema.parse(JSON.parse(readFileSync('assets/runtime/packs/norway.json','utf8'))),packResults=[];
assert.equal(new Set(pack.assets.map(asset=>asset.id)).size,pack.assets.length);assert.equal(pack.assets.length,19);assert.equal(pack.assets.filter(asset=>asset.kind==='vegetation').length,7);assert.equal(pack.assets.filter(asset=>asset.kind==='rock').length,5);
for(const asset of pack.assets) {
  const inspected=asset.lods.map(lod=>{
    const file=`assets/runtime${lod.path}`,result=inspect(file);assert.ok(result.bytes<=lod.maxBytes,`${asset.id} exceeds byte budget`);assert.ok(result.triangles<=lod.maxTriangles,`${asset.id} exceeds triangle budget`);assert.ok(result.materials<=8,`${asset.id} exceeds material budget`);
    for(let axis=0;axis<3;axis++)assert.ok(result.dimensions[axis]!<=asset.maxDimensionsM[axis]!+.01,`${asset.id} exceeds dimension ${axis}`);
    for(const name of asset.requiredNodes)assert.ok(result.nodes.has(name),`${asset.id} is missing ${name}`);
    assert.ok(result.bounds.min[1]!>=-.02,`${asset.id} extends below its ground pivot`);return result;
  });
  assert.ok(inspected[1]!.triangles<inspected[0]!.triangles,`${asset.id} LOD1 must simplify LOD0`);
  for(const name of asset.requiredNodes)assert.deepEqual(inspected[1]!.nodes.get(name),inspected[0]!.nodes.get(name),`${asset.id} attachment ${name} differs across LODs`);
  if(asset.kind==='vehicle') {
    const front=inspected[0]!.nodes.get('coupler_front')!,rear=inspected[0]!.nodes.get('coupler_rear')!,forward=inspected[0]!.nodes.get('forward_probe')!,up=inspected[0]!.nodes.get('up_probe')!;
    assert.ok(front[2]!<0&&rear[2]!>0&&forward[2]!<front[2]!);close(up[1]!,2);
  }
  packResults.push({id:asset.id,kind:asset.kind,lods:inspected.map(({nodes:_,...result})=>result)});
}
console.log(JSON.stringify({formatValidated:true,engineImportValidated:false,probe:probeResults,pack:{campaignId:pack.campaignId,generator:pack.generator,assets:packResults}},null,2));
