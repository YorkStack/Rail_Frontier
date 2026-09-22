import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {createHash} from 'node:crypto';

const tuple=z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]);
const gltfSchema=z.object({asset:z.object({version:z.literal('2.0')}),nodes:z.array(z.object({name:z.string().optional(),translation:tuple.optional(),rotation:z.array(z.number().finite()).length(4).optional(),scale:tuple.optional(),mesh:z.number().int().optional()})),meshes:z.array(z.object({primitives:z.array(z.object({attributes:z.object({POSITION:z.number().int(),NORMAL:z.number().int(),TEXCOORD_0:z.number().int().optional()}),indices:z.number().int()}))})),accessors:z.array(z.object({count:z.number().int(),min:z.array(z.number().finite()).optional(),max:z.array(z.number().finite()).optional()})),materials:z.array(z.unknown())});
const packSchema=z.object({version:z.literal(1),campaignId:z.string(),generator:z.object({blender:z.string(),script:z.string(),sceneryScript:z.string().optional(),architectureScript:z.string().optional()}).passthrough(),textures:z.array(z.object({id:z.string(),path:z.string(),role:z.enum(['baseColor','normal','roughness']),colorSpace:z.enum(['srgb','linear'])})).optional(),materialBindings:z.array(z.object({materialPrefix:z.string(),map:z.string(),normalMap:z.string(),roughnessMap:z.string(),repeat:z.tuple([z.number().positive(),z.number().positive()])})).optional(),assets:z.array(z.object({id:z.string(),kind:z.enum(['vehicle','station','building','vegetation','rock','infrastructure']),requiredNodes:z.array(z.string()),maxDimensionsM:tuple,lods:z.array(z.object({path:z.string(),maxTriangles:z.number().int().positive(),maxBytes:z.number().int().positive()})).length(2)}))});

