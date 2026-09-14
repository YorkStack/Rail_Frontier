"""Blender 4.0+: generate the original Rail Frontier Norway production asset pack."""
import bpy
import json
import math
import struct
import zlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'assets/runtime/models/norway'
PACKS = ROOT / 'assets/runtime/packs'
TEXTURES = ROOT / 'assets/runtime/textures/norway'
OUTPUT.mkdir(parents=True, exist_ok=True)
PACKS.mkdir(parents=True, exist_ok=True)
TEXTURES.mkdir(parents=True,exist_ok=True)

COLORS = {
    'iron': (.035, .055, .052), 'red': (.38, .055, .035), 'cream': (.72, .62, .42),
    'glass': (.12, .25, .27), 'wood': (.28, .13, .055), 'timber': (.38, .20, .075),
    'green': (.075, .19, .105), 'leaf': (.045, .16, .085), 'stone': (.36, .37, .34),
    'roof': (.09, .12, .12), 'white': (.72, .72, .63), 'gold': (.62, .42, .12),
    'loco_paint':(.055,.075,.068),'loco_metal':(.12,.13,.12),'coach_paint':(.38,.055,.035),'coach_roof':(.07,.08,.075),
    'freight_paint':(.075,.19,.105),'freight_metal':(.08,.09,.085),'freight_wood':(.32,.16,.06)
}

def write_png(path,size,pixel):
    raw=bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):raw.extend(pixel(x,y))
    def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b''))

write_png(TEXTURES/'rolling-metal-base.png',512,lambda x,y:(210+int(12*math.sin(x*.031+y*.017)),208+int(10*math.sin(x*.031+y*.017)),202+int(8*math.sin(x*.031+y*.017)),255))
write_png(TEXTURES/'rolling-metal-normal.png',512,lambda x,y:(128+(18 if x%96<3 else 0),128+(12 if y%128<3 else 0),250,255))
write_png(TEXTURES/'rolling-metal-roughness.png',512,lambda x,y:(185,176+int(26*(.5+.5*math.sin(x*.043+y*.071))),25,255))
write_png(TEXTURES/'rolling-wood-base.png',256,lambda x,y:(205+int(16*math.sin(y*.19)+5*math.sin(x*.04)),203+int(13*math.sin(y*.19)),198+int(10*math.sin(y*.19)),255))
write_png(TEXTURES/'rolling-wood-normal.png',256,lambda x,y:(128,128+int(20*math.sin(y*math.pi/7)),250,255))
write_png(TEXTURES/'rolling-wood-roughness.png',256,lambda x,y:(220,214+int(22*(.5+.5*math.sin(x*.03+y*.09))),0,255))

def reset():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials): bpy.data.materials.remove(material)

def mat(key, metal=0.0):
    name = f'RF_{key.title()}'
    existing = bpy.data.materials.get(name)
    if existing: return existing
    value = bpy.data.materials.new(name); value.diffuse_color = (*COLORS[key], 1); value.use_nodes = True
    shader = value.node_tree.nodes.get('Principled BSDF'); shader.inputs['Base Color'].default_value = (*COLORS[key], 1)
    shader.inputs['Roughness'].default_value = .52 if metal else .78; shader.inputs['Metallic'].default_value = metal
    return value

def finish(obj, name, material):
    obj.name = name; bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); obj.data.materials.append(mat(material, .55 if material in ('iron','gold') else 0)); return obj

def box(name, loc, dims, material, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rotation); obj=bpy.context.object; obj.dimensions=dims; return finish(obj,name,material)

def cylinder(name, loc, radius, depth, material, vertices=12, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation); return finish(bpy.context.object,name,material)

def cone(name, loc, r1, r2, depth, material, vertices=10, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rotation); return finish(bpy.context.object,name,material)

def sphere(name, loc, scale, material, segments=12, rings=6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc); obj=bpy.context.object; obj.scale=scale; return finish(obj,name,material)

def empty(name, loc):
    obj=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(obj); obj.location=loc

def pipe_between(name,a,b,radius,material,vertices=8):
    direction=Vector(b)-Vector(a);mid=(Vector(a)+Vector(b))*.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=direction.length,location=mid);obj=bpy.context.object;obj.rotation_mode='QUATERNION';obj.rotation_quaternion=Vector((0,0,1)).rotation_difference(direction.normalized());return finish(obj,name,material)

