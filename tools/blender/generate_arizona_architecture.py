"""Blender 4.0+: generate original circa-1900 Arizona study architecture."""
import bpy
import json
import math
import struct
import zlib
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUTPUT=ROOT/'assets/runtime/models/arizona';TEXTURES=ROOT/'assets/runtime/textures/arizona';MANIFEST=ROOT/'assets/runtime/packs/arizona.json';CONTACT=ROOT/'artifacts/evidence/gfx-r07/arizona-architecture.png'
OUTPUT.mkdir(parents=True,exist_ok=True);TEXTURES.mkdir(parents=True,exist_ok=True);MANIFEST.parent.mkdir(parents=True,exist_ok=True);CONTACT.parent.mkdir(parents=True,exist_ok=True)

COLORS={
    'cream':(.66,.48,.30),'sage':(.24,.31,.24),'red':(.43,.15,.09),'ochre':(.55,.31,.10),'white':(.76,.67,.52),
    'adobe':(.57,.32,.17),'brick':(.36,.10,.055),'stone':(.30,.25,.20),'dark':(.075,.055,.045),'glass':(.045,.10,.12),
    'roof':(.22,.13,.09),'metal':(.25,.29,.28),'wood':(.31,.17,.075),'water':(.16,.22,.21)
}

def png(path,size,pixel):
    raw=bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):raw.extend(pixel(x,y))
    def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b''))