interface Inspection {file:string;bytes:number;triangles:number;materials:number;hasUvs:boolean;embeddedTextureBytes:number;embeddedImageHashes:string[];bounds:{min:number[];max:number[]};dimensions:number[];nodes:Map<string,number[]>}
function inspect(file:string):Inspection {
  const bytes=readFileSync(file);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
  const raw=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8')),doc=gltfSchema.parse(raw),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},nodes=new Map<string,number[]>();let triangles=0,hasUvs=true;
  let embeddedTextureBytes=0;const embeddedImageHashes:string[]=[];
  const binaryStart=20+bytes.readUInt32LE(12)+8;
  for(const image of raw.images??[]) {
    assert.equal(image.mimeType,'image/png',`${file}: embedded image must be PNG`);
    const view=raw.bufferViews[image.bufferView];assert.equal(view.buffer,0);
    const png=bytes.subarray(binaryStart+(view.byteOffset??0),binaryStart+(view.byteOffset??0)+view.byteLength);
    assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    embeddedTextureBytes+=Math.ceil(png.readUInt32BE(16)*png.readUInt32BE(20)*4*4/3);
    embeddedImageHashes.push(createHash('sha256').update(png).digest('hex'));
  }
  for(const node of doc.nodes) {
    if(node.name)nodes.set(node.name,[...(node.translation??[0,0,0])]);
    if(node.mesh===undefined)continue;
    assert.ok(node.rotation===undefined||node.rotation.every((value,index)=>Math.abs(value-(index===3?1:0))<1e-5),`${file}: unapplied rotation on ${node.name}`);
    assert.ok(node.scale===undefined||node.scale.every(value=>Math.abs(value-1)<1e-5),`${file}: unapplied scale on ${node.name}`);
    for(const primitive of doc.meshes[node.mesh]!.primitives) {
      const positions=doc.accessors[primitive.attributes.POSITION]!;assert.ok(positions.min&&positions.max);assert.equal(doc.accessors[primitive.attributes.NORMAL]!.count,positions.count);
      triangles+=doc.accessors[primitive.indices]!.count/3;hasUvs&&=primitive.attributes.TEXCOORD_0!==undefined;
      for(let axis=0;axis<3;axis++){bounds.min[axis]=Math.min(bounds.min[axis]!,positions.min[axis]!+(node.translation?.[axis]??0));bounds.max[axis]=Math.max(bounds.max[axis]!,positions.max[axis]!+(node.translation?.[axis]??0));}
    }
  }
  return {file,bytes:bytes.length,triangles,materials:doc.materials.length,hasUvs,embeddedTextureBytes,embeddedImageHashes,bounds,dimensions:bounds.max.map((max,index)=>max-bounds.min[index]!),nodes};
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
assert.equal(pack.campaignId,'norwegian-fjords');
assert.equal(new Set(pack.assets.map(asset=>asset.id)).size,pack.assets.length);assert.equal(pack.assets.length,38);assert.equal(pack.assets.filter(asset=>asset.kind==='vehicle').length,7);assert.equal(pack.assets.filter(asset=>asset.kind==='vegetation').length,7);assert.equal(pack.assets.filter(asset=>asset.kind==='rock').length,5);assert.equal(pack.assets.filter(asset=>asset.kind==='building').length,14);
const textureIds=new Set<string>();let decodedTextureBytes=0;for(const texture of pack.textures??[]){assert.equal(textureIds.has(texture.id),false);textureIds.add(texture.id);assert.equal(texture.role==='baseColor'?texture.colorSpace:'linear',texture.colorSpace);const bytes=readFileSync(`assets/runtime${texture.path}`);assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);decodedTextureBytes+=Math.ceil(bytes.readUInt32BE(16)*bytes.readUInt32BE(20)*4*4/3);}
assert.equal(textureIds.size,12);for(const binding of pack.materialBindings??[])for(const id of [binding.map,binding.normalMap,binding.roughnessMap])assert.ok(textureIds.has(id),`Unknown texture binding ${id}`);
assert.ok(decodedTextureBytes<=128*1024*1024,`Decoded pack textures exceed 128 MiB: ${decodedTextureBytes}`);
for(const asset of pack.assets) {
  const inspected=asset.lods.map(lod=>{
    const file=`assets/runtime${lod.path}`,result=inspect(file);assert.ok(result.bytes<=lod.maxBytes,`${asset.id} exceeds byte budget`);assert.ok(result.triangles<=lod.maxTriangles,`${asset.id} exceeds triangle budget`);assert.ok(result.materials<=8,`${asset.id} exceeds material budget`);
    for(let axis=0;axis<3;axis++)assert.ok(result.dimensions[axis]!<=asset.maxDimensionsM[axis]!+.01,`${asset.id} exceeds dimension ${axis}`);
    for(const name of asset.requiredNodes)assert.ok(result.nodes.has(name),`${asset.id} is missing ${name}`);
    assert.ok(result.bounds.min[1]!>=-.02,`${asset.id} extends below its ground pivot`);if(asset.requiredNodes.includes('footprint_nw'))assert.ok(result.hasUvs,`${asset.id} is missing texture coordinates`);return result;
  });
  assert.ok(inspected[1]!.triangles<inspected[0]!.triangles,`${asset.id} LOD1 must simplify LOD0`);
  for(const name of asset.requiredNodes)assert.deepEqual(inspected[1]!.nodes.get(name),inspected[0]!.nodes.get(name),`${asset.id} attachment ${name} differs across LODs`);
  if(asset.kind==='vehicle') {
    const front=inspected[0]!.nodes.get('coupler_front')!,rear=inspected[0]!.nodes.get('coupler_rear')!,forward=inspected[0]!.nodes.get('forward_probe')!,up=inspected[0]!.nodes.get('up_probe')!;
    assert.ok(front[2]!<0&&rear[2]!>0&&forward[2]!<front[2]!);close(up[1]!,2);assert.ok(inspected.every(item=>item.hasUvs),`${asset.id} is missing vehicle texture coordinates`);
    const detailNodes=asset.id==='nord-2-6-0'?['RF_Loco_MainPipe','RF_Loco_BoilerBand','RF_Loco_CabDoor','RF_Loco_Lamp']:asset.id==='nord-el-1'?['RF_El1_FrontWindow','RF_El1_CabDoor','RF_El1_Louvre','RF_El1_SidePipe','RF_El1_PantographArm','RF_El1_ContactBar','RF_El1_RunningRod']:asset.id==='nord-di-3b'?['RF_Di3_FrontWindow','RF_Di3_CabDoor','RF_Di3_CoolingGrille','RF_Di3_RoofFan','RF_Di3_Handrail']:asset.id==='nord-di-4'?['RF_Di4_AngularCab','RF_Di4_FrontWindow','RF_Di4_CabDoor','RF_Di4_RadiatorGrille','RF_Di4_RoofFan','RF_Di4_Plow']:asset.id==='nord-el-18'?['RF_El18_StreamlinedCab','RF_El18_FrontWindow','RF_El18_CabDoor','RF_El18_Intake','RF_El18_PantographArm','RF_El18_ContactBar']:asset.id==='fjord-passenger-coach'?['RF_Coach_Door','RF_Coach_DoorWindow','RF_Coach_RoofSeam']:['RF_Freight_Stake','RF_Freight_Buffer','RF_Timber_Load'];
    for(const name of detailNodes)assert.ok(inspected[0]!.nodes.has(name),`${asset.id} LOD0 is missing ${name}`);
    if(asset.id==='nord-2-6-0')assert.ok(inspected[0]!.nodes.get('RF_Loco_Smokebox')![2]!<inspected[0]!.nodes.get('RF_Loco_Cab')![2]!,`${asset.id} smokebox must face its forward marker`);
  }
  if(asset.requiredNodes.includes('roof_ridge')) {
    for(const item of inspected) {
      const ridge=item.nodes.get('roof_ridge')!,left=item.nodes.get('roof_eave_left')!,right=item.nodes.get('roof_eave_right')!;
      assert.ok(ridge[1]!>left[1]!+.5&&ridge[1]!>right[1]!+.5,`${asset.id} roof ridge must be above both eaves`);
      assert.ok(left[0]!<ridge[0]!&&ridge[0]!<right[0]!,`${asset.id} roof ridge must lie between the eaves`);
    }
  }
  if(asset.kind==='station'){assert.deepEqual(inspected[0]!.embeddedImageHashes,inspected[1]!.embeddedImageHashes,`${asset.id}: shared LOD textures must match`);decodedTextureBytes+=inspected[0]!.embeddedTextureBytes;}else decodedTextureBytes+=inspected.reduce((sum,lod)=>sum+lod.embeddedTextureBytes,0);
  packResults.push({id:asset.id,kind:asset.kind,lods:inspected.map(({nodes:_,...result})=>result)});
}