def wheel_set(ys, lod, radius=.72):
    if lod: return
    for y in ys:
        for x in (-1.18,1.18): cylinder('RF_Wheel',(x,y,radius),radius,.28,'iron',12,(0,math.pi/2,0))

def vehicle_markers(front, rear, up=2):
    empty('coupler_front',(0,front,.72));empty('coupler_rear',(0,rear,.72));empty('forward_probe',(0,front+1,0));empty('up_probe',(0,0,up))

def locomotive(lod):
    box('RF_Loco_Chassis',(0,0,.92),(2.75,13.8,.55),'loco_metal');box('RF_Loco_Cab',(0,-4.1,3.05),(2.75,4.0,4.2),'loco_paint')
    cylinder('RF_Loco_Boiler',(0,1.4,2.82),1.18,7.7,'loco_paint',12 if lod else 20,(math.pi/2,0,0));cone('RF_Loco_Smokebox',(0,5.2,2.82),1.18,.82,1.15,'loco_metal',12,(math.pi/2,0,0))
    cone('RF_Loco_Stack',(0,3.8,4.45),.5,.3,2.2,'loco_metal',10 if lod else 16);box('RF_Loco_Roof',(0,-4.1,5.28),(3.15,4.5,.3),'coach_roof')
    cylinder('RF_Loco_Dome',(0,.2,4.08),.42,.75,'gold',10);wheel_set((-4.2,-1.6,1.0,4.0),lod,.78)
    for side in (-1,1):
        pipe_between('RF_Loco_MainPipe',(side*1.23,4.35,3.22),(side*1.23,-2.4,3.22),.075,'gold',8 if not lod else 6)
        if not lod:pipe_between('RF_Loco_DropPipe',(side*1.23,-2.4,3.22),(side*1.23,-2.4,1.35),.09,'gold',8);pipe_between('RF_Loco_Handrail',(side*1.25,4.5,4.05),(side*1.25,-2.25,4.05),.045,'white',6)
    if not lod:
        box('RF_Loco_Window_L',(-1.39,-3.65,3.7),(.08,1.25,1.05),'glass');box('RF_Loco_Window_R',(1.39,-3.65,3.7),(.08,1.25,1.05),'glass')
        for x in (-1.43,1.43): box('RF_Loco_Rod',(x,.9,.8),(.12,8.4,.16),'gold')
        for y in (3.9,2.1,.3,-1.5):cylinder('RF_Loco_BoilerBand',(0,y,2.82),1.23,.09,'gold',20,(math.pi/2,0,0))
        for side in (-1,1):box('RF_Loco_CabDoor',(side*1.4,-4.6,2.7),(.08,1.5,2.6),'loco_metal');box('RF_Loco_Step',(side*1.65,-5.15,1.15),(.65,1.1,.16),'gold')
        cylinder('RF_Loco_Lamp',(0,6.0,3.7),.28,.35,'gold',10,(math.pi/2,0,0));box('RF_Loco_Buffer', (0,6.4,1.0),(3.0,.22,.32),'coach_paint')
    vehicle_markers(7.6,-7.6)

def passenger(lod):
    box('RF_Coach_Chassis',(0,0,.82),(2.7,17.5,.42),'freight_metal');box('RF_Coach_Body',(0,0,2.55),(2.72,16.5,3.25),'coach_paint');box('RF_Coach_Roof',(0,0,4.32),(2.95,16.8,.38),'coach_roof')
    wheel_set((-5.9,5.9),lod,.64)
    if not lod:
        for side in (-1,1):
            x=side*1.38
            for y in (-6.3,-4.2,-2.1,0,2.1,4.2,6.3): box('RF_Coach_Window',(x,y,3.05),(.06,1.25,.85),'glass')
            for y in (-7.35,7.35):box('RF_Coach_Door',(x,y,2.45),(.07,1.25,2.65),'coach_roof');box('RF_Coach_DoorWindow',(x*1.01,y,3.0),(.08,.66,.75),'glass')
        for y in (-8.0,8.0): box('RF_Coach_Platform',(0,y,1.15),(2.85,.55,.18),'gold')
        for y in (-5.5,0,5.5):box('RF_Coach_RoofSeam',(0,y,4.53),(3.0,.08,.08),'gold')
    vehicle_markers(9.2,-9.2)

