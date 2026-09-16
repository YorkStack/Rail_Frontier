"""Blender 4.0+: generate original Norwegian rock and vegetation LOD assets."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUTPUT=ROOT/'assets/runtime/models/norway'
MANIFEST=ROOT/'assets/runtime/packs/norway.json'
CONTACT=ROOT/'artifacts/evidence/gfx-005/blender-contact-sheet.png'
OUTPUT.mkdir(parents=True,exist_ok=True);CONTACT.parent.mkdir(parents=True,exist_ok=True)

COLORS={'bark':(.19,.12,.065),'birch':(.62,.61,.53),'needle':(.035,.13,.07),'pine':(.075,.19,.09),'leaf':(.10,.25,.095),'leaf_light':(.20,.35,.14),'rock':(.34,.35,.33),'rock_warm':(.42,.39,.34),'lichen':(.31,.39,.23),'fern':(.12,.28,.10)}

def reset():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):bpy.data.materials.remove(material)

def mat(key):
    name='RF_'+key.title();existing=bpy.data.materials.get(name)
    if existing:return existing
    value=bpy.data.materials.new(name);value.diffuse_color=(*COLORS[key],1);value.use_nodes=True
    shader=value.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*COLORS[key],1);shader.inputs['Roughness'].default_value=.91
    return value

def finish(obj,name,material):
    obj.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);obj.data.materials.append(mat(material));return obj

def cylinder(name,loc,radius,depth,material,vertices=8,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=rotation);return finish(bpy.context.object,name,material)

def cone(name,loc,r1,r2,depth,material,vertices=9):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc);return finish(bpy.context.object,name,material)

def sphere(name,loc,scale,material,segments=10,rings=5):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);obj=bpy.context.object;obj.scale=scale;return finish(obj,name,material)

def ico(name,loc,scale,material,subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions,radius=1,location=loc);obj=bpy.context.object;obj.scale=scale;return finish(obj,name,material)

def branch(name,start,end,radius,material,vertices=7):
    start,end=Vector(start),Vector(end);direction=end-start;middle=(start+end)*.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=direction.length,location=middle)
    obj=bpy.context.object;obj.rotation_euler=direction.to_track_quat('Z','Y').to_euler();return finish(obj,name,material)

def clustered_crown(prefix,center,radius,height,material,count,phase):
    for index in range(count):
        angle=index*2.399+phase;ring=.34+.5*((index*7)%11)/10;z=((index*5)%13)/12-.5
        loc=(center[0]+math.cos(angle)*radius*ring,center[1]+math.sin(angle)*radius*ring,center[2]+z*height)
        scale=(radius*(.34+.1*(index%3)),radius*(.3+.08*((index+1)%3)),height*(.16+.035*(index%4)))
        ico(f'{prefix}_{index:02d}',loc,scale,material,2)

def empty(name='ground_origin'):obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)

def irregular_rock(name,loc,scale,material,lod,phase):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1 if lod else 2,radius=1,location=loc);obj=bpy.context.object
    for vertex in obj.data.vertices:
        co=vertex.co;factor=1+.16*math.sin(co.x*4.1+phase)+.11*math.sin(co.y*6.3-co.z*3.7+phase*.7);co.x*=factor;co.y*=1+.1*math.sin(co.z*5+phase);co.z*=factor
    obj.scale=scale;result=finish(obj,name,material);bpy.context.view_layer.update();bottom=min((result.matrix_world@vertex.co).z for vertex in result.data.vertices);result.location.z-=bottom;return result

def spruce_narrow(lod):
    cylinder('RF_SpruceNarrow_Trunk',(0,0,6.2),.34,12.4,'bark',6 if lod else 8)
    if lod:cone('RF_SpruceNarrow_Crown',(0,0,10.2),2.7,.05,13.8,'needle',8)
    else:
        for tier in range(7):
            z=4.7+tier*1.55;radius=3.25-tier*.34
            cone(f'RF_SpruceNarrow_Tier{tier}',(.12*math.sin(tier*1.7),.1*math.cos(tier*1.3),z),radius,.18,2.7,'needle' if tier%2 else 'pine',12)
            for side in range(3):
                angle=side*math.pi*2/3+tier*.73;branch(f'RF_SpruceBranch{tier}_{side}',(0,0,z-.55),(math.cos(angle)*radius*.88,math.sin(angle)*radius*.88,z-.8),.08,'bark')
        cone('RF_SpruceNarrow_Top',(0,0,15.2),1.15,.02,4.3,'needle',12)
    empty()

def pine(lod):
    cylinder('RF_Pine_Trunk',(0,0,6.5),.45,13,'bark',7 if lod else 10,(-.05,.12,0))
    if lod:ico('RF_Pine_CrownA',(-.3,.2,13.0),(3.1,2.5,3.0),'pine')
    else:
        for index,end in enumerate(((-1.8,.4,11.7),(1.9,-.7,12.8),(.3,1.5,14.0))):branch(f'RF_PineBranch{index}',(0,0,8.5+index),end,.16,'bark',8)
        clustered_crown('RF_PineCrownA',(-1.15,.2,12.8),3.0,3.8,'pine',7,.2)
        clustered_crown('RF_PineCrownB',(1.4,-.45,13.5),2.65,3.4,'needle',6,1.4)
        clustered_crown('RF_PineCrownC',(.1,1.0,15.0),2.25,3.0,'pine',5,2.2)
    empty()

def birch(lod):
    cylinder('RF_Birch_Trunk',(0,0,5.2),.32,10.4,'birch',7 if lod else 10)
    if lod:ico('RF_Birch_Crown',(0,0,10.2),(3.4,2.7,4.0),'leaf_light')
    else:
        for index,end in enumerate(((-2.1,.2,9.0),(2.2,-.3,10.1),(.5,1.9,11.6),(-.7,-1.5,12.5))):branch(f'RF_BirchBranch{index}',(0,0,6.6+index*.8),end,.13,'birch',8)
        clustered_crown('RF_BirchCrown',(0,0,10.5),3.7,6.0,'leaf_light',15,.4)
        clustered_crown('RF_BirchShadow',(.7,-.3,10.0),2.9,4.6,'leaf',8,1.7)
    empty()

def alder(lod):
    cylinder('RF_Alder_Trunk',(0,0,3.2),.4,6.4,'bark',7 if lod else 9)
    if lod:ico('RF_Alder_Crown',(-.2,0,7.5),(3.8,3.1,3.6),'leaf')
    else:
        for index,end in enumerate(((-2.3,.4,7.8),(2.5,.1,7.3),(.6,2.2,8.6),(-.5,-2.1,8.2))):branch(f'RF_AlderFork{index}',(0,0,3.5),end,.18,'bark',8)
        clustered_crown('RF_AlderCrown',(-.45,0,7.7),4.0,4.8,'leaf',14,.8)
        clustered_crown('RF_AlderLight',(1.35,.3,7.3),2.8,3.8,'leaf_light',8,2.1)
    empty()

def shrub(lod):
    for index,(x,y,s) in enumerate(((-1,0,1),(1,.3,.9),(0,1.1,.75))[:1 if lod else 3]):
        if lod:ico('RF_Shrub'+str(index),(x,y,1.28*s),(1.5*s,1.3*s,1.2*s),'leaf_light')
        else:sphere('RF_Shrub'+str(index),(x,y,1.28*s),(1.5*s,1.3*s,1.2*s),'leaf_light',10,6)
    empty()

def fern(lod):
    count=3 if lod else 7
    for index in range(count):
        angle=index/count*math.pi*2;cylinder('RF_Fern'+str(index),(math.cos(angle)*.65,math.sin(angle)*.65,.82),.12,1.4,'fern',5,(math.sin(angle)*.55,-math.cos(angle)*.55,0))
    empty()

def boulder_a(lod):irregular_rock('RF_BoulderA',(0,0,2.2),(3.8,2.9,2.2),'rock',lod,.4);empty()
def boulder_b(lod):irregular_rock('RF_BoulderB',(0,0,1.65),(2.4,3.2,1.65),'rock_warm',lod,2.1);empty()
def outcrop_a(lod):
    irregular_rock('RF_OutcropA0',(-3,0,2.8),(5.4,3.2,2.8),'rock',lod,.8)
    if not lod:irregular_rock('RF_OutcropA1',(3.1,.4,1.9),(4.2,2.7,1.9),'rock_warm',lod,1.7)
    empty()
def outcrop_b(lod):
    irregular_rock('RF_OutcropB0',(0,0,3.8),(3.4,5.0,3.8),'rock_warm',lod,3.1)
    if not lod:irregular_rock('RF_OutcropB1',(-3.2,.8,1.7),(3.4,2.6,1.7),'rock',lod,4.2)
    empty()
def scree(lod):
    count=4 if lod else 11
    for index in range(count):
        angle=index*2.399;radius=.9+index*.52;size=.45+(index%4)*.18
        irregular_rock('RF_Scree'+str(index),(math.cos(angle)*radius,math.sin(angle)*radius,size*.72),(size*1.5,size,size*.72),'rock' if index%3 else 'lichen',lod,index*.7)
    empty()

BUILDERS={'norway-spruce-narrow':spruce_narrow,'norway-pine':pine,'norway-birch':birch,'norway-alder':alder,'norway-shrub':shrub,'norway-fern':fern,'norway-boulder-a':boulder_a,'norway-boulder-b':boulder_b,'norway-outcrop-a':outcrop_a,'norway-outcrop-b':outcrop_b,'norway-scree':scree}
KINDS={key:('rock' if any(word in key for word in ('boulder','outcrop','scree')) else 'vegetation') for key in BUILDERS}
MAX_DIMS={key:([24,12,24] if KINDS[key]=='rock' else [12,22,12]) for key in BUILDERS}

new_assets=[]
for asset_id,builder in BUILDERS.items():
    lods=[]
    for lod in (0,1):
        reset();bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1;builder(lod)
        filename=f'{asset_id}_lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(OUTPUT/filename),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
        lods.append({'path':f'/models/norway/{filename}','maxTriangles':5000 if lod==0 else 1600,'maxBytes':220000 if lod==0 else 100000})
    new_assets.append({'id':asset_id,'kind':KINDS[asset_id],'requiredNodes':['ground_origin'],'maxDimensionsM':MAX_DIMS[asset_id],'lods':lods})

manifest=json.loads(MANIFEST.read_text());ids=set(BUILDERS);manifest['assets']=[asset for asset in manifest['assets'] if asset['id'] not in ids]+new_assets
manifest['generator']['sceneryScript']='tools/blender/generate_norway_scenery.py';MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')

# Render an actual Blender contact sheet from the exported LOD0 files.
reset()
for index,asset_id in enumerate(BUILDERS):
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(OUTPUT/f'{asset_id}_lod0.glb'));imported=[obj for obj in bpy.context.scene.objects if obj not in before]
    column=index%6;row=index//6
    for obj in imported:obj.location.x+=column*14;obj.location.y+=row*20
bpy.ops.mesh.primitive_plane_add(size=110,location=(34,10,-.05));ground=bpy.context.object;ground.data.materials.append(mat('rock'))
bpy.ops.object.light_add(type='AREA',location=(15,-20,35));bpy.context.object.data.energy=3600;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=28
bpy.ops.object.light_add(type='AREA',location=(55,30,22));bpy.context.object.data.energy=1900;bpy.context.object.data.size=20
bpy.ops.object.camera_add(location=(37,-78,35));camera=bpy.context.object;target=(35,8,6);direction=tuple(target[i]-camera.location[i] for i in range(3));camera.rotation_euler=Vector(direction).to_track_quat('-Z','Y').to_euler();camera.data.lens=52;bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1600;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(CONTACT);scene.world.color=(.28,.32,.30);scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=1.2;bpy.ops.render.render(write_still=True)
print('RF_NORWAY_SCENERY_EXPORT',json.dumps({'blender':bpy.app.version_string,'assets':len(new_assets),'contact':str(CONTACT)}))
