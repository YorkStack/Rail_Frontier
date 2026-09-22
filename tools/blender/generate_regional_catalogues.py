"""Original Blender regional scenery/vehicle catalogues. Run -- arizona|rhine|tyne.
Shared external 256px PBR tiles; two real geometry LODs; metre units, +Y forward.
"""
import bpy, math, json, random, struct, zlib, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
REGIONS=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['arizona','rhine','tyne']
LOD=0;M={}
def png(path,pixels):
 def ch(k,d):return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
 raw=b''.join(b'\0'+pixels[y*1024:(y+1)*1024] for y in range(256));path.write_bytes(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',256,256,8,6,0,0,0))+ch(b'IDAT',zlib.compress(raw,9))+ch(b'IEND',b''))
def materials(region):
 global M
 palettes={'wood':(139,115,79),'brick':(147,80,55) if region!='tyne' else (128,78,56),'stone':(144,139,124),'roof':(71,77,82),'plaster':(216,200,169),'metal':(66,73,68),'glass':(53,93,109),'leaf':(70,100,52),'bark':(93,76,53),'trim':(214,203,176),'red':(124,45,32),'black':(34,40,38),'coal':(40,39,37),'water':(65,106,116),'sand':(166,137,91),'yellow':(208,172,74)}
 if region=='arizona':palettes['leaf']=(108,122,69);palettes['roof']=(116,94,68)
 M={};textures=[];bindings=[];out=ROOT/f'assets/runtime/textures/{region}';out.mkdir(parents=True,exist_ok=True)
 for name,color in palettes.items():
  mat=bpy.data.materials.new('RF_REG_'+region+'_'+name);mat.diffuse_color=(*(c/255 for c in color),1);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.85;M[name]=mat
  if name not in ['wood','brick','stone','roof','plaster']:continue
  pixels=bytearray();heights=[]
  for y in range(256):
   for x in range(256):
    grain=(math.sin(x*12.9898+y*78.233)*43758.5453)%1
    if name=='wood':edge=y%16;shade=(.86+.1*grain+.055*math.sin(x*.47+y*.18))*(.52 if edge<2 else 1);h=.15 if edge<2 else .6
    elif name=='plaster':shade=.88+grain*.1;h=grain*.12
    else:
     rows=16 if name=='brick' else 8;cols=8 if name=='brick' else 5;xx=(x/256*cols+(int(y/256*rows)%2)*.5)%1;yy=y/256*rows%1;b=max(0,min(1,(min(xx,1-xx,yy,1-yy)-.035)*15));shade=(.84+.1*grain)*(.64+.36*b);h=b*.4
    pixels.extend([int(c*shade) for c in color]+[255]);heights.append(h)
  normal=bytearray();rough=bytearray()
  for y in range(256):
   for x in range(256):
    at=lambda a,b:heights[(b%256)*256+a%256];dx=(at(x-1,y)-at(x+1,y))*.45;dy=(at(x,y-1)-at(x,y+1))*.45;l=math.sqrt(dx*dx+dy*dy+1);normal.extend([round((dx/l*.5+.5)*255),round((dy/l*.5+.5)*255),round((1/l*.5+.5)*255),255]);rough.extend([255,235,0,255])
  for suffix,role,space,data in [('base','baseColor','srgb',pixels),('normal','normal','linear',normal),('roughness','roughness','linear',rough)]:
   png(out/f'{name}-{suffix}.png',data);textures.append({'id':f'{name}-{suffix}','path':f'/textures/{region}/{name}-{suffix}.png','role':role,'colorSpace':space})
  bindings.append({'materialPrefix':'RF_REG_'+region+'_'+name,'map':name+'-base','normalMap':name+'-normal','roughnessMap':name+'-roughness','repeat':[1,1]})
 return textures,bindings

def finish(o,name,material,uv=True):
 o.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.data.materials.append(M[material])
 if uv:
  layer=o.data.uv_layers.active or o.data.uv_layers.new()
  for face in o.data.polygons:
   for li in face.loop_indices:
    c=o.data.vertices[o.data.loops[li].vertex_index].co;n=face.normal;layer.data[li].uv=(c.y/4 if abs(n.x)>.5 else c.x/4,c.y/4 if abs(n.z)>.5 else c.z/4)
 return o

def box(name,p,d,mat,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p,rotation=rot);o=bpy.context.object;o.dimensions=d;return finish(o,name,mat)
def cyl(name,p,r,depth,mat,rot=(0,0,0),vertices=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices or (10 if LOD else 16),radius=r,depth=depth,location=p,rotation=rot);o=finish(bpy.context.object,name,mat,False)
 for face in o.data.polygons:face.use_smooth=len(face.vertices)==4
 return o

def beam(name,a,b,r,mat):
 direction=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,direction.length,mat,vertices=5 if LOD else 7);o.rotation_euler=direction.to_track_quat('Z','Y').to_euler();bpy.ops.object.transform_apply(location=False,rotation=True,scale=False);return o