def freight(lod):
    box('RF_Freight_Chassis',(0,0,.78),(2.75,11.9,.42),'freight_metal');box('RF_Freight_Floor',(0,0,1.12),(2.62,11.3,.32),'freight_wood')
    for x in (-1.3,1.3): box('RF_Freight_Side',(x,0,2.1),(.22,11.3,2.15),'freight_paint')
    for y in (-5.55,5.55): box('RF_Freight_End',(0,y,2.1),(2.62,.22,2.15),'freight_paint')
    wheel_set((-3.8,3.8),lod,.62)
    if not lod:
        for x in (-.82,0,.82): cylinder('RF_Timber_Load',(x,0,2.12),.3,10.5,'freight_wood',8,(math.pi/2,0,0))
        for x in (-1.43,1.43):
            for y in (-4.8,-1.6,1.6,4.8):box('RF_Freight_Stake',(x,y,2.3),(.12,.18,2.7),'gold')
        for y in (-6.05,6.05):box('RF_Freight_Buffer',(0,y,.95),(2.9,.18,.28),'freight_metal')
    vehicle_markers(6.3,-6.3)

def station(lod):
    box('RF_Station_Platform',(0,0,.28),(7.5,28,.55),'stone');box('RF_Station_Body',(4.9,1.5,3.4),(8.5,15,6.8),'cream');box('RF_Station_Roof',(4.9,1.5,7.05),(9.5,16,.5),'roof',(0,0,math.radians(5)))
    box('RF_Station_Canopy',(0,-1,4.0),(7.8,15,.28),'green')
    for y in (-6,-2,2,6): cylinder('RF_Station_Post',(0,y,2.15),.13,4.3,'iron',8)
    if not lod:
        for y in (-4.8,-1.6,1.6,4.8): box('RF_Station_Window',(0.62,y,4.0),(.08,1.35,1.35),'glass')
        box('RF_Station_Sign',(0,-7.2,5.0),(.18,3.6,1.0),'red')
    empty('platform_origin',(0,0,0));empty('track_side',(-4.2,0,0))

def house(lod):
    box('RF_House_Body',(0,0,3.0),(8,10,6),'red');box('RF_House_Roof_A',(-2.2,0,7.0),(5.4,11,.45),'roof',(0,math.radians(45),0));box('RF_House_Roof_B',(2.2,0,7.0),(5.4,11,.45),'roof',(0,math.radians(-45),0))
    if not lod:
        box('RF_House_Door',(0,-5.05,2.0),(1.5,.12,3.6),'green')
        for x in (-2.5,2.5): box('RF_House_Window',(x,-5.08,3.4),(1.25,.1,1.35),'cream')
        cylinder('RF_House_Chimney',(2.4,1.8,8.0),.32,2.4,'stone',8)
    empty('ground_origin',(0,0,0))

def spruce(lod):
    cylinder('RF_Tree_Trunk',(0,0,4.2),.38,8.4,'wood',6 if lod else 8)
    cone('RF_Tree_Crown_Low',(0,0,7.2),3.4,.25,7.8,'leaf',7 if lod else 10)
    if not lod:
        cone('RF_Tree_Crown_High',(0,0,11.0),2.6,.08,7.5,'green',10)
    empty('ground_origin',(0,0,0))

def bridge(lod):
    box('RF_Bridge_Deck',(0,0,.45),(7.2,24,.9),'iron')
    for x in (-3.35,3.35):
        box('RF_Bridge_Top',(x,0,6.0),(.38,24,.38),'iron')
        for y in (-12,-6,0,6,12): box('RF_Bridge_Post',(x,y,3.2),(.38,.38,5.6),'iron')
        if not lod:
            for y in (-12,-6,0,6):
                length=math.hypot(6,5.4);angle=math.atan2(5.4,6)
                box('RF_Bridge_Diagonal',(x,y+3,3.3),(.3,length,.3),'iron',(angle,0,0))
    empty('span_start',(0,-12,0));empty('span_end',(0,12,0))

def portal(lod):
    box('RF_Portal_Left',(-3.5,0,3.5),(2.2,2.5,7),'stone');box('RF_Portal_Right',(3.5,0,3.5),(2.2,2.5,7),'stone');box('RF_Portal_Top',(0,0,7.0),(9.2,2.5,2.0),'stone')
    if not lod:
        for x in (-4.7,-2.3,2.3,4.7): box('RF_Portal_Block',(x,-1.3,7.8),(1.9,.35,.8),'cream')
    empty('track_center',(0,0,0))

