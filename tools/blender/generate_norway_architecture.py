"""Blender 4.0+: generate original Norwegian timber buildings and shared PBR maps."""
import bpy
import json
import math
import struct
import zlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2];OUTPUT=ROOT/'assets/runtime/models/norway';TEXTURES=ROOT/'assets/runtime/textures/norway';MANIFEST=ROOT/'assets/runtime/packs/norway.json';CONTACT=ROOT/'artifacts/evidence/gfx-006/blender-houses.png'
OUTPUT.mkdir(parents=True,exist_ok=True);TEXTURES.mkdir(parents=True,exist_ok=True);CONTACT.parent.mkdir(parents=True,exist_ok=True)
COLORS={'red':(.342,.051,.034),'ochre':(.552,.323,.072),'charcoal':(.030,.026,.022),'white':(.78,.74,.66),'warm_white':(.86,.81,.72),'cream':(.68,.58,.39),'dark':(.055,.065,.062),'blue':(.055,.16,.22),'stone':(.34,.35,.33),'glass':(.045,.095,.105),'timber':(.30,.16,.065),'roof':(.075,.085,.085)}
FINISHES=[('red-white',0,'red','warm_white','dark'),('red-dark',1,'red','dark','blue'),('ochre-white',2,'ochre','warm_white','dark'),('ochre-cream',0,'ochre','cream','red'),('charcoal-white',1,'charcoal','warm_white','blue'),('charcoal-dark',2,'charcoal','dark','red'),('white-red',0,'white','warm_white','red'),('white-dark',1,'white','white','dark')]

def png(path,size,pixel):
    raw=bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):raw.extend(pixel(x,y))
    def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b''))