def ellipsoid(name,p,scale,mat,detail=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1 if LOD else detail+1,radius=1,location=p);o=bpy.context.object;o.scale=scale;o=finish(o,name,mat,False)
 for f in o.data.polygons:f.use_smooth=True
 return o

def empty(name,p=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=p

def roof(cx,cy,w,d,h,rise,mat='roof',hip=False):
 if hip:
  verts=[(cx-w/2-.35,cy-d/2-.35,h),(cx+w/2+.35,cy-d/2-.35,h),(cx+w/2+.35,cy+d/2+.35,h),(cx-w/2-.35,cy+d/2+.35,h),(cx,cy-d*.24,h+rise),(cx,cy+d*.24,h+rise)]
  mesh=bpy.data.meshes.new('hip');mesh.from_pydata(verts,[],[(0,1,4),(1,2,5,4),(2,3,5),(3,0,4,5)]);mesh.update();o=bpy.data.objects.new('RF_HippedRoof',mesh);bpy.context.collection.objects.link(o);finish(o,o.name,mat)
 else:
  for side in [-1,1]:
   span=w/2+.4;angle=math.atan2(rise,span);box('RF_Roof',(cx+side*span/2,cy,h+rise/2),(math.hypot(span,rise),d+.8,.20),mat,(0,side*angle,0))
   for y in [cy-d/2-.42,cy+d/2+.42]:box('RF_Vergeband',(cx+side*span/2,y,h+rise/2),(math.hypot(span,rise),.14,.24),'trim',(0,side*angle,0))
  for y,rev in [(cy-d/2,True),(cy+d/2,False)]:
   mesh=bpy.data.meshes.new('gable');mesh.from_pydata([(cx-w/2,y,h),(cx+w/2,y,h),(cx,y,h+rise)],[],[(0,1,2) if rev else (2,1,0)]);mesh.update();o=bpy.data.objects.new('RF_Gable',mesh);bpy.context.collection.objects.link(o);finish(o,o.name,'plaster')
 box('RF_Ridge',(cx,cy,h+rise),(.18,d+.85,.15),mat)

def window(x,y,z,axis='y',wide=1.25,tall=1.6):
 box('RF_Window',(x,y,z),(wide,.16,tall) if axis=='y' else (.16,wide,tall),'glass')
 for side in [-1,1]:box('RF_WindowFrame',(x+side*(wide/2+.04) if axis=='y' else x,y if axis=='y' else y+side*(wide/2+.04),z),(.12,.22,tall+.2) if axis=='y' else (.22,.12,tall+.2),'trim')
 for zz in [z-tall/2-.04,z+tall/2+.04]:box('RF_WindowSill',(x,y,zz),(wide+.2,.28,.12) if axis=='y' else (.28,wide+.2,.12),'trim')
 if not LOD:box('RF_WindowMullion',(x,y,z),(.07,.24,tall) if axis=='y' else (.24,.07,tall),'trim')

def building(style,region):
 terrace=style=='terrace';w=18 if terrace else 9;d=10 if terrace else 12;h=7 if style not in ['barn','shop'] else 5
 wall='stone' if style=='stone-house' else 'wood' if style=='barn' else 'brick' if region=='tyne' or style=='brick-house' else 'plaster'
 box('RF_Foundation',(0,0,.25),(w+.25,d+.25,.5),'stone');box('RF_Body',(0,0,h/2+.3),(w,d,h),wall);roof(0,0,w,d,h+.3,3 if region=='rhine' else 2.4,hip=style=='villa')
 for side in [-1,1]:
  for x in ([-6,-3,3,6] if terrace else [-2.8,2.8]):
   for z in ([2.1,5.3] if h>6 else [2.5]):window(x,side*(d/2+.08),z)
  box('RF_Door',(0,side*(d/2+.1),1.5),(1.6,.22,2.8),'wood');box('RF_DoorLintel',(0,side*(d/2+.16),3),(1.85,.3,.18),'trim')
 for y in [-2.7,2.7]:window(w/2+.08,y,2.6,'x')
 if style=='half-timber':
  for x in [-w/2+.12,0,w/2-.12]:box('RF_TimberPost',(x,-d/2-.12,h/2),(.22,.20,h),'wood')
  for z in [3.8,h-.1]:box('RF_TimberBand',(0,-d/2-.14,z),(w,.22,.20),'wood')
  if not LOD:
   for x in [-3,3]:beam('RF_DiagonalTimber',(x-1.1,-d/2-.15,4),(x+1.1,-d/2-.15,6.9),.12,'wood')
 if style=='shop':box('RF_ShopAwning',(0,-d/2-1.1,3.4),(w+.4,2.3,.18),'red',(math.radians(8),0,0));box('RF_ShopSign',(0,-d/2-.2,4.5),(w*.72,.22,.7),'wood')
 for x in ([-5,0,5] if terrace else [2.7]):box('RF_Chimney',(x,2,h+2),(.65,.8,2.3),'brick');cyl('RF_ChimneyPot',(x,2,h+3.25),.19,.45,'brick')
 if style=='barn':box('RF_BarnDoors',(0,-d/2-.13,2.3),(4,.2,4),'wood')
 empty('ground_origin');empty('footprint_nw',(-w/2,-d/2,0));empty('footprint_se',(w/2,d/2,0));empty('entrance',(0,-d/2,0));empty('entrance_outward',(0,-d/2-1,0))

def station(region,era):
 cx=4.9;cy=1.5;w=8.5;d=15;h=5.4;rise=2 if era=='modern' else 3
 wall='stone' if region=='rhine' and era=='heritage' else 'brick' if era!='modern' else 'plaster'
 box('RF_Station_Body',(cx,cy,h/2),(w,d,h),wall);roof(cx,cy,w,d,h,rise)
 for x in [cx-w/2-.08,cx+w/2+.08]:
  for y in [-3.7,-.8,3.8,6.7]:window(x,y,2.8,'x',2 if era=='modern' else 1.4)
  box('RF_Station_Door',(x,cy,1.6),(.2,1.6,3.2),'wood');box('RF_Station_DoorGlazing',(x+(.12 if x>cx else -.12),cy,2.5),(.1,1.2,.8),'glass')
 for x in [cx-2.5,cx+2.5]:window(x,cy-d/2-.12,2.7)
 box('RF_PlatformCanopy',(-1.1,cy,3.8),(4,13.8,.2),'roof',(0,-.09,0))
 for y in [-4.5,1.5,7.5]:cyl('RF_CanopyColumn',(-2.8,y,1.95),.13,3.9,'metal')
 box('RF_PublicAwning',(10,cy,3.6),(2,3,.2),'roof',(0,.12,0));box('RF_StationChimney',(cx+1.5,cy+4,7.2),(.7,.9,3),'brick')
 if region=='rhine' and era=='heritage':
  for y in [-5,1.5,8]:box('RF_HeritageTimber',(cx+w/2+.12,y,4.2),(.2,.2,2.2),'wood')
 empty('platform_origin');empty('track_side',(-4.2,0,0));empty('public_entrance',(9.15,1.5,0));empty('roof_ridge',(cx,cy,h+rise));empty('roof_eave_left',(cx-w/2-.4,cy,h));empty('roof_eave_right',(cx+w/2+.4,cy,h))

def vegetation(kind):
 if kind in ['saguaro','prickly-pear','yucca']:
  if kind=='saguaro':
   cyl('RF_CactusStem',(0,0,3.0),.32,6,'leaf');ellipsoid('RF_CactusTip',(0,0,6),(.32,.32,.32),'leaf',0)
   for side,h in [(-1,3.7),(1,2.8)]:beam('RF_CactusArm',(0,0,h),(side*1.1,0,h),.21,'leaf');cyl('RF_CactusUpright',(side*1.1,0,h+.85),.21,1.7,'leaf');ellipsoid('RF_CactusArmTip',(side*1.1,0,h+1.7),(.21,.21,.22),'leaf',0)
   if not LOD:
    for i in range(12):a=i*math.tau/12;beam('RF_CactusRib',(.325*math.cos(a),.325*math.sin(a),.15),(.325*math.cos(a),.325*math.sin(a),5.9),.012,'bark')
  elif kind=='prickly-pear':
   for i in range(6 if LOD else 12):a=i*2.4;r=.18+.11*(i%4);ellipsoid('RF_CactusPad',(math.cos(a)*r,math.sin(a)*r,.35+i*.08),(.22,.10,.35),'leaf',0)
  else:
   cyl('RF_YuccaStem',(0,0,.45),.12,.9,'bark')
   for i in range(8 if LOD else 16):a=i*math.tau/(8 if LOD else 16);beam('RF_YuccaLeaf',(0,0,.7),(math.cos(a)*.9,math.sin(a)*.9,.3+(i%3)*.4),.045,'leaf')
 elif kind in ['grass','gorse','creosote','sage','hedge','vine']:
  if kind=='grass':
   for i in range(6 if LOD else 12):a=i*2.4;beam('RF_DryBlade',(0,0,0),(math.cos(a)*.45,math.sin(a)*.45,.6+random.random()*.5),.023,'sand')
  elif kind=='vine':
   for y in [-3,0,3]:cyl('RF_VinePost',(0,y,.9),.07,1.8,'wood');ellipsoid('RF_VineLeaves',(0,y,1.15),(.7,1.1,.55),'leaf',0)
   for h in [.65,1.2]:beam('RF_VineWire',(0,-3,h),(0,3,h),.018,'metal')
  else:
   for i in range(4 if LOD else 8):a=i*2.4;r=.5+(i%3)*.12;h=.65+random.random()*.65;beam('RF_ShrubBranch',(0,0,.05),(math.cos(a)*r,math.sin(a)*r,h),.035,'bark');ellipsoid('RF_ShrubLeaves',(math.cos(a)*r,math.sin(a)*r,h),(.6,.5,.4),'leaf',0)
   if kind=='gorse' and not LOD:
    for i in range(8):a=i*2.4;ellipsoid('RF_GorseFlower',(math.cos(a)*.8,math.sin(a)*.8,.95),(.12,.12,.09),'yellow',0)
 else:
  h={'oak':13,'beech':16,'birch':12,'willow':10,'pine':15,'juniper':5,'mesquite':5}.get(kind,10);cyl('RF_Trunk',(0,0,h*.28),h*.026,h*.56,'bark')
  for i in range(5 if LOD else 10):
   a=i*2.39996;r=h*(.13+random.random()*.09);z=h*(.5+random.random()*.33);end=(math.cos(a)*r,math.sin(a)*r,z);beam('RF_Branch',(0,0,h*.3),end,h*.008,'bark');ellipsoid('RF_Foliage',end,(h*.19,h*.17,h*(.21 if kind=='pine' else .14)),'leaf',0 if LOD else 1)
  if kind=='willow' and not LOD:
   for i in range(8):a=i*math.tau/8;ellipsoid('RF_HangingCrown',(math.cos(a)*2.5,math.sin(a)*2.5,4.2),(1.3,1.2,2.8),'leaf',0)
 empty('ground_origin')

def windpump():
 for x,y in [(-1,-1),(-1,1),(1,-1),(1,1)]:beam('RF_WindTower',(x*1.6,y*1.6,0),(x*.4,y*.4,9),.085,'metal')
 for z in [2,4,6,8]:
  low=1.6-z/9*1.2;hi=1.6-(z+1.6)/9*1.2
  for side in [-1,1]:beam('RF_TowerBrace',(-low,side*low,z),(hi,side*hi,z+1.6),.044,'metal');beam('RF_TowerBrace',(side*low,-low,z),(side*hi,hi,z+1.6),.044,'metal')
 cyl('RF_WindHub',(0,-.6,10),.23,.6,'metal',(math.pi/2,0,0));n=12 if LOD else 18
 for i in range(n):a=i*math.tau/n;box('RF_WindBlade',(math.sin(a)*1.55,-.85,10+math.cos(a)*1.55),(.42,.10,1.15),'trim',(0,a,.08));beam('RF_RotorSpoke',(0,-.8,10),(math.sin(a)*2.0,-.8,10+math.cos(a)*2),.025,'metal')
 beam('RF_TailBoom',(0,0,10),(0,3.2,10.2),.075,'metal');box('RF_TailVane',(0,3,10.25),(.12,1.6,1.1),'red');beam('RF_PumpRod',(0,0,0),(0,0,9),.035,'metal')
 cyl('RF_WaterTank',(4,0,1.2),1.7,2.4,'metal');cyl('RF_TankTop',(4,0,2.42),1.73,.10,'trim');box('RF_Trough',(3,-3,.4),(3.6,1.2,.8),'wood');box('RF_TroughWater',(3,-3,.81),(3.25,.9,.03),'water')
 empty('ground_origin');empty('rotor_center',(0,-.8,10))

def industry(style):
 if style=='mine':
  for x,y in [(-3,-2),(-3,2),(3,-2),(3,2)]:beam('RF_HeadframeLeg',(x*1.3,y*1.3,0),(x*.45,y*.45,16),.23,'metal')
  for h in [4,8,12]:
   for side in [-1,1]:beam('RF_HeadframeBrace',(-3,side*2,h),(3,side*2,h+3.5),.14,'metal')
  for y in [-1,1]:cyl('RF_WindingWheel',(0,y,16),2,.25,'metal',(math.pi/2,0,0))
  box('RF_WindingHouse',(9,0,3.5),(10,8,7),'brick');roof(9,0,10,8,7,2.2)
  for x in [6,9,12]:window(x,-4.1,4.5)
  for y in [-1,1]:beam('RF_WindingCable',(0,y,16),(9,y,7),.035,'black')
 elif style in ['factory','warehouse']:
  box('RF_IndustrialHall',(0,0,5),(18,25,10),'brick');roof(0,0,18,25,10,4)
  for y in [-8,-3,3,8]:window(9.1,y,6,'x',2,3)
  for x in [-6,0,6]:window(x,-12.6,7,'y',2,2.5)
  box('RF_LoadingDoor',(0,-12.7,2.6),(4.5,.22,5),'wood')
  if style=='factory':cyl('RF_FactoryStack',(-12,6,15),1.2,30,'brick');cyl('RF_StackCap',(-12,6,30.2),1.5,.5,'stone')
 else:
  box('RF_HarbourBase',(0,0,.7),(9,9,1.4),'stone');cyl('RF_CraneTower',(0,0,6),.9,11,'metal');beam('RF_CraneBoom',(0,0,10),(0,10,16),.27,'metal');beam('RF_CraneCable',(0,10,16),(0,10,4),.04,'black');box('RF_CraneCab',(0,0,10),(3,3,3),'wood');window(0,-1.6,10)
 empty('ground_origin')

def wheels(length,axles=2,r=.52):
 ys=[-length*.31,length*.31] if axles==2 else [-length*.34,-length*.23,length*.23,length*.34]
 for y in ys:
  beam('RF_Axle',(-1.35,y,r),(1.35,y,r),.10,'black')
  for x in [-1.25,1.25]:cyl('RF_Wheel',(x,y,r),r,.18,'black',(0,math.pi/2,0));cyl('RF_WheelHub',(x*1.09,y,r),r*.36,.08,'metal',(0,math.pi/2,0))

def markers(length):
 empty('coupler_front',(0,length/2,1));empty('coupler_rear',(0,-length/2,1));empty('forward_probe',(0,length/2+.1,0));empty('up_probe',(0,0,2))

def train(kind,region,length):
 box('RF_Chassis',(0,0,.95),(2.7,length-.5,.35),'black')
 if not kind.startswith('steam'):wheels(length,4 if length>13 else 2)
 else:
  # Tender axle set is separate from locomotive drivers; passenger engines have a leading bogie.
  for y in [-length*.44,-length*.35,-length*.27]:
   for x in [-1.25,1.25]:cyl('RF_TenderWheel',(x,y,.5),.5,.18,'black',(0,math.pi/2,0))
  if kind=='steam-passenger':
   for y in [length*.26,length*.34]:
    for x in [-1.25,1.25]:cyl('RF_LeadingWheel',(x,y,.5),.5,.18,'black',(0,math.pi/2,0))
   if region=='tyne':
    for x in [-1.25,1.25]:cyl('RF_TrailingWheel',(x,-2.7,.55),.55,.18,'black',(0,math.pi/2,0))
 for end in [-1,1]:
  for x in [-.95,.95]:cyl('RF_Buffer',(x,end*(length/2-.16),.95),.22,.3,'metal',(math.pi/2,0,0))
 if kind.startswith('steam'):
  cabY=-length*.19;boilerY=length*.14;cyl('RF_Boiler',(0,boilerY,2.35),1.0,length*.40,'leaf' if region=='tyne' and kind=='steam-passenger' else 'black',(math.pi/2,0,0));cyl('RF_SmokeboxFront',(0,length*.35,2.35),1.05,.18,'black',(math.pi/2,0,0))
  box('RF_Cab',(0,cabY,2.5),(2.9,2.5,2.8),'leaf' if region=='tyne' else 'black');box('RF_CabRoof',(0,cabY,4.05),(3.1,2.8,.2),'roof')
  for x in [-1.5,1.5]:window(x,cabY,3.2,'x',1.3,1.1);box('RF_CabDoor',(x,cabY-1,2.35),(.1,.8,2.4),'black')
  cyl('RF_Chimney',(0,length*.28,3.9),.27,1.25,'black');cyl('RF_Dome',(0,length*.1,3.5),.42,.7,'metal')
  box('RF_Tender',(0,-length*.38,1.8),(2.8,length*.20,1.8),'leaf' if region=='tyne' else 'black');ellipsoid('RF_TenderCoal',(0,-length*.38,2.8),(1.2,length*.085,.32),'coal',0)
  for side in [-1,1]:
   for y in [-1.7,0,1.7]:cyl('RF_DrivingWheel',(side*1.28,y,1.0 if kind=='steam-passenger' else .78),.96 if kind=='steam-passenger' else .74,.20,'red' if region=='rhine' else 'black',(0,math.pi/2,0))
   beam('RF_CouplingRod',(side*1.42,-1.7,.92),(side*1.42,1.7,.92),.075,'metal');beam('RF_SteamPipe',(side*.93,-1.8,2.8),(side*.93,length*.30,2.8),.055,'metal')
   if not LOD:
    for y in [-.4,1,2.4]:cyl('RF_BoilerBand',(0,y,2.35),1.018,.04,'metal',(math.pi/2,0,0))
  cyl('RF_Headlamp',(0,length*.40,2.1),.22,.2,'yellow',(math.pi/2,0,0))
 elif kind=='diesel' and region=='rhine':
  # V100: raised offset centre cab, long/short narrow hoods and open side walkways.
  box('RF_LongHood',(0,2.0,2.05),(1.85,7.2,1.8),'red');box('RF_ShortHood',(0,-4.1,2.05),(1.85,3.3,1.8),'red')
  box('RF_CentreCab',(0,-1.55,2.65),(2.8,2.8,2.6),'red');box('RF_CabRoof',(0,-1.55,4.05),(3.0,3,.16),'roof')
  for end in [-1,1]:
   for x in [-.75,.75]:window(x,-1.55+end*1.45,3.3,'y',1.1,.95)
  for side in [-1,1]:
   window(side*1.45,-1.55,3.3,'x',1.65,.95);box('RF_CabDoor',(side*1.46,-2.3,2.4),(.1,.72,2.6),'red')
   for y in [2.5,3,3.5,4,4.5,5]:box('RF_CoolingLouvre',(side*.96,y,2.1),(.12,.20,1.3),'black')
   beam('RF_WalkwayHandrail',(side*1.3,-6,2.1),(side*1.3,6,2.1),.045,'trim')
   for y in [-6,-3,0,3,6]:beam('RF_HandrailPost',(side*1.3,y,1.1),(side*1.3,y,2.1),.045,'trim')
  cyl('RF_Exhaust',(0,1,3.2),.2,.6,'black')
 elif kind in ['diesel','electric']:
  class91=region=='tyne' and kind=='electric';colour='trim' if class91 else 'leaf'
  bodylength=length-2.8 if region=='tyne' else length-.9
  box('RF_EngineBody',(0,-.5 if class91 else 0,2.25),(2.8,bodylength,2.6),colour)
  for end in [-1,1]:
   cabY=end*(length*.31);box('RF_CabRoof',(0,cabY,3.8),(2.9,length*.23,.18),'roof')
   # Class 37 protruding noses; Class 91 sloping front windscreen and low nose.
   if region=='tyne':
    box('RF_Nose',(0,end*(length/2-1.1),1.95),(2.65,1.65,1.4),'yellow' if not class91 else 'black')
    if class91 and end==1:box('RF_RakedCab',(0,length/2-1.9,3.05),(2.75,.24,1.9),'black',(math.radians(24),0,0))
   for x in [-.72,.72]:window(x,end*(length/2-2.0 if region=='tyne' else length/2-.43),3.0,'y',1.02,1.02)
   for x in [-1.43,1.43]:window(x,cabY,3.05,'x',1.1,1.05);box('RF_CabDoor',(x,end*length*.24,2.2),(.12,.7,2.3),colour)
  for side in [-1,1]:
   box('RF_BodyStripe',(side*1.42,0,1.65),(.06,bodylength,.22),'red' if class91 else 'trim')
   for y in range(-3,4):box('RF_CoolingLouvre',(side*1.43,y*.65,2.45),(.12,.14,1.65),'black')
  for y in [-2,2]:cyl('RF_RoofFan',(0,y,3.7),.65,.15,'black')
  if kind=='electric':
   for y in ([-length*.23] if class91 else [-length*.23,length*.23]):
    for side in [-1,1]:beam('RF_Pantograph',(side*.6,y-1,3.8),(side*.6,y,5.5),.05,'metal');beam('RF_Pantograph',(side*.6,y,5.5),(side*.6,y+1,3.8),.05,'metal')
    beam('RF_ContactStrip',(-1.1,y,5.5),(1.1,y,5.5),.055,'metal')
 elif kind in ['coach','mail','modern-coach']:
  box('RF_CoachBody',(0,0,2.2),(2.8,length-.6,2.4),'wood' if region=='tyne' and kind!='modern-coach' else 'leaf')
  # Curved roof retains a rounded silhouette at both LODs.
  o=cyl('RF_CoachRoof',(0,0,3.35),1.45,length-.35,'roof',(math.pi/2,0,0));o.scale.z=.28;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  box('RF_RoofLowerMask',(0,0,2.65),(2.8,length-.6,1.3),'wood' if region=='tyne' and kind!='modern-coach' else 'leaf')
  for side in [-1,1]:
   for i in range(max(3,int(length/2.1))):y=-length*.34+i*(length*.68/(max(3,int(length/2.1))-1));window(side*1.44,y,2.6,'x',1.15,.95)
   for y in [-length*.43,length*.43]:box('RF_CarDoor',(side*1.45,y,2.1),(.1,.72,2.2),'metal')
 elif kind=='tank':cyl('RF_Tank',(0,0,2.05),1.25,length-.8,'metal',(math.pi/2,0,0));cyl('RF_TankDome',(0,0,3.4),.4,.5,'metal')
 elif kind in ['coal','hopper']:
  box('RF_FreightFloor',(0,0,1.25),(2.7,length-.8,.2),'wood')
  for side in [-1,1]:box('RF_WagonSide',(side*1.35,0,2),( .16,length-.8,1.7),'wood' if kind=='coal' else 'metal')
  for end in [-1,1]:box('RF_WagonEnd',(0,end*(length/2-.4),2),(2.7,.18,1.7),'wood');
  for side in [-1,1]:
   for y in [-length*.32,0,length*.32]:box('RF_WagonStrap',(side*1.45,y,2),(.07,.11,1.8),'black')
  ellipsoid('RF_CoalLoad',(0,0,2.4),(1.2,length*.38,.45),'coal',0)
 elif kind=='flat':
  box('RF_FlatDeck',(0,0,1.2),(2.8,length-.6,.2),'wood')
  for y in [-length*.35,0,length*.35]:
   for side in [-1,1]:box('RF_Stake',(side*1.3,y,2),(.12,.12,1.6),'wood')
  for x in [-.75,0,.75]:cyl('RF_TimberLoad',(x,0,1.6),.3,length*.7,'bark',(math.pi/2,0,0))
 else:
  box('RF_GoodsBody',(0,0,2.1),(2.8,length-.7,2.2),'wood');roof(0,0,2.8,length-.7,3.2,.5);box('RF_SlidingDoor',(1.45,0,2.1),(.12,2.4,2.1),'wood');box('RF_DoorRail',(1.52,0,3.2),(.1,4,.1),'metal')
 markers(length)

def infrastructure(kind):
 if kind=='bridge-span':
  box('RF_BridgeDeck',(0,0,.4),(7.4,24,.7),'stone')
  for side in [-1,1]:
   box('RF_BridgeGirder',(side*3.5,0,1.2),(.18,24,2.4),'metal')
   for y in [-10,-6,-2,2,6,10]:beam('RF_Truss',(side*3.5,y,.15),(side*3.5,y+3.8,2.4),.12,'metal')
  empty('span_start',(0,-12,0));empty('span_end',(0,12,0))
 elif kind=='tunnel-portal':
  for x in [-4.5,4.5]:box('RF_PortalSide',(x,0,3.4),(2,2,6.8),'stone')
  for i in range(8 if LOD else 14):a=i*math.pi/(7 if LOD else 13);box('RF_ArchBlock',(math.cos(a)*3.6,0,5+math.sin(a)*3.2),(1.0,2,1.25),'stone',(0,-a,0))
  empty('track_center')
 elif kind=='water-tower':
  for x,y in [(-2,-2),(-2,2),(2,-2),(2,2)]:beam('RF_TankLeg',(x,y,0),(x,y,7),.2,'wood')
  cyl('RF_Tank',(0,0,8),3,3,'wood');cyl('RF_TankBand',(0,0,7),3.06,.16,'metal');cyl('RF_TankBand',(0,0,9),3.06,.16,'metal');beam('RF_WaterPipe',(2.5,0,7),(5,0,7),.15,'metal')
 elif kind=='signal':
  cyl('RF_SignalPost',(0,0,3),.13,6,'trim');box('RF_Semaphore',(1,0,5.6),(2.2,.2,.3),'red');cyl('RF_SignalLamp',(0,-.15,5),.3,.2,'black',(math.pi/2,0,0))
 else:
  for y in [-3,0,3]:box('RF_FencePost',(0,y,.7),(.2,.2,1.4),'wood')
  for z in [.45,1.0]:box('RF_FenceRail',(0,0,z),(.12,6.3,.14),'wood')
 empty('ground_origin')

def prop(kind):
 if kind in ['cart','truck']:
  length=4.2 if kind=='truck' else 3;box('RF_RoadChassis',(0,0,.8),(1.8,length,.22),'black');wheels(length,r=.42)
  box('RF_CargoBed',(0,-.5,1.2),(1.85,length*.65,.55),'wood')
  if kind=='truck':box('RF_TruckCab',(0,1.2,1.8),(1.9,1.5,2),'red');window(0,1.98,2.1,'y',1.4,.8);box('RF_Bonnet',(0,2.3,1.35),(1.6,.8,.85),'red')
  else:beam('RF_CartShaft',(-.7,1,1),(-.7,3,1),.07,'wood');beam('RF_CartShaft',(.7,1,1),(.7,3,1),.07,'wood')
 elif kind=='barge':
  box('RF_Hull',(0,0,1.1),(6,24,2.2),'black');box('RF_Deck',(0,0,2.1),(5.6,23,.3),'wood');box('RF_BargeCabin',(0,-8,3.4),(4,4,2.6),'trim');window(0,-5.9,3.6,'y',2,1.2)
  for y in [-4,2,7]:box('RF_CargoCrate',(0,y,2.8),(4,3.5,1.3),'wood')
 elif kind=='lighthouse':
  cyl('RF_LighthouseTower',(0,0,10),2.5,20,'plaster');cyl('RF_LanternWalk',(0,0,20),3.0,.35,'stone');cyl('RF_Lantern',(0,0,21),1.8,1.8,'glass');cyl('RF_LanternRoof',(0,0,22),2.1,.3,'roof')
 elif kind=='castle':
  box('RF_CastleKeep',(0,0,8),(10,10,16),'stone');roof(0,0,10,10,16,6)
  for x in [-7,7]:cyl('RF_CastleTurret',(x,0,6),2.1,12,'stone')
  box('RF_CastleWall',(0,-5,3),(18,2,6),'stone')
  for x in [-6,-3,0,3,6]:box('RF_Crenellation',(x,-5,6.5),(1.4,2,1.0),'stone')
 elif kind=='church':
  building('stone-house','rhine');box('RF_ChurchTower',(0,8,9),(5,5,18),'stone');roof(0,8,5,5,18,6)
 elif kind=='rock':
  ellipsoid('RF_Rock',(0,0,2.2),(3.4,2.5,2.2),'stone',1);ellipsoid('RF_Rock',(2.3,.6,1.3),(1.9,1.8,1.3),'stone',0)
 else:
  for i in range(3):box('RF_Crate',((i%2)*1.2,(i//2)*1.2,.6),(1.1,1.1,1.2),'wood')
 empty('ground_origin')

def export(region,asset_id,kind,builder,required=None):
 global LOD
 out=ROOT/f'assets/runtime/models/{region}';out.mkdir(parents=True,exist_ok=True);lods=[]
 for lod in [0,1]:
  LOD=lod;random.seed(1773);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);builder()
  if lod==0: # Small hardware deliberately disappears in the distant LOD.
   box('RF_DetailBolt',(0,0,.12),(.06,.06,.06),'metal')
  filename=asset_id+f'_lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(out/filename),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
  lods.append({'path':f'/models/{region}/{filename}','maxTriangles':18000 if lod==0 else 8500,'maxBytes':1500000})
 return {'id':asset_id,'kind':kind,'requiredNodes':required or ['ground_origin'],'maxDimensionsM':[40,45,45],'lods':lods}

for region in REGIONS:
 textures,bindings=materials(region);assets=[]
 if region=='arizona':
  assets.append(export(region,'arizona-windpump','infrastructure',windpump,['ground_origin','rotor_center']))
  for kind in ['creosote','sage','grass','saguaro','prickly-pear','yucca','juniper','mesquite']:assets.append(export(region,'arizona-'+kind,'vegetation',lambda k=kind:vegetation(k)))
  assets.append(export(region,'arizona-ranch-fence','infrastructure',lambda:infrastructure('fence')))
 else:
  for style in ['half-timber','stone-house','brick-house','terrace','villa','barn','shop']:assets.append(export(region,region+'-'+style,'building',lambda s=style:building(s,region),['ground_origin','footprint_nw','footprint_se','entrance','entrance_outward']))
  for era,suffix in [('heritage',''),('interwar','-interwar'),('modern','-modern')]:assets.append(export(region,region+'-station'+suffix,'station',lambda e=era:station(region,e),['platform_origin','track_side','public_entrance','roof_ridge','roof_eave_left','roof_eave_right']))
  for kind in ['mine','factory','warehouse','crane']:assets.append(export(region,region+'-'+kind,'building',lambda k=kind:industry(k)))
  for kind in ['oak','beech','birch','willow','pine','hedge','grass','vine' if region=='rhine' else 'gorse']:assets.append(export(region,region+'-'+kind,'vegetation',lambda k=kind:vegetation(k)))
  for kind in ['bridge-span','tunnel-portal','water-tower','signal','fence']:assets.append(export(region,region+'-'+kind,'infrastructure',lambda k=kind:infrastructure(k),['span_start','span_end'] if kind=='bridge-span' else ['track_center'] if kind=='tunnel-portal' else ['ground_origin']))
  for kind in ['cart','truck','barge','church','castle' if region=='rhine' else 'lighthouse','crates','rock']:assets.append(export(region,region+'-'+kind,'rock' if kind=='rock' else 'building',lambda k=kind:prop(k)))
  names=['g3','p8','v100','e10'] if region=='rhine' else ['j21','a3','class37','class91']
  for name,kind,length in zip(names,['steam-freight','steam-passenger','diesel','electric'],[16.0,19.0,15.0 if region=='rhine' else 18.7,16.5 if region=='rhine' else 19.4]):assets.append(export(region,region+'-'+name,'vehicle',lambda k=kind,l=length:train(k,region,l),['coupler_front','coupler_rear','forward_probe','up_probe']))
  for kind,length in [('coach',12.4),('modern-coach',22),('mail',11),('coal',8.5),('hopper',11),('goods',10),('flat',12),('tank',11)]:assets.append(export(region,region+'-'+kind,'vehicle',lambda k=kind,l=length:train(k,region,l),['coupler_front','coupler_rear','forward_probe','up_probe']))
 path=ROOT/f'assets/runtime/packs/{region}.json';previous=json.loads(path.read_text()) if path.exists() else {'version':1,'campaignId':'middle-rhine' if region=='rhine' else 'tyne-wear-coast','generator':{},'assets':[],'textures':[],'materialBindings':[]}
 ids={a['id'] for a in assets};previous['assets']=[a for a in previous['assets'] if a['id'] not in ids]+assets
 # Prefix tile IDs because Arizona already has its architecture textures.
 for t in textures:t['id']='regional-'+t['id']
 for b in bindings:
  for key in ['map','normalMap','roughnessMap']:b[key]='regional-'+b[key]
 previous['textures']=[t for t in previous.get('textures',[]) if not t['id'].startswith('regional-')]+textures;previous['materialBindings']=[b for b in previous.get('materialBindings',[]) if not b['materialPrefix'].startswith('RF_REG_')]+bindings;previous['generator'].update({'blender':bpy.app.version_string,'regionalScript':'tools/blender/generate_regional_catalogues.py'});previous['generator'].setdefault('script','tools/blender/generate_regional_catalogues.py');path.write_text(json.dumps(previous,indent=2)+'\n');print('REGIONAL_PACK',region,len(assets),flush=True)