BUILDERS={'nord-2-6-0':locomotive,'fjord-passenger-coach':passenger,'fjord-freight-wagon':freight,'norway-station':station,'norway-house':house,'norway-spruce':spruce,'norway-bridge-span':bridge,'norway-tunnel-portal':portal}
KINDS={'nord-2-6-0':'vehicle','fjord-passenger-coach':'vehicle','fjord-freight-wagon':'vehicle','norway-station':'station','norway-house':'building','norway-spruce':'vegetation','norway-bridge-span':'infrastructure','norway-tunnel-portal':'infrastructure'}
NODES={'nord-2-6-0':['coupler_front','coupler_rear','forward_probe','up_probe'],'fjord-passenger-coach':['coupler_front','coupler_rear','forward_probe','up_probe'],'fjord-freight-wagon':['coupler_front','coupler_rear','forward_probe','up_probe'],'norway-station':['platform_origin','track_side'],'norway-house':['ground_origin'],'norway-spruce':['ground_origin'],'norway-bridge-span':['span_start','span_end'],'norway-tunnel-portal':['track_center']}
MAX_DIMS={'nord-2-6-0':[4,7,17],'fjord-passenger-coach':[4,6,20],'fjord-freight-wagon':[4,5,14],'norway-station':[16,10,31],'norway-house':[12,11,13],'norway-spruce':[9,16,9],'norway-bridge-span':[9,8,26],'norway-tunnel-portal':[12,10,4]}

assets=[]
for asset_id,builder in BUILDERS.items():
    lods=[]
    for lod in (0,1):
        reset();bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1;builder(lod)
        filename=f'{asset_id}_lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(OUTPUT/filename),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
        lods.append({'path':f'/models/norway/{filename}','maxTriangles':12000 if lod==0 else 3000,'maxBytes':350000 if lod==0 else 140000})
    assets.append({'id':asset_id,'kind':KINDS[asset_id],'requiredNodes':NODES[asset_id],'maxDimensionsM':MAX_DIMS[asset_id],'lods':lods})

manifest=json.loads((PACKS/'norway.json').read_text()) if (PACKS/'norway.json').exists() else {'version':1,'campaignId':'norwegian-fjords','generator':{},'assets':[]}
core_ids=set(BUILDERS);manifest['assets']=[asset for asset in manifest.get('assets',[]) if asset['id'] not in core_ids]+assets;manifest['generator']['blender']=bpy.app.version_string;manifest['generator']['script']='tools/blender/generate_norway_pack.py';manifest['generator']['rollingStockDetail']='GFX-006B'
rolling_textures=[{'id':'rolling-metal-base','path':'/textures/norway/rolling-metal-base.png','role':'baseColor','colorSpace':'srgb'},{'id':'rolling-metal-normal','path':'/textures/norway/rolling-metal-normal.png','role':'normal','colorSpace':'linear'},{'id':'rolling-metal-roughness','path':'/textures/norway/rolling-metal-roughness.png','role':'roughness','colorSpace':'linear'},{'id':'rolling-wood-base','path':'/textures/norway/rolling-wood-base.png','role':'baseColor','colorSpace':'srgb'},{'id':'rolling-wood-normal','path':'/textures/norway/rolling-wood-normal.png','role':'normal','colorSpace':'linear'},{'id':'rolling-wood-roughness','path':'/textures/norway/rolling-wood-roughness.png','role':'roughness','colorSpace':'linear'}]
texture_ids={texture['id'] for texture in rolling_textures};manifest['textures']=[texture for texture in manifest.get('textures',[]) if texture['id'] not in texture_ids]+rolling_textures
rolling_bindings=[{'materialPrefix':prefix,'map':'rolling-metal-base','normalMap':'rolling-metal-normal','roughnessMap':'rolling-metal-roughness','repeat':[2,4]} for prefix in ('RF_Loco_','RF_Coach_','RF_Freight_Paint','RF_Freight_Metal')]+[{'materialPrefix':'RF_Freight_Wood','map':'rolling-wood-base','normalMap':'rolling-wood-normal','roughnessMap':'rolling-wood-roughness','repeat':[2,4]}]
prefixes={binding['materialPrefix'] for binding in rolling_bindings};manifest['materialBindings']=[binding for binding in manifest.get('materialBindings',[]) if binding['materialPrefix'] not in prefixes]+rolling_bindings
(PACKS/'norway.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('RF_NORWAY_PACK_EXPORT',json.dumps({'blender':bpy.app.version_string,'assets':len(assets),'output':str(OUTPUT)}))