const arizonaPack=packSchema.parse(JSON.parse(readFileSync('assets/runtime/packs/arizona.json','utf8'))),arizonaResults=[];
assert.equal(arizonaPack.campaignId,'arizona-terrain-study');assert.equal(arizonaPack.assets.length,13);assert.equal(arizonaPack.assets.filter(asset=>asset.kind==='building').length,10);assert.equal(arizonaPack.assets.filter(asset=>asset.kind==='station').length,3);assert.equal(new Set(arizonaPack.assets.map(asset=>asset.id)).size,13);
const arizonaTextureIds=new Set<string>();let arizonaDecodedTextureBytes=0;
for(const texture of arizonaPack.textures??[]){assert.equal(arizonaTextureIds.has(texture.id),false);arizonaTextureIds.add(texture.id);assert.equal(texture.role==='baseColor'?texture.colorSpace:'linear',texture.colorSpace);const bytes=readFileSync(`assets/runtime${texture.path}`);assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);arizonaDecodedTextureBytes+=Math.ceil(bytes.readUInt32BE(16)*bytes.readUInt32BE(20)*4*4/3);}
assert.equal(arizonaTextureIds.size,9);assert.ok(arizonaDecodedTextureBytes<=32*1024*1024);
for(const binding of arizonaPack.materialBindings??[])for(const id of [binding.map,binding.normalMap,binding.roughnessMap])assert.ok(arizonaTextureIds.has(id),`Unknown Arizona texture binding ${id}`);
const arizonaDetails:Readonly<Record<string,readonly string[]>>={
  'arizona-timber-house-gable':['RF_AZ_Gable_RoofLeft','RF_AZ_Gable_Window','RF_AZ_Gable_Door'],
  'arizona-timber-house-hipped':['RF_AZ_Hip_HippedRoof','RF_AZ_Hip_Window','RF_AZ_Hip_Door'],
  'arizona-adobe-house':['RF_AZ_Adobe_Parapet','RF_AZ_Adobe_Window','RF_AZ_Adobe_Door'],
  'arizona-brick-house':['RF_AZ_Brick_RoofLeft','RF_AZ_Brick_Window','RF_AZ_Brick_Door'],
  'arizona-shop-false-front':['RF_AZ_Shop_FalseFront','RF_AZ_Shop_Window','RF_AZ_Shop_Door'],
  'arizona-shop-awning':['RF_AZ_Awning_Canopy','RF_AZ_Awning_Window','RF_AZ_Awning_Door'],
  'arizona-depot':['RF_AZ_Depot_RoofLeft','RF_AZ_Depot_Window','RF_AZ_Depot_Door'],
  'arizona-water-tower':['RF_AZ_Tower_Leg','RF_AZ_Tower_Tank','RF_AZ_Tower_Roof'],
  'arizona-freight-shed':['RF_AZ_Freight_RoofLeft','RF_AZ_Freight_Door','RF_AZ_Freight_Platform'],
  'arizona-mine-headframe':['RF_AZ_Mine_Leg','RF_AZ_Mine_Sheave','RF_AZ_Mine_Shed']
};
for(const asset of arizonaPack.assets){
  const inspected=asset.lods.map(lod=>{const file=`assets/runtime${lod.path}`,result=inspect(file);assert.ok(result.bytes<=lod.maxBytes,`${asset.id} exceeds byte budget`);assert.ok(result.triangles<=lod.maxTriangles,`${asset.id} exceeds triangle budget`);assert.ok(result.materials<=10,`${asset.id} exceeds material budget`);for(let axis=0;axis<3;axis++)assert.ok(result.dimensions[axis]!<=asset.maxDimensionsM[axis]!+.01,`${asset.id} exceeds dimension ${axis}`);for(const name of asset.requiredNodes)assert.ok(result.nodes.has(name),`${asset.id} is missing ${name}`);assert.ok(result.bounds.min[1]!>=-.02,`${asset.id} extends below its ground pivot`);assert.ok(result.hasUvs,`${asset.id} is missing texture coordinates`);return result;});
  assert.ok(inspected[1]!.triangles<inspected[0]!.triangles,`${asset.id} LOD1 must simplify LOD0`);for(const name of asset.requiredNodes)assert.deepEqual(inspected[1]!.nodes.get(name),inspected[0]!.nodes.get(name),`${asset.id} attachment ${name} differs across LODs`);for(const name of arizonaDetails[asset.id]??[])assert.ok(inspected[0]!.nodes.has(name),`${asset.id} LOD0 is missing ${name}`);
  if(asset.requiredNodes.includes('roof_ridge'))for(const item of inspected){const ridge=item.nodes.get('roof_ridge')!,left=item.nodes.get('roof_eave_left')!,right=item.nodes.get('roof_eave_right')!;assert.ok(ridge[1]!>left[1]!+.5&&ridge[1]!>right[1]!+.5,`${asset.id} roof ridge must be above both eaves`);assert.ok(left[0]!<ridge[0]!&&ridge[0]!<right[0]!,`${asset.id} roof ridge must lie between the eaves`);}
  if(asset.kind==='station'){assert.deepEqual(inspected[0]!.embeddedImageHashes,inspected[1]!.embeddedImageHashes,`${asset.id}: shared LOD textures must match`);arizonaDecodedTextureBytes+=inspected[0]!.embeddedTextureBytes;}else arizonaDecodedTextureBytes+=inspected.reduce((sum,lod)=>sum+lod.embeddedTextureBytes,0);
  arizonaResults.push({id:asset.id,kind:asset.kind,lods:inspected.map(({nodes:_,...result})=>result)});
}
assert.ok(decodedTextureBytes<=128*1024*1024,'Norway external + embedded textures exceed 128 MiB');
assert.ok(arizonaDecodedTextureBytes<=32*1024*1024,'Arizona external + embedded textures exceed 32 MiB');
console.log(JSON.stringify({formatValidated:true,engineImportValidated:false,probe:probeResults,packs:[{campaignId:pack.campaignId,generator:pack.generator,decodedTextureBytes,assets:packResults},{campaignId:arizonaPack.campaignId,generator:arizonaPack.generator,decodedTextureBytes:arizonaDecodedTextureBytes,assets:arizonaResults}]},null,2));