SIZE=256
png(TEXTURES/'timber-base.png',SIZE,lambda x,y:(max(0,min(255,224+int(9*math.sin(y*.18)+4*math.sin(x*.037+y*.071)))),)*3+(255,))
png(TEXTURES/'timber-normal.png',SIZE,lambda x,y:(128,max(0,min(255,128+int(18*math.sin(y*math.pi/8)))),252,255))
png(TEXTURES/'timber-roughness.png',SIZE,lambda x,y:(222,220+int(20*(.5+.5*math.sin(x*.051+y*.11))),0,255))
png(TEXTURES/'slate-base.png',SIZE,lambda x,y:(112+((x//32+y//18)%3)*7,116+((x//32+y//18)%3)*7,116+((x//32+y//18)%3)*6,255))
png(TEXTURES/'slate-normal.png',SIZE,lambda x,y:(128,136 if y%18<2 else 128,252,255))
png(TEXTURES/'slate-roughness.png',SIZE,lambda x,y:(230,226+((x//32+y//18)%2)*12,0,255))

def reset():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):bpy.data.materials.remove(material)
def mat(key,name=None):
    value=bpy.data.materials.get(name or 'RF_'+key.title())
    if value:return value
    value=bpy.data.materials.new(name or 'RF_'+key.title());value.diffuse_color=(*COLORS[key],1);value.use_nodes=True;shader=value.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*COLORS[key],1);shader.inputs['Roughness'].default_value=.82;shader.inputs['Metallic'].default_value=0;return value
def finish(obj,name,key,material_name=None):obj.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);obj.data.materials.append(mat(key,material_name));return obj
def box(name,loc,dims,key,rotation=(0,0,0),material_name=None):bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rotation);obj=bpy.context.object;obj.dimensions=dims;return finish(obj,name,key,material_name)
def cylinder(name,loc,radius,depth,key,vertices=8,rotation=(0,0,0)):bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=rotation);return finish(bpy.context.object,name,key)
def empty(name,loc=(0,0,0)):obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj);obj.location=loc

def anchors(width,depth):empty('ground_origin');empty('footprint_nw',(-width/2,-depth/2,0));empty('footprint_se',(width/2,depth/2,0))

def house(lod,shape,finish_id,wall,trim,door):
    width,depth,height=((8,10,6),(7,12,7),(10,8,5.4))[shape];wall_name='RF_Wall_'+finish_id;trim_name='RF_Trim_'+finish_id
    box('RF_House_Foundation',(0,0,.45),(width+.35,depth+.35,.9),'stone');box('RF_House_Walls',(0,0,.9+height/2),(width,depth,height),'white' if wall=='white' else wall,material_name=wall_name)
    roof_z=height+2.0;box('RF_House_RoofA',(-width*.265,0,roof_z),(width*.62,depth+1.15,.42),'roof',(0,math.radians(46),0),material_name='RF_Roof_Slate');box('RF_House_RoofB',(width*.265,0,roof_z),(width*.62,depth+1.15,.42),'roof',(0,math.radians(-46),0),material_name='RF_Roof_Slate')
    if not lod:
        for x in (-width/2+.14,width/2-.14):box('RF_House_Corner',(x,-depth/2-.05,height*.54+1.0),(.23,.16,height+.18),trim,material_name=trim_name)
        for side in (-1,1):box('RF_House_Fascia',(side*(width*.5+.08),0,height+1.25),(.19,depth+1.3,.24),trim,material_name=trim_name)
        for x in (-width*.23,width*.23):
            box('RF_House_WindowRecess',(x,-depth/2-.055,height*.6+1.0),(1.35,.12,1.6),'glass')
            for dx in (-.72,.72):box('RF_House_WindowTrim',(x+dx*.86,-depth/2-.13,height*.6+1.0),(.16,.12,1.9),trim,material_name=trim_name)
            for dz in (-.88,.88):box('RF_House_WindowTrim',(x,-depth/2-.14,height*.6+1.0+dz*.85),(1.55,.12,.16),trim,material_name=trim_name)
        box('RF_House_Door',(0,depth/2+.07,2.25),(1.45,.15,3.6),door);box('RF_House_Threshold',(0,depth/2+.65,.35),(2.1,1.3,.35),'stone');cylinder('RF_House_Chimney',(width*.25,depth*.1,height+2.7),.3,2.6,'stone',8)
    anchors(width+.8,depth+1.2)

def barn(lod):
    box('RF_Barn_Foundation',(0,0,.35),(11,17,.7),'stone');box('RF_Barn_Walls',(0,0,4.2),(10.5,16.5,7.7),'timber',material_name='RF_Wall_Weathered');box('RF_Barn_RoofA',(-3,0,9),(7.3,18,.5),'roof',(0,math.radians(42),0),material_name='RF_Roof_Slate');box('RF_Barn_RoofB',(3,0,9),(7.3,18,.5),'roof',(0,math.radians(-42),0),material_name='RF_Roof_Slate')
    if not lod:box('RF_Barn_Door',(0,-8.35,3),(4.2,.16,5.4),'dark');box('RF_Barn_Trim',(0,-8.46,6.8),(10.8,.15,.22),'warm_white')
    anchors(11,18)
def stabbur(lod):
    for x in (-2.5,2.5):
        for y in (-3,3):cylinder('RF_Stabbur_Post',(x,y,.65),.45,1.3,'stone',8)
    box('RF_Stabbur_Body',(0,0,3.5),(7,8,5.6),'red',material_name='RF_Wall_Red-White');box('RF_Stabbur_Roof',(0,0,6.8),(8.4,9.4,.55),'roof',material_name='RF_Roof_Slate')
    if not lod:box('RF_Stabbur_Door',(0,-4.05,3.2),(1.5,.15,3),'dark');box('RF_Stabbur_Trim',(0,-4.15,5.9),(7.2,.16,.22),'warm_white')
    anchors(8,9)
def boathouse(lod):
    box('RF_Boathouse_Foundation',(0,0,.3),(8,13,.6),'stone');box('RF_Boathouse_Walls',(0,0,3.2),(7.5,12.5,5.8),'red',material_name='RF_Wall_Red-Dark');box('RF_Boathouse_Roof',(0,0,6.35),(8.5,13.5,.5),'roof',material_name='RF_Roof_Slate')
    if not lod:box('RF_Boathouse_Door',(0,-6.35,2.8),(4.8,.15,4.6),'dark')
    anchors(8.5,13.5)
def sawmill(lod):
    box('RF_Sawmill_Base',(0,0,.4),(14,22,.8),'stone');box('RF_Sawmill_Hall',(0,1,4.3),(13,18,7.8),'ochre',material_name='RF_Wall_Ochre-Cream');box('RF_Sawmill_Roof',(0,1,8.5),(14.5,19.5,.55),'roof',material_name='RF_Roof_Slate');box('RF_Sawmill_Shed',(8,-3,2.8),(6,12,5),'timber',material_name='RF_Wall_Weathered')
    if not lod:
        cylinder('RF_Sawmill_Chimney',(-4,4,11),.6,8,'stone',10);box('RF_Sawmill_Door',(0,-8.08,3.2),(4.5,.2,5),'dark')
    anchors(18,22)
def timber_yard(lod):
    box('RF_TimberYard_Deck',(0,0,.25),(15,18,.5),'timber')
    for row in range(2 if lod else 4):
        for x in (-4,0,4):cylinder('RF_TimberYard_Log',(x,row*3-5,1.0),.48,10,'timber',8,(math.pi/2,0,0))
    anchors(16,19)

BUILDERS={}
for finish_id,shape,wall,trim,door in FINISHES:BUILDERS['norway-house-'+finish_id]=lambda lod,s=shape,f=finish_id,w=wall,t=trim,d=door:house(lod,s,f,w,t,d)
BUILDERS.update({'norway-barn':barn,'norway-stabbur':stabbur,'norway-boathouse':boathouse,'norway-sawmill':sawmill,'norway-timber-yard':timber_yard})
new_assets=[]
for asset_id,builder in BUILDERS.items():
    lods=[]
    for lod in (0,1):
        reset();bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1;builder(lod);filename=f'{asset_id}_lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(OUTPUT/filename),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False);lods.append({'path':f'/models/norway/{filename}','maxTriangles':5000 if lod==0 else 1800,'maxBytes':260000 if lod==0 else 120000})
    new_assets.append({'id':asset_id,'kind':'building','requiredNodes':['ground_origin','footprint_nw','footprint_se'],'maxDimensionsM':[22,18,25],'lods':lods})
manifest=json.loads(MANIFEST.read_text());ids=set(BUILDERS);manifest['assets']=[asset for asset in manifest['assets'] if asset['id'] not in ids]+new_assets;manifest['generator']['architectureScript']='tools/blender/generate_norway_architecture.py'
manifest['textures']=[{'id':'timber-base','path':'/textures/norway/timber-base.png','role':'baseColor','colorSpace':'srgb'},{'id':'timber-normal','path':'/textures/norway/timber-normal.png','role':'normal','colorSpace':'linear'},{'id':'timber-roughness','path':'/textures/norway/timber-roughness.png','role':'roughness','colorSpace':'linear'},{'id':'slate-base','path':'/textures/norway/slate-base.png','role':'baseColor','colorSpace':'srgb'},{'id':'slate-normal','path':'/textures/norway/slate-normal.png','role':'normal','colorSpace':'linear'},{'id':'slate-roughness','path':'/textures/norway/slate-roughness.png','role':'roughness','colorSpace':'linear'}]
manifest['materialBindings']=[{'materialPrefix':'RF_Wall_','map':'timber-base','normalMap':'timber-normal','roughnessMap':'timber-roughness','repeat':[2,3]},{'materialPrefix':'RF_Roof_','map':'slate-base','normalMap':'slate-normal','roughnessMap':'slate-roughness','repeat':[3,4]}];MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')

# Neutral Blender contact sheet of all eight curated residential finishes.
reset()
for index,(finish_id,*_) in enumerate(FINISHES):
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(OUTPUT/f'norway-house-{finish_id}_lod0.glb'));imported=[obj for obj in bpy.context.scene.objects if obj not in before]
    for obj in imported:obj.location.x+=index*15
bpy.ops.mesh.primitive_plane_add(size=145,location=(52,0,-.05));bpy.context.object.data.materials.append(mat('stone'));bpy.ops.object.light_add(type='AREA',location=(25,-28,40));bpy.context.object.data.energy=5200;bpy.context.object.data.size=32;bpy.ops.object.light_add(type='AREA',location=(92,24,25));bpy.context.object.data.energy=2400;bpy.context.object.data.size=24
bpy.ops.object.camera_add(location=(52,-112,31));camera=bpy.context.object;from mathutils import Vector;camera.rotation_euler=(Vector((52,0,5))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=35;bpy.context.scene.camera=camera;scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=2000;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(CONTACT);scene.world.color=(.3,.34,.32);scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=1;bpy.ops.render.render(write_still=True)
print('RF_NORWAY_ARCHITECTURE_EXPORT',json.dumps({'blender':bpy.app.version_string,'assets':len(new_assets),'textures':6,'contact':str(CONTACT)}))
