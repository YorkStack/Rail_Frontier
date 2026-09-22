"""Original regional and era-specific stations. Blender 4+, metre axes, stable door/rail sockets.
Run after either regional pack generator; those generators preserve these entries.
Historic buildings remain in later eras; runtime surfaces/furniture modernise separately.
"""
import bpy, math, json, struct, zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def png(path,pixels,size=256):
    def chunk(k,d):return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
    raw=b''.join(b'\0'+pixels[y*size*4:(y+1)*size*4] for y in range(size))
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

def material(name,color,pattern=None):
    m=bpy.data.materials.new('RF_Station_'+name);m.use_nodes=True;m.diffuse_color=(*[c/255 for c in color],1)
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=m.diffuse_color;bs.inputs['Roughness'].default_value=.86
    if pattern:
        pixels=bytearray();heights=[]
        for y in range(256):
            for x in range(256):
                grain=(math.sin(x*12.9898+y*78.233)*43758.5453)%1
                if pattern=='wood':
                    edge=y%16;shade=(.84+grain*.10+math.sin(x*.6+y*.18)*.045)*(0.52 if edge<2 else 1);h=.1 if edge<2 else .6
                elif pattern=='plaster':
                    shade=.87+grain*.13;h=grain*.10
                else:
                    rows=16 if pattern=='roof' else 20;columns=8 if pattern=='roof' else 10
                    xx=(x/256*columns+(int(y/256*rows)%2)*.5)%1;yy=y/256*rows%1;bevel=max(0,min(1,(min(xx,1-xx,yy,1-yy)-.04)*14))
                    shade=(.77+grain*.14)*(0.55+.45*bevel);h=bevel*.65
                pixels.extend([int(c*shade) for c in color]+[255]);heights.append(h)
        path=TEXTURES/(name+'-base.png');png(path,pixels);image=bpy.data.images.load(str(path),check_existing=True);image.pack();tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
        normal=bytearray()
        for y in range(256):
            for x in range(256):
                at=lambda a,b:heights[(b%256)*256+a%256]
                dx=(at(x-1,y)-at(x+1,y))*.5;dy=(at(x,y-1)-at(x,y+1))*.5;length=math.sqrt(dx*dx+dy*dy+1)
                normal.extend([round((dx/length*.5+.5)*255),round((dy/length*.5+.5)*255),round((1/length*.5+.5)*255),255])
        path=TEXTURES/(name+'-normal.png');png(path,normal);im=bpy.data.images.load(str(path),check_existing=True);im.colorspace_settings.name='Non-Color';im.pack();t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.45;m.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],bs.inputs['Normal'])
    return m

def finish(obj,name,mat):
    obj.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);obj.data.materials.append(mat)
    uv=obj.data.uv_layers.active or obj.data.uv_layers.new()
    for face in obj.data.polygons:
        normal=face.normal
        for li in face.loop_indices:
            co=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(co.y/4 if abs(normal.x)>.5 else co.x/4,co.y/4 if abs(normal.z)>.5 else co.z/4)
    return obj

def box(name,loc,dims,mat,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rotation);o=bpy.context.object;o.dimensions=dims;return finish(o,name,mat)
def empty(name,loc):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc

def build(region,lod,era):
    wall_color=([192,143,66] if era=='heritage' else [157,82,57] if era=='interwar' else [81,88,83]) if region=='norway' else ([158,82,53] if era=='heritage' else [201,174,125] if era=='interwar' else [216,205,174])
    wall_pattern=('brick' if era=='interwar' else 'wood') if region=='norway' else ('brick' if era=='heritage' else 'plaster')
    wall=material('Wall',wall_color,wall_pattern)
    trim=material('Trim',[225,216,187],'wood');roof=material('Roof',([80,90,90] if era!='modern' else [128,140,142]) if region=='norway' else ([105,94,77] if era=='heritage' else [151,79,52]),'roof')
    glass=material('Glass',[40,78,86]);stone=material('Stone',[128,129,116],'brick');door=material('Door',[79,90,65],'wood');iron=material('Iron',[40,45,42]);brick=material('Chimney',[141,74,49],'brick')
    # Original footprint: centre x=4.9, depth centre y=1.5. Public threshold x=9.15.
    cx,cy,w,d,top,rise=4.9,1.5,8.5,15,5.4,(1.8 if era=='modern' else 3.0)
    box('RF_Station_Body',(cx,cy,top/2),(w,d,top),wall)
    for side in [-1,1]:
        dx=side*(w/4+.30);span=w/2+.60;length=math.hypot(span,rise)
        box('RF_Station_Roof'+str(side),(cx+dx,cy,top+rise/2),(length,d+1.6,.25),roof,(0,side*math.atan2(rise,span),0))
        for y in [cy-d/2-.82,cy+d/2+.82]:box('RF_Station_Vergeband',(cx+dx,y,top+rise/2),(length,.18,.24),trim,(0,side*math.atan2(rise,span),0))
    box('RF_Station_Ridge',(cx,cy,top+rise+.06),(.24,d+1.7,.22),roof)
    # Closed gables, ridge higher than both eaves.
    for y in [cy-d/2,cy+d/2]:
        mesh=bpy.data.meshes.new('gable');mesh.from_pydata([(cx-w/2,y,top),(cx+w/2,y,top),(cx,y,top+rise)],[],[(0,1,2)]);mesh.update();o=bpy.data.objects.new('RF_Station_Gable',mesh);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);finish(o,'RF_Station_Gable',wall);o.select_set(False)
        # Match both windings for solid exterior faces (thin gable slab).
        mod=o.modifiers.new('solid gable','SOLIDIFY');mod.thickness=.16;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    for x in [cx-w/2-.04,cx+w/2+.04]:
        for y in [cy-d/2+.12,cy+d/2-.12]:box('RF_Station_Corner',(x,y,top/2),(.16,.22,top),trim)
        box('RF_Station_EaveTrim',(x,cy,top-.1),(.16,d,.22),trim)
        for y in [-3.7,-.8,3.8,6.7]:
            box('RF_Station_Window',(x,y,2.85),(.12,2.1 if era=='modern' else 1.5,1.9),glass)
            for off in ([-1.12,1.12] if era=='modern' else [-.82,.82]):box('RF_Station_WindowFrame',(x+(.09 if x>cx else -.09),y+off,2.85),(.18,.14,2.12),trim)
            for z in [1.85,3.85]:box('RF_Station_WindowFrame',(x,y,z),(.18,2.38 if era=='modern' else 1.78,.14),trim)
            if not lod and era!='modern':
                box('RF_Station_Mullion',(x,y,2.85),(.20,.07,1.9),trim);box('RF_Station_Mullion',(x,y,2.85),(.20,1.5,.075),trim)
    for x in [cx-w/2-.1,cx+w/2+.1]:
        box('RF_Station_Door',(x,cy,1.6),(.16,1.65,3.2),door);box('RF_Station_DoorGlazing',(x+(.10 if x>cx else -.10),cy,2.45),(.10,1.15,.8),glass)
        for y in [cy-.92,cy+.92]:box('RF_Station_DoorTrim',(x,y,1.68),(.22,.14,3.36),trim)
        box('RF_Station_DoorLintel',(x,cy,3.38),(.22,1.98,.18),trim)
    box('RF_Station_Chimney',(cx+1.65,cy+3.8,7.6),(.72,.8,3.1),brick);box('RF_Station_ChimneyCap',(cx+1.65,cy+3.8,9.2),(1,.99,.2),stone)
    box('RF_Station_Canopy',(cx-w/2-1.9,cy,3.8),(4,13.8,.20),roof,(0,-.08,0))
    for y in [-4.5,1.5,7.5]:
        box('RF_Station_Post',(-2.9,y,2.0),(.18,.18,3.5),iron)
        if not lod:box('RF_Station_CanopyBrace',(-2.25,y,3.25),(1.6,.16,.16),trim,(0,-.6,0))
    # Public awning remains at the stable court location.
    box('RF_Station_PublicAwning',(10.0,cy,3.62),(1.95,3,.18),roof,(0,.12,0))
    if not lod:
        for y in [-6.15,9.15]:
            for x in [cx-2,cx+2]:box('RF_Station_EndWindow',(x,y,2.8),(1.35,.15,1.8),glass)
        for y in [-3.6,6.6]:box('RF_Station_Bench',(-1.3,y,.95),(1.1,2.5,.16),door);box('RF_Station_BenchBack',(-.82,y,1.40),(.12,2.5,.8),door)
    empty('platform_origin',(0,0,0));empty('track_side',(-4.2,0,0));empty('public_entrance',(9.15,1.5,0));empty('roof_ridge',(cx,cy,top+rise));empty('roof_eave_left',(cx-w/2-.6,cy,top));empty('roof_eave_right',(cx+w/2+.6,cy,top))

for region in ['norway','arizona']:
    OUTPUT=ROOT/f'assets/runtime/models/{region}';OUTPUT.mkdir(parents=True,exist_ok=True)
    path=ROOT/f'assets/runtime/packs/{region}.json';manifest=json.loads(path.read_text())
    for era,suffix in [('heritage',''),('interwar','-interwar'),('modern','-modern')]:
        TEXTURES=ROOT/f'artifacts/station-textures/{region}/{era}';TEXTURES.mkdir(parents=True,exist_ok=True)
        asset_id=region+'-station'+suffix;lods=[]
        for lod in [0,1]:
            bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
            for m in list(bpy.data.materials):bpy.data.materials.remove(m)
            build(region,lod,era);filename=f'{asset_id}_lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(OUTPUT/filename),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
            lods.append({'path':f'/models/{region}/{filename}','maxTriangles':3000 if lod==0 else 1600,'maxBytes':800000})
        manifest['assets']=[a for a in manifest['assets'] if a['id']!=asset_id]+[{'id':asset_id,'kind':'station','requiredNodes':['platform_origin','track_side','public_entrance','roof_ridge','roof_eave_left','roof_eave_right'],'maxDimensionsM':[17,10,19],'lods':lods}]
    manifest['generator']['stationScript']='tools/blender/generate_station_architecture.py';path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Regional and era-specific station models exported.')