SIZE=512
png(TEXTURES/'painted-wood-base.png',SIZE,lambda x,y:(max(0,min(255,226+int(8*math.sin(y*.17)+5*math.sin(x*.031+y*.043)))),)*3+(255,))
png(TEXTURES/'painted-wood-normal.png',SIZE,lambda x,y:(128,max(0,min(255,128+int(20*math.sin(y*math.pi/12)))),250,255))
png(TEXTURES/'painted-wood-roughness.png',SIZE,lambda x,y:(224,205+int(30*(.5+.5*math.sin(x*.037+y*.089))),0,255))
png(TEXTURES/'masonry-base.png',SIZE,lambda x,y:(218+int(10*math.sin(x*.021)*math.sin(y*.029)),213+int(8*math.sin(x*.021)*math.sin(y*.029)),202+int(7*math.sin(x*.021)*math.sin(y*.029)),255))
png(TEXTURES/'masonry-normal.png',SIZE,lambda x,y:(128+(10 if x%72<2 else 0),128+(10 if y%34<2 else 0),250,255))
png(TEXTURES/'masonry-roughness.png',SIZE,lambda x,y:(236,220+int(20*(.5+.5*math.sin(x*.063+y*.041))),0,255))
png(TEXTURES/'weathered-roof-base.png',SIZE,lambda x,y:(180+((x//38+y//21)%4)*8,178+((x//38+y//21)%4)*7,170+((x//38+y//21)%4)*6,255))
png(TEXTURES/'weathered-roof-normal.png',SIZE,lambda x,y:(128,140 if y%21<2 else 128,250,255))
png(TEXTURES/'weathered-roof-roughness.png',SIZE,lambda x,y:(232,210+((x//38+y//21)%3)*11,0,255))

def reset():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):bpy.data.materials.remove(material)

def mat(key,name=None,metallic=0):
    value=bpy.data.materials.get(name or 'RF_AZ_'+key.title())
    if value:return value
    value=bpy.data.materials.new(name or 'RF_AZ_'+key.title());value.diffuse_color=(*COLORS[key],1);value.use_nodes=True
    shader=value.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*COLORS[key],1);shader.inputs['Roughness'].default_value=.58 if metallic else .84;shader.inputs['Metallic'].default_value=metallic
    return value

def finish(obj,name,key,material_name=None,metallic=0):
    obj.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);obj.data.materials.append(mat(key,material_name,metallic));return obj

def box(name,loc,dims,key,rotation=(0,0,0),material_name=None):
    if isinstance(rotation,str):material_name=rotation;rotation=(0,0,0)
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rotation);obj=bpy.context.object;obj.dimensions=dims;return finish(obj,name,key,material_name)

def cylinder(name,loc,radius,depth,key,vertices=10,rotation=(0,0,0),material_name=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=rotation);return finish(bpy.context.object,name,key,material_name)

def cone(name,loc,r1,r2,depth,key,vertices=10,rotation=(0,0,0),material_name=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc,rotation=rotation);return finish(bpy.context.object,name,key,material_name)

def beam_between(name,a,b,width,key,material_name=None):
    direction=Vector(b)-Vector(a);mid=(Vector(a)+Vector(b))*.5
    bpy.ops.mesh.primitive_cube_add(size=1,location=mid);obj=bpy.context.object;obj.dimensions=(width,width,direction.length);obj.rotation_mode='QUATERNION';obj.rotation_quaternion=Vector((0,0,1)).rotation_difference(direction.normalized());return finish(obj,name,key,material_name)

def mesh_object(name,vertices,faces,key,material_name=None):
    mesh=bpy.data.meshes.new(name+'Mesh');mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT');obj.select_set(False);obj.data.materials.append(mat(key,material_name));return obj

def empty(name,loc=(0,0,0)):
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj);obj.location=loc

def anchors(width,depth):
    empty('ground_origin');empty('footprint_nw',(-width/2,-depth/2,0));empty('footprint_se',(width/2,depth/2,0))

def sloped_panel(name,start,end,depth,key='roof'):
    x0,z0=start;x1,z1=end;length=math.hypot(x1-x0,z1-z0);angle=math.atan2(-(z1-z0),x1-x0)
    return box(name,((x0+x1)/2,0,(z0+z1)/2),(length,depth,.3),key,(0,angle,0),'RF_AZ_Roof_Weathered')

def gable_roof(prefix,width,depth,eave,rise):
    left=(-width/2-.55,eave);ridge=(0,eave+rise);right=(width/2+.55,eave)
    sloped_panel(prefix+'_RoofLeft',left,ridge,depth+1.1);sloped_panel(prefix+'_RoofRight',ridge,right,depth+1.1)
    for y in (-depth/2,depth/2):mesh_object(prefix+'_Gable',[(left[0]+.55,y,eave),(right[0]-.55,y,eave),(0,y,eave+rise-.12)],[(0,1,2)],'cream','RF_AZ_Wood_Gable')
    box(prefix+'_Ridge',(0,0,eave+rise+.08),(.24,depth+1.25,.22),'roof',material_name='RF_AZ_Roof_Weathered')
    empty('roof_ridge',(0,0,eave+rise));empty('roof_eave_left',(left[0],0,eave));empty('roof_eave_right',(right[0],0,eave))

def hipped_roof(prefix,width,depth,eave,rise):
    w=width/2+.55;d=depth/2+.55;r=.22*depth
    vertices=[(-w,-d,eave),(w,-d,eave),(w,d,eave),(-w,d,eave),(0,-r,eave+rise),(0,r,eave+rise)]
    mesh_object(prefix+'_HippedRoof',vertices,[(0,1,4),(1,2,5),(1,5,4),(2,3,5),(3,0,4),(3,4,5)],'roof','RF_AZ_Roof_Weathered')

def facade(prefix,width,depth,base,height,lod,wall_key='cream',wall_material='RF_AZ_Wood_Painted',doors=1,windows=2):
    front=-depth/2-.07;door_w=1.25
    for index in range(windows):
        x=(index-(windows-1)/2)*2.5+(doors*.8);box(prefix+'_Window',(x,front,base+height*.62),(1.3,.14,1.55),'glass')
        if not lod:
            for dx in (-.74,.74):box(prefix+'_WindowTrim',(x+dx,front-.06,base+height*.62),(.15,.1,1.86),'white')
            for dz in (-.91,.91):box(prefix+'_WindowTrim',(x,front-.07,base+height*.62+dz),(1.55,.1,.15),'white')
    for index in range(doors):
        x=-width*.23+index*2.2;box(prefix+'_Door',(x,front,base+1.65),(door_w,.16,3.3),'dark')
        if not lod:box(prefix+'_DoorGlass',(x,front-.09,base+2.15),(.72,.07,.82),'glass')

def porch(prefix,width,depth,lod):
    box(prefix+'_PorchDeck',(0,-depth/2-1.45,.45),(width+1.2,2.7,.35),'wood','RF_AZ_Wood_Weathered')
    box(prefix+'_PorchRoof',(0,-depth/2-1.45,3.65),(width+1.4,3.0,.25),'roof',(math.radians(5),0,0),'RF_AZ_Roof_Weathered')
    if not lod:
        for x in (-width/2,width/2):box(prefix+'_Post',(x,-depth/2-2.4,2.0),(.22,.22,3.2),'wood','RF_AZ_Wood_Weathered')

def timber_house_gable(lod):
    w,d,h=8.4,11.0,5.7;box('RF_AZ_Gable_Foundation',(0,0,.35),(w+.5,d+.5,.7),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Gable_Walls',(0,0,.7+h/2),(w,d,h),'ochre','RF_AZ_Wood_Ochre');gable_roof('RF_AZ_Gable',w,d,.7+h,3.1);facade('RF_AZ_Gable',w,d,.7,h,lod,windows=2);porch('RF_AZ_Gable',w,d,lod);anchors(w+1.4,d+3)

def timber_house_hipped(lod):
    w,d,h=10.0,9.0,5.4;box('RF_AZ_Hip_Foundation',(0,0,.35),(w+.5,d+.5,.7),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Hip_Walls',(0,0,.7+h/2),(w,d,h),'sage','RF_AZ_Wood_Sage');hipped_roof('RF_AZ_Hip',w,d,.7+h,2.6);facade('RF_AZ_Hip',w,d,.7,h,lod,windows=3)
    if not lod:cylinder('RF_AZ_Hip_Chimney',(w*.28,d*.12,h+2.6),.33,3.2,'brick',8,material_name='RF_AZ_Masonry_Brick')
    anchors(w+1.4,d+1.4)

def adobe_house(lod):
    w,d,h=10.5,9.2,4.5;box('RF_AZ_Adobe_Foundation',(0,0,.3),(w+.7,d+.7,.6),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Adobe_Walls',(0,0,.6+h/2),(w,d,h),'adobe','RF_AZ_Masonry_Adobe');box('RF_AZ_Adobe_Roof',(0,0,.6+h+.18),(w+.5,d+.5,.36),'roof',material_name='RF_AZ_Roof_Weathered')
    for x,y,dx,dy in [(-w/2-.18,0,.35,d+.8),(w/2+.18,0,.35,d+.8),(0,-d/2-.18,w+.8,.35),(0,d/2+.18,w+.8,.35)]:box('RF_AZ_Adobe_Parapet',(x,y,.6+h+.65),(dx,dy,.95),'adobe','RF_AZ_Masonry_Adobe')
    facade('RF_AZ_Adobe',w,d,.6,h,lod,windows=2);anchors(w+1.2,d+1.2)

def brick_house(lod):
    w,d,h=9.5,11.5,8.2;box('RF_AZ_Brick_Foundation',(0,0,.4),(w+.5,d+.5,.8),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Brick_Walls',(0,0,.8+h/2),(w,d,h),'brick','RF_AZ_Masonry_Brick');gable_roof('RF_AZ_Brick',w,d,.8+h,2.7);facade('RF_AZ_Brick',w,d,.8,h,lod,windows=3)
    if not lod:
        for z in (3.1,6.25):box('RF_AZ_Brick_Belt',(0,-d/2-.12,z),(w+.25,.16,.22),'white','RF_AZ_Masonry_Stone')
    anchors(w+1.2,d+1.2)

def false_front_shop(lod):
    w,d,h=10.5,14.0,5.7;box('RF_AZ_Shop_Foundation',(0,0,.3),(w+.5,d+.5,.6),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Shop_Walls',(0,0,.6+h/2),(w,d,h),'red','RF_AZ_Wood_Red');gable_roof('RF_AZ_Shop',w,d,.6+h,2.0);box('RF_AZ_Shop_FalseFront',(0,-d/2-.18,4.6),(w+.7,.42,7.8),'red','RF_AZ_Wood_Red');box('RF_AZ_Shop_Cornice',(0,-d/2-.45,8.45),(w+1.3,.45,.48),'white','RF_AZ_Wood_Trim');facade('RF_AZ_Shop',w,d,.6,6.3,lod,doors=1,windows=2);porch('RF_AZ_Shop',w,d,lod);anchors(w+1.5,d+3)

def awning_shop(lod):
    w,d,h=12.0,12.5,6.2;box('RF_AZ_Awning_Foundation',(0,0,.35),(w+.5,d+.5,.7),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Awning_Walls',(0,0,.7+h/2),(w,d,h),'cream','RF_AZ_Masonry_Plaster');box('RF_AZ_Awning_Parapet',(0,-d/2-.18,6.7),(w+.6,.38,2.0),'cream','RF_AZ_Masonry_Plaster');box('RF_AZ_Awning_Roof',(0,0,.7+h+.2),(w+.45,d+.45,.4),'roof',material_name='RF_AZ_Roof_Weathered');facade('RF_AZ_Awning',w,d,.7,h,lod,doors=2,windows=3);box('RF_AZ_Awning_Canopy',(0,-d/2-1.1,4.5),(w+1.1,2.2,.24),'roof',(math.radians(8),0,0),'RF_AZ_Roof_Weathered');anchors(w+1.4,d+2.4)

def depot(lod):
    w,d,h=11.0,24.0,6.0;box('RF_AZ_Depot_Foundation',(0,0,.45),(w+.7,d+.7,.9),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Depot_Walls',(0,0,.9+h/2),(w,d,h),'ochre','RF_AZ_Wood_Ochre');gable_roof('RF_AZ_Depot',w,d,.9+h,3.4);facade('RF_AZ_Depot',w,d,.9,h,lod,doors=1,windows=3);porch('RF_AZ_Depot',w,d,lod)
    if not lod:
        box('RF_AZ_Depot_Sign',(0,-d/2-.42,7.45),(5.2,.18,.8),'dark')
    anchors(w+1.6,d+3)

def water_tower(lod):
    for x in (-2.4,2.4):
        for y in (-2.4,2.4):beam_between('RF_AZ_Tower_Leg',(x,y,.3),(x*.66,y*.66,10.2),.35,'wood','RF_AZ_Wood_Weathered')
    cylinder('RF_AZ_Tower_Tank',(0,0,12.0),3.7,4.2,'water',12 if lod else 20,material_name='RF_AZ_Metal_Tank');cone('RF_AZ_Tower_Roof',(0,0,15.0),4.1,.15,2.0,'roof',12 if lod else 20,material_name='RF_AZ_Roof_Weathered')
    if not lod:
        for z in (3,6,9):box('RF_AZ_Tower_Brace',(0,-2.45,z),(5.2,.18,.18),'wood',(0,math.radians(34 if z%2 else -34),0),'RF_AZ_Wood_Weathered')
        for z in range(2,11):box('RF_AZ_Tower_Ladder',(3.0,0,z),(.18,1.2,.12),'metal')
    anchors(9,9)

def freight_shed(lod):
    w,d,h=13.0,20.0,5.8;box('RF_AZ_Freight_Foundation',(0,0,.65),(w+2,d+2,1.3),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Freight_Walls',(0,0,1.3+h/2),(w,d,h),'sage','RF_AZ_Wood_Sage');gable_roof('RF_AZ_Freight',w,d,1.3+h,3.2);box('RF_AZ_Freight_Door',(0,-d/2-.1,3.8),(4.8,.2,5.0),'dark');box('RF_AZ_Freight_Platform',(0,-d/2-2.0,1.2),(w+4,4,.5),'wood','RF_AZ_Wood_Weathered')
    if not lod:
        for x in (-5,5):box('RF_AZ_Freight_Crate',(x,-d/2-2.0,2.0),(1.8,1.8,1.7),'wood','RF_AZ_Wood_Weathered')
    anchors(w+4,d+4)

def mine_headframe(lod):
    box('RF_AZ_Mine_Base',(0,0,.4),(16,18,.8),'stone','RF_AZ_Masonry_Stone');box('RF_AZ_Mine_Shed',(4,1,3.6),(8,15,6.4),'wood','RF_AZ_Wood_Weathered');gable_roof('RF_AZ_MineShed',8,15,6.8,2.4)
    for x in (-4,4):
        beam_between('RF_AZ_Mine_Leg',(x,-3,.45),(x*.45,-1.0,14),.55,'wood','RF_AZ_Wood_Weathered');beam_between('RF_AZ_Mine_Leg',(x,3,.45),(x*.45,1.0,14),.55,'wood','RF_AZ_Wood_Weathered')
    box('RF_AZ_Mine_Top',(0,0,14),(5,3,.55),'wood','RF_AZ_Wood_Weathered');cylinder('RF_AZ_Mine_Sheave',(0,-1.8,13.5),1.4,.35,'metal',12 if lod else 20,(math.pi/2,0,0), 'RF_AZ_Metal_Iron')
    if not lod:
        for z in (4,8,12):beam_between('RF_AZ_Mine_Brace',(-3,-2,z-2),(3,2,z+2),.25,'wood','RF_AZ_Wood_Weathered')
    anchors(18,20)

BUILDERS={
    'arizona-timber-house-gable':timber_house_gable,'arizona-timber-house-hipped':timber_house_hipped,'arizona-adobe-house':adobe_house,'arizona-brick-house':brick_house,
    'arizona-shop-false-front':false_front_shop,'arizona-shop-awning':awning_shop,'arizona-depot':depot,'arizona-water-tower':water_tower,
    'arizona-freight-shed':freight_shed,'arizona-mine-headframe':mine_headframe
}
GABLED={'arizona-timber-house-gable','arizona-brick-house','arizona-shop-false-front','arizona-depot','arizona-freight-shed'}

assets=[]
for asset_id,builder in BUILDERS.items():
    lods=[]
    for lod in (0,1):
        reset();bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1;builder(lod)
        filename=f'{asset_id}_lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(OUTPUT/filename),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
        lods.append({'path':f'/models/arizona/{filename}','maxTriangles':6500 if lod==0 else 1800,'maxBytes':420000 if lod==0 else 170000})
    required=['ground_origin','footprint_nw','footprint_se']+(['roof_ridge','roof_eave_left','roof_eave_right'] if asset_id in GABLED else [])
    assets.append({'id':asset_id,'kind':'building','requiredNodes':required,'maxDimensionsM':[32,24,32],'lods':lods})

textures=[]
for family in ('painted-wood','masonry','weathered-roof'):
    for suffix,role,color in (('base','baseColor','srgb'),('normal','normal','linear'),('roughness','roughness','linear')):textures.append({'id':f'{family}-{suffix}','path':f'/textures/arizona/{family}-{suffix}.png','role':role,'colorSpace':color})
bindings=[
    {'materialPrefix':'RF_AZ_Wood_','map':'painted-wood-base','normalMap':'painted-wood-normal','roughnessMap':'painted-wood-roughness','repeat':[2,3]},
    {'materialPrefix':'RF_AZ_Masonry_','map':'masonry-base','normalMap':'masonry-normal','roughnessMap':'masonry-roughness','repeat':[3,3]},
    {'materialPrefix':'RF_AZ_Roof_','map':'weathered-roof-base','normalMap':'weathered-roof-normal','roughnessMap':'weathered-roof-roughness','repeat':[3,4]}
]
previous=json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
authored_ids={a['id'] for a in assets}
assets += [a for a in previous.get('assets',[]) if a['id'] not in authored_ids]
manifest={'version':1,'campaignId':'arizona-terrain-study','generator':{'blender':bpy.app.version_string,'script':'tools/blender/generate_arizona_architecture.py','referenceEra':'Arizona circa 1900 interpretation'},'textures':textures,'materialBindings':bindings,'assets':assets}
if 'stationScript' in previous.get('generator',{}):manifest['generator']['stationScript']=previous['generator']['stationScript']
MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')

reset()
for index,asset_id in enumerate(BUILDERS):
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(OUTPUT/f'{asset_id}_lod0.glb'));imported=[obj for obj in bpy.context.scene.objects if obj not in before]
    x=(index%5)*25;y=(index//5)*30
    for obj in imported:obj.location.x+=x;obj.location.y+=y
bpy.ops.mesh.primitive_plane_add(size=150,location=(50,15,-.05));bpy.context.object.data.materials.append(mat('adobe','RF_AZ_Masonry_Ground'))
bpy.ops.object.light_add(type='AREA',location=(20,-45,55));bpy.context.object.data.energy=18000;bpy.context.object.data.size=36
bpy.ops.object.light_add(type='AREA',location=(100,65,35));bpy.context.object.data.energy=9000;bpy.context.object.data.size=28
bpy.ops.object.camera_add(location=(46,-130,62));camera=bpy.context.object;camera.rotation_euler=(Vector((46,15,6))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=38;bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=2000;scene.render.resolution_y=950;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(CONTACT);scene.world.color=(.65,.58,.48);scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=1.8;bpy.ops.render.render(write_still=True)
print('RF_ARIZONA_ARCHITECTURE_EXPORT',json.dumps({'blender':bpy.app.version_string,'assets':len(assets),'textures':len(textures),'contact':str(CONTACT)}))

# Retain independently authored regional scenery and its shared material tiles.
manifest['textures'] += [t for t in previous.get('textures',[]) if t['id'].startswith('regional-')]
manifest['materialBindings'] += [b for b in previous.get('materialBindings',[]) if b['materialPrefix'].startswith('RF_REG_')]
if 'regionalScript' in previous.get('generator',{}):manifest['generator']['regionalScript']=previous['generator']['regionalScript']
MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
