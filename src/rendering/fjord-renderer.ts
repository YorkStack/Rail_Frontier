import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GameState,MotionState,Vec3 } from '../domain/model.js';
import type { MapOverlay,WorldRenderer,WorldSelection } from '../application/ports.js';
import type { Heightfield } from '../world/terrain.js';
import { fjordProfile,type BiomeDefinition } from '../world/profiles.js';
import { norwayBiome } from '../world/biome.js';
import { SeededRandom } from '../world/random.js';
import { shorelineX } from '../world/fjord-study.js';
import { norwayCorridorX,norwayShorelineX } from '../world/generator.js';
import { compileGraph } from '../rail/graph.js';
import { motionPosition } from '../simulation/motion.js';
import { terrainMesh } from './terrain-mesh.js';
import { createTrack } from './track-mesh.js';
import { sampleDistance,type TrackGeometry } from '../rail/geometry.js';
import { vehicleDefinition } from '../content/vehicles.js';
import { stationDefinition } from '../content/stations.js';
import { industryName } from '../content/industries.js';

export interface RenderStats { calls:number;triangles:number;geometries:number;textures:number;trees:number;buildings:number;trains:number;lod:number;terrainErrorM:number;contextLost:boolean }
export interface AssetReport { name:string;lod:number;sizeM:number[];normalsFinite:boolean;materials:number;triangles:number }
interface PackAsset {id:string;kind:'vehicle'|'station'|'building'|'vegetation'|'infrastructure';lods:{path:string}[]}
interface PackManifest {version:number;campaignId:string;assets:PackAsset[]}
export class FjordRenderer implements WorldRenderer {
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(42,1,.5,50000);
  readonly renderer:THREE.WebGLRenderer;
  readonly controls:OrbitControls;
  readonly landscape:THREE.Mesh;
  readonly assets:AssetReport[]=[];
  readonly labels:{name:string;position:Vec3;selection:WorldSelection}[];
  readonly terrain:Heightfield;
  readonly profile:BiomeDefinition;
  private geometry:ReturnType<typeof compileGraph>;
  private railwayRevision:number;
  private railwaySignature:string;
  private trackGroup=new THREE.Group();
  private assetLevels=new Map<string,THREE.Object3D[]>();
  private assetLibrary=new THREE.Group();
  private trainModels=new Map<string,{group:THREE.Group;cars:THREE.LOD[];signature:string}>();
  private stationModels=new Map<string,THREE.LOD>();
  private infrastructureModels=new THREE.Group();
  private modelState:Readonly<GameState>;
  private water:THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
  private waterfall:THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;
  private trees:THREE.Group;
  private buildings=new THREE.Group();
  private preview:THREE.Object3D|null=null;
  private marker:THREE.Object3D|null=null;
  private selectionMarker:THREE.Object3D|null=null;
  private selection:WorldSelection|null=null;
  private overlay=new THREE.Group();
  private overlayKind:MapOverlay='none';
  private overlaySignature='';
  private trainPosition=new THREE.Vector3();
  private follow=false;
  private treeCount=0;
  private buildingCount=0;
  private terrainErrorM=0;
  private stressTrains:THREE.InstancedMesh|null=null;
  private stressTrack:THREE.LineSegments|null=null;
  private stressCount=1;
  private readonly onResize=()=>this.resize();
  private readonly keys=new Set<string>();
  private readonly keyDown=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement)return;this.keys.add(event.code);};
  private readonly keyUp=(event:KeyboardEvent)=>this.keys.delete(event.code);
  private readonly clearKeys=()=>this.keys.clear();
  private readonly controlStart=()=>{this.follow=false;};

  constructor(private readonly canvas:HTMLCanvasElement,terrain:Heightfield,state:GameState) {
    this.terrain=terrain;this.profile=state.world.biomeId===norwayBiome.id?norwayBiome:fjordProfile;this.modelState=state;this.geometry=compileGraph(state.railway);this.railwayRevision=state.railway.revision;this.railwaySignature=railwayKey(state);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    const scale=terrainSize(terrain)/4000;this.scene.background=new THREE.Color(this.profile.palette.haze);this.scene.fog=new THREE.FogExp2(this.profile.palette.haze,.00018/scale);
    const sun=new THREE.DirectionalLight(this.profile.lighting.sunColor,this.profile.lighting.sunIntensity);sun.position.set(-1200*scale,2600*scale,1400*scale);sun.target.position.set(terrain.widthM*.45,0,terrain.depthM*.45);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-2100*scale;sun.shadow.camera.right=2100*scale;sun.shadow.camera.top=2100*scale;sun.shadow.camera.bottom=-2100*scale;sun.shadow.camera.far=7000*scale;sun.shadow.normalBias=3;
    this.scene.add(sun,sun.target,new THREE.HemisphereLight(this.profile.lighting.skyColor,this.profile.lighting.groundColor,2.1));
    this.landscape=terrainMesh(terrain,this.profile);this.scene.add(this.landscape);
    this.water=this.createWater();this.scene.add(this.water);
    this.waterfall=this.createWaterfall();this.scene.add(this.waterfall);
    this.rebuildTracks(state);
    this.trees=this.createForest(this.profile.vegetation.density);this.scene.add(this.trees);
    this.createBuildings(state,terrain.widthM>4000?360:90);this.scene.add(this.buildings);this.assetLibrary.visible=false;this.scene.add(this.assetLibrary);
    this.createPortals();this.createBridgeTrusses();this.scene.add(this.infrastructureModels);
    this.labels=[
      ...state.towns.map(town=>({name:town.name,position:town.position,selection:{kind:'town' as const,id:town.id}})),
      ...state.industries.map(industry=>({name:industryName(industry.definitionId),position:industry.position,selection:{kind:'industry' as const,id:industry.id}}))
    ];
    this.scene.add(this.overlay);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.075;
    this.controls.minDistance=18;this.controls.maxDistance=terrainSize(terrain)*1.45;this.controls.maxPolarAngle=Math.PI*.475;this.controls.minPolarAngle=.15;this.controls.screenSpacePanning=false;
    this.controls.addEventListener('start',this.controlStart);
    this.regional();this.resize();window.addEventListener('resize',this.onResize);
    window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.clearKeys);
    this.verifyTerrain();
  }
  async loadAssets():Promise<void> {
    const response=await fetch('/packs/norway.json');if(!response.ok)throw new Error('Norway asset manifest could not be loaded');
    const manifest=await response.json() as PackManifest;if(manifest.version!==1||manifest.campaignId!==this.modelState.campaignId||!Array.isArray(manifest.assets))throw new Error('Norway asset manifest is incompatible');
    const loader=new GLTFLoader(),loadedAssets=await Promise.all(manifest.assets.map(async asset=>({asset,loaded:await Promise.all(asset.lods.map(lod=>loader.loadAsync(lod.path)))})));
    for(const {asset,loaded} of loadedAssets) {
      if(asset.lods.length!==2)throw new Error(`Asset ${asset.id} is missing an LOD`);
      const levels:THREE.Object3D[]=[];
      for(let lod=0;lod<loaded.length;lod++) {
        const group=loaded[lod]!.scene;group.updateMatrixWorld(true);const dimensions=new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());let normalsFinite=true,triangles=0;const materials=new Set<THREE.Material>();
        group.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;const normal=object.geometry.getAttribute('normal');if(!normal)normalsFinite=false;else for(let index=0;index<normal.count;index++)if(!Number.isFinite(normal.getX(index)+normal.getY(index)+normal.getZ(index)))normalsFinite=false;triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3;for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);}});
        if(!normalsFinite)throw new Error(`Asset ${asset.id} has invalid normals`);this.assets.push({name:asset.id,lod,sizeM:dimensions.toArray(),normalsFinite,materials:materials.size,triangles});levels.push(group);this.assetLibrary.add(group);
      }
      if(asset.kind==='vehicle') {const front=levels[0]!.getObjectByName('forward_probe')?.getWorldPosition(new THREE.Vector3()),up=levels[0]!.getObjectByName('up_probe')?.getWorldPosition(new THREE.Vector3());if(!front||!up||front.z>=0||Math.abs(up.y-2)>.001)throw new Error(`Asset ${asset.id} has invalid runtime axes`);}
      this.assetLevels.set(asset.id,levels);
    }
    this.replaceAuthoredScenery(this.modelState);this.rebuildAuthoredInfrastructure(this.modelState);this.syncTrainModels(this.modelState);this.syncStationModels(this.modelState);
  }
  private cloneLod(id:string,distance=180):THREE.LOD {const levels=this.assetLevels.get(id);if(!levels)throw new Error(`Missing runtime asset: ${id}`);const lod=new THREE.LOD();levels.forEach((level,index)=>lod.addLevel(level.clone(true),index===0?0:distance,.15));return lod;}
  private syncTrainModels(state:Readonly<GameState>):void {if(this.assetLevels.size===0)return;for(const model of this.trainModels.values())model.group.visible=false;for(const train of state.trains){const signature=[train.locomotiveId,...train.vehicleIds].join('|'),existing=this.trainModels.get(train.id);if(existing&&existing.signature!==signature){this.scene.remove(existing.group);this.trainModels.delete(train.id);}if(!this.trainModels.has(train.id)){const group=new THREE.Group(),cars=[this.cloneLod(train.locomotiveId),...train.vehicleIds.map(id=>this.cloneLod(id))];group.userData.selection={kind:'train',id:train.id} satisfies WorldSelection;for(const car of cars)group.add(car);this.scene.add(group);this.trainModels.set(train.id,{group,cars,signature});}this.trainModels.get(train.id)!.group.visible=true;}}
  private behind(motion:MotionState,distanceM:number):{position:Vec3;ahead:Vec3} {let leg=motion.leg,distance=motion.distanceM-distanceM;while(distance<0&&leg>0){leg--;distance+=this.geometry.get(motion.path[leg]!.edgeId)!.lengthM;}distance=Math.max(0,distance);const sample=(offset:number)=>{let sampleLeg=leg,s=distance+offset;while(sampleLeg<motion.path.length-1&&s>this.geometry.get(motion.path[sampleLeg]!.edgeId)!.lengthM){s-=this.geometry.get(motion.path[sampleLeg]!.edgeId)!.lengthM;sampleLeg++;}const traversal=motion.path[sampleLeg]!,geometry=this.geometry.get(traversal.edgeId)!;return sampleDistance(geometry,traversal.reverse?geometry.lengthM-Math.min(s,geometry.lengthM):Math.min(s,geometry.lengthM));};return {position:sample(0),ahead:sample(.25)};}
  private updateTrainModels(state:Readonly<GameState>):void {this.syncTrainModels(state);for(const train of state.trains){const model=this.trainModels.get(train.id);if(!model)continue;let offset=0,previousLength=vehicleDefinition(train.locomotiveId)?.lengthM??15.2;for(let index=0;index<model.cars.length;index++){if(index>0){const length=vehicleDefinition(train.vehicleIds[index-1]!)?.lengthM??12;offset+=previousLength/2+length/2+.6;previousLength=length;}const {position,ahead}=this.behind(train.motion,offset),car=model.cars[index]!;car.position.set(position.x,position.y+.12,position.z);car.rotation.y=Math.atan2(-(ahead.x-position.x),-(ahead.z-position.z));}model.group.visible=true;}}
  private instancedAsset(id:string,lod:number,placements:THREE.Matrix4[]):THREE.Group {
    const source=this.assetLevels.get(id)?.[lod];if(!source)throw new Error(`Missing instanced asset: ${id}`);source.updateMatrixWorld(true);const group=new THREE.Group();
    source.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const instances=new THREE.InstancedMesh(object.geometry,object.material,placements.length);placements.forEach((placement,index)=>instances.setMatrixAt(index,placement.clone().multiply(object.matrixWorld)));instances.castShadow=true;instances.receiveShadow=true;instances.computeBoundingSphere();group.add(instances);});return group;
  }
  private authoredForest(count:number):THREE.Group {
    const random=new SeededRandom(708),placements:THREE.Matrix4[]=[],dummy=new THREE.Object3D();
    for(let tries=0;placements.length<count&&tries<count*30;tries++) {const x=random.next()*this.terrain.widthM,z=random.next()*this.terrain.depthM,y=this.terrain.sample(x,z).elevationM,corridor=norwayCorridorX(z);if(y<10||y>this.profile.vegetation.treelineM||Math.abs(x-corridor)<24||Math.abs(z-6100)<24)continue;const scale=.72+random.next()*.62;dummy.position.set(x,y,z);dummy.rotation.set(0,random.next()*Math.PI*2,0);dummy.scale.setScalar(scale);dummy.updateMatrix();placements.push(dummy.matrix.clone());}
    this.treeCount=placements.length;return this.instancedAsset('norway-spruce',1,placements);
  }
  private authoredBuildings(state:Readonly<GameState>,count:number):THREE.Group {
    const random=new SeededRandom(144),placements:THREE.Matrix4[]=[],dummy=new THREE.Object3D();
    for(let index=0;index<count;index++){const town=state.towns[index%state.towns.length]!;let x=town.position.x,z=town.position.z;for(let attempt=0;attempt<24;attempt++){const angle=random.next()*Math.PI*2,radius=Math.sqrt(random.next())*400;x=Math.max(2,Math.min(this.terrain.widthM-2,town.position.x+Math.cos(angle)*radius));z=Math.max(2,Math.min(this.terrain.depthM-2,town.position.z+Math.sin(angle)*radius));if(Math.abs(x-norwayCorridorX(z))>58)break;}dummy.position.set(x,Math.max(.5,this.terrain.sample(x,z).elevationM),z);dummy.rotation.set(0,Math.round(random.next()*3)*Math.PI/2,0);dummy.scale.setScalar(.72+random.next()*.48);dummy.updateMatrix();placements.push(dummy.matrix.clone());}
    this.buildingCount=count;return this.instancedAsset('norway-house',0,placements);
  }
  private replaceAuthoredScenery(state:Readonly<GameState>):void {
    this.scene.remove(this.trees);disposeObject(this.trees);this.trees=this.authoredForest(this.profile.vegetation.density);this.scene.add(this.trees);
    this.scene.remove(this.buildings);disposeObject(this.buildings);this.buildings=this.authoredBuildings(state,360);this.scene.add(this.buildings);
  }
  private syncStationModels(state:Readonly<GameState>):void {
    if(!this.assetLevels.has('norway-station'))return;for(const model of this.stationModels.values())model.visible=false;
    for(const station of state.stations){if(!this.stationModels.has(station.id)){const model=this.cloneLod('norway-station',260);model.userData.selection={kind:'station',id:station.id} satisfies WorldSelection;this.scene.add(model);this.stationModels.set(station.id,model);}const model=this.stationModels.get(station.id)!,node=state.railway.nodes.find(candidate=>candidate.id===station.nodeId),edge=state.railway.edges.find(candidate=>candidate.from===station.nodeId||candidate.to===station.nodeId);if(!node||!edge)continue;const otherId=edge.from===node.id?edge.to:edge.from,other=state.railway.nodes.find(candidate=>candidate.id===otherId);if(!other)continue;const yaw=Math.atan2(-(other.position.x-node.position.x),-(other.position.z-node.position.z));model.position.set(node.position.x+Math.cos(yaw)*4.2,node.position.y,node.position.z-Math.sin(yaw)*4.2);model.rotation.y=yaw;model.visible=true;}
  }
  private rebuildAuthoredInfrastructure(state:Readonly<GameState>):void {
    if(!this.assetLevels.has('norway-bridge-span'))return;this.scene.remove(this.infrastructureModels);disposeObject(this.infrastructureModels);this.infrastructureModels=new THREE.Group();
    const bridgePlacements:THREE.Matrix4[]=[],dummy=new THREE.Object3D();for(const [edgeId,infrastructure] of Object.entries(state.operations.infrastructure)){const track=this.geometry.get(edgeId as `edge:${number}`);if(!track)continue;for(const span of infrastructure.spans.filter(item=>item.kind==='bridge'))for(let distance=span.startM+12;distance<span.endM;distance+=24){const p=sampleDistance(track,Math.min(distance,span.endM)),q=sampleDistance(track,Math.min(distance+1,track.lengthM));dummy.position.set(p.x,p.y-.9,p.z);dummy.rotation.set(0,Math.atan2(-(q.x-p.x),-(q.z-p.z)),0);dummy.scale.setScalar(1);dummy.updateMatrix();bridgePlacements.push(dummy.matrix.clone());}}
    if(bridgePlacements.length>0)this.infrastructureModels.add(this.instancedAsset('norway-bridge-span',0,bridgePlacements));
    for(const track of this.geometry.values()){let inside=false;for(const sample of track.samples){const p=sample.position,buried=this.terrain.sample(p.x,p.z).elevationM>p.y+5;if(buried!==inside){inside=buried;const q=sampleDistance(track,Math.min(track.lengthM,sample.distanceM+1)),model=this.cloneLod('norway-tunnel-portal',280);model.position.set(p.x,p.y,p.z);model.rotation.y=Math.atan2(-(q.x-p.x),-(q.z-p.z));this.infrastructureModels.add(model);}}}
    this.scene.add(this.infrastructureModels);
  }
  private createWater():THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial> {
    const material=new THREE.ShaderMaterial({
      uniforms:{time:{value:0},deep:{value:new THREE.Color('#224e5a')},light:{value:new THREE.Color('#618a8b')}},
      vertexShader:'varying vec3 world; void main(){ vec4 p=modelMatrix*vec4(position,1.0); world=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
      fragmentShader:`uniform float time; uniform vec3 deep; uniform vec3 light; varying vec3 world;
        void main(){ float waves=sin(world.x*.065+world.z*.11+time*.8)*sin(world.x*.021-world.z*.043+time*.5);
        float streak=pow(max(0.0,sin(world.z*.12+world.x*.01+time*.7)),24.0)*.065;
        vec3 color=mix(deep,light,.18+waves*.10+streak); gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(terrainSize(this.terrain),terrainSize(this.terrain)),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(this.terrain.widthM/2,.15,this.terrain.depthM/2);return mesh;
  }
  private createWaterfall():THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial> {
    const production=this.terrain.widthM>4000,z=production?6100:2470,shore=(value:number)=>production?norwayShorelineX(value,140919):shorelineX(value),positions:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let i=0;i<=80;i++) {
      const x=shore(z)+(production?620:260)-i*(production?7.5:3.5);
      for(const side of [-1,1]) {const sampleZ=z+side*(5+3*Math.sin(i/80*Math.PI));positions.push(x,Math.max(.6,this.terrain.sample(x,sampleZ).elevationM+1.3),sampleZ);uv.push((side+1)/2,1-i/80);}
      if(i>0){const a=(i-1)*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv; uniform float time; void main(){float streak=.65+.35*sin(vUv.x*80.0+sin(vUv.y*15.0-time*6.0));float fade=sin(vUv.x*3.14159);gl_FragColor=vec4(.76,.91,.91,fade*streak*.86);}`});
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);return new THREE.Mesh(geometry,material);
  }
  private createForest(count:number):THREE.Group {
    const group=new THREE.Group(),random=new SeededRandom(708),mat=new THREE.MeshStandardMaterial({color:'#e7eedc',roughness:1});
    const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5,1),mat,count),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.07,1,4),new THREE.MeshStandardMaterial({color:'#574d39'}),count),dummy=new THREE.Object3D(),color=new THREE.Color();
    let placed=0;
    for(let tries=0;placed<count&&tries<count*30;tries++) {
      const x=random.next()*this.terrain.widthM,z=random.next()*this.terrain.depthM,y=this.terrain.sample(x,z).elevationM;
      const production=this.terrain.widthM>4000,corridor=production?norwayCorridorX(z):shorelineX(z)+75;
      if(y<10||y>this.profile.vegetation.treelineM||Math.abs(x-corridor)<24||Math.abs(z-(production?6100:2470))<24)continue;
      const h=9+random.next()*15;dummy.position.set(x,y+h*.58,z);dummy.rotation.set(0,random.next()*Math.PI*2,0);dummy.scale.set(h*.27,h,h*.27);dummy.updateMatrix();crowns.setMatrixAt(placed,dummy.matrix);
      color.setHSL(.27+random.next()*.08,.22+random.next()*.2,.18+random.next()*.12);crowns.setColorAt(placed,color);
      dummy.position.y=y+h*.3;dummy.scale.set(h,h*.6,h);dummy.updateMatrix();trunks.setMatrixAt(placed,dummy.matrix);placed++;
    }
    crowns.count=trunks.count=placed;crowns.castShadow=true;crowns.computeBoundingSphere();trunks.computeBoundingSphere();group.add(crowns,trunks);this.treeCount=placed;return group;
  }
  private createBuildings(state:GameState,count:number):void {
    const random=new SeededRandom(144),dummy=new THREE.Object3D();
    const body=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.9}),count);
    const roof=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,4),new THREE.MeshStandardMaterial({color:'#484f4b',roughness:1}),count);
    const palettes=['#b04f3d','#e2dac0','#be914f','#8b392e','#b8c0b4'];
    for(let i=0;i<count;i++) {
      const town=state.towns[i%state.towns.length]!;let x=town.position.x,z=town.position.z;
      for(let attempt=0;attempt<24;attempt++){const angle=random.next()*Math.PI*2,radius=Math.sqrt(random.next())*(count>100?400:95);x=Math.max(2,Math.min(this.terrain.widthM-2,town.position.x+Math.cos(angle)*radius));z=Math.max(2,Math.min(this.terrain.depthM-2,town.position.z+Math.sin(angle)*radius));if(this.terrain.widthM<=4000||Math.abs(x-norwayCorridorX(z))>58)break;}
      const y=Math.max(.5,this.terrain.sample(x,z).elevationM);
      const w=7+random.next()*5,h=6+random.next()*7,d=9+random.next()*7,rotation=Math.round(random.next()*3)*Math.PI/2;
      dummy.position.set(x,y+h/2,z);dummy.rotation.set(0,rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);body.setColorAt(i,new THREE.Color(palettes[i%palettes.length]!));
      dummy.position.y=y+h+2;dummy.rotation.y=rotation+Math.PI/4;dummy.scale.set(w*.82,5,d*.82);dummy.updateMatrix();roof.setMatrixAt(i,dummy.matrix);
    }
    body.castShadow=true;roof.castShadow=true;body.computeBoundingSphere();roof.computeBoundingSphere();this.buildings.add(body,roof);this.buildingCount=count;
  }
  private createPortals():void {
    const material=new THREE.MeshStandardMaterial({color:'#a4a497',roughness:1});
    // Find actual tunnel transitions on the authoritative profile, then place open arch geometry.
    let inside=false;
    for(const geometry of this.geometry.values())for(const sample of geometry.samples){const p=sample.position,buried=this.terrain.sample(p.x,p.z).elevationM>p.y+5;
      if(buried!==inside){inside=buried;const q=sampleDistance(geometry,Math.min(geometry.lengthM,sample.distanceM+1)),portal=new THREE.Group();
        for(const x of [-3.3,3.3]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(1.5,5,3),material);pillar.position.set(x,2.1,0);portal.add(pillar);}
        const arch=new THREE.Mesh(new THREE.TorusGeometry(3.3,.8,5,14,Math.PI),material);arch.position.y=4.6;portal.add(arch);portal.position.set(p.x,p.y,p.z);portal.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);this.infrastructureModels.add(portal);
      }
    }
  }
  private createBridgeTrusses():void {
    const material=new THREE.MeshStandardMaterial({color:'#314f4b',roughness:.65,metalness:.35});
    const bars:THREE.Matrix4[]=[],dummy=new THREE.Object3D(),axis=new THREE.Vector3(0,1,0);
    const add=(a:THREE.Vector3,b:THREE.Vector3,width:number)=>{const direction=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(axis,direction.clone().normalize());dummy.scale.set(width,direction.length(),width);dummy.updateMatrix();bars.push(dummy.matrix.clone());};
    for(const track of this.geometry.values())for(let s=8;s<track.lengthM-8;s+=12){const p=sampleDistance(track,s),q=sampleDistance(track,s+12);if(this.terrain.sample(p.x,p.z).elevationM>0)continue;
      for(const side of [-3,3]) {const a=new THREE.Vector3(p.x+side,p.y,p.z),b=new THREE.Vector3(q.x+side,q.y,q.z);add(a.clone().add(new THREE.Vector3(0,5,0)),b.clone().add(new THREE.Vector3(0,5,0)),.38);add(a,b,.5);add(a,b.clone().add(new THREE.Vector3(0,5,0)),.3);add(a,a.clone().add(new THREE.Vector3(0,5,0)),.3);}
    }
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,bars.length);bars.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();this.infrastructureModels.add(mesh);
  }
  setPreview(geometry:TrackGeometry|null,color='#edc879'):void {
    if(this.preview){this.scene.remove(this.preview);disposeObject(this.preview);this.preview=null;}
    if(!geometry)return;
    const points=geometry.samples.map(s=>new THREE.Vector3(s.position.x,s.position.y+.6,s.position.z));
    this.preview=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,depthTest:false}));this.preview.renderOrder=10;this.scene.add(this.preview);
  }
  setMarker(position:Vec3|null,color='#edc879'):void {
    if(this.marker){this.scene.remove(this.marker);disposeObject(this.marker);this.marker=null;}
    if(!position)return;
    const group=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(9,.7,8,36),new THREE.MeshBasicMaterial({color,depthTest:false})),pin=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,16,8),new THREE.MeshBasicMaterial({color,depthTest:false}));ring.rotation.x=Math.PI/2;pin.position.y=8;group.add(ring,pin);group.position.set(position.x,position.y+1.2,position.z);group.renderOrder=11;this.marker=group;this.scene.add(group);
  }
  setSelection(selection:WorldSelection|null,state:Readonly<GameState>):void {
    this.selection=selection;
    if(this.selectionMarker){this.scene.remove(this.selectionMarker);disposeObject(this.selectionMarker);this.selectionMarker=null;}
    if(!selection)return;
    const group=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(13,.7,8,48),new THREE.MeshBasicMaterial({color:'#f1d78d',depthTest:false})),pin=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,22,8),new THREE.MeshBasicMaterial({color:'#f1d78d',transparent:true,opacity:.8,depthTest:false}));ring.rotation.x=Math.PI/2;pin.position.y=11;group.add(ring,pin);group.renderOrder=12;this.selectionMarker=group;this.scene.add(group);this.syncSelectionMarker(state);
  }
  private selectionPosition(state:Readonly<GameState>):Vec3|null {
    if(!this.selection)return null;
    if(this.selection.kind==='town')return state.towns.find(item=>item.id===this.selection!.id)?.position??null;
    if(this.selection.kind==='industry')return state.industries.find(item=>item.id===this.selection!.id)?.position??null;
    if(this.selection.kind==='station'){const station=state.stations.find(item=>item.id===this.selection!.id);return state.railway.nodes.find(item=>item.id===station?.nodeId)?.position??null;}
    const train=state.trains.find(item=>item.id===this.selection!.id);return train?motionPosition(train.motion,this.geometry):null;
  }
  private syncSelectionMarker(state:Readonly<GameState>):void {const position=this.selectionPosition(state);if(!this.selectionMarker||!position)return;this.selectionMarker.position.set(position.x,position.y+1.5,position.z);}
  private syncLabels(state:Readonly<GameState>):void {let townIndex=0,industryIndex=0;for(const label of this.labels){if(label.selection.kind==='town'){const town=state.towns[townIndex++];if(town){label.name=town.name;label.position=town.position;label.selection={kind:'town',id:town.id};}}else{const industry=state.industries[industryIndex++];if(industry){label.name=industryName(industry.definitionId);label.position=industry.position;label.selection={kind:'industry',id:industry.id};}}}}
  focusSelection(selection:WorldSelection,state:Readonly<GameState>):void {this.selection=selection;const position=this.selectionPosition(state);if(position)this.focus(position);}
  setOverlay(kind:MapOverlay,state:Readonly<GameState>):void {this.overlayKind=kind;this.overlaySignature='';this.syncOverlay(state);}
  private syncOverlay(state:Readonly<GameState>):void {
    const signature=this.overlayKind==='traffic'?state.operations.reservations.map(item=>`${item.edgeId}:${item.trainId}`).join('|'):this.overlayKind==='catchment'?`${state.railway.revision}|${state.stations.map(item=>`${item.id}:${item.classId}:${item.nodeId}`).join('|')}`:this.overlayKind==='industry'?state.industries.map(item=>`${item.id}:${item.definitionId}`).join('|'):'none';
    if(signature===this.overlaySignature)return;this.overlaySignature=signature;this.scene.remove(this.overlay);disposeObject(this.overlay);this.overlay=new THREE.Group();
    const line=(points:THREE.Vector3[],color:string,opacity=.9,closed=false)=>{const material=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,depthTest:false,vertexColors:false}),object=new THREE.Line(new THREE.BufferGeometry().setFromPoints(closed?[...points,points[0]!.clone()]:points),material);object.renderOrder=8;this.overlay.add(object);};
    const circle=(position:Vec3,radius:number,color:string)=>{const points=Array.from({length:64},(_,index)=>{const angle=index/64*Math.PI*2,x=position.x+Math.cos(angle)*radius,z=position.z+Math.sin(angle)*radius;return new THREE.Vector3(x,this.terrain.sample(x,z).elevationM+2,z);});line(points,color,.82,true);};
    if(this.overlayKind==='catchment')for(const station of state.stations){const node=state.railway.nodes.find(item=>item.id===station.nodeId),radius=stationDefinition(station.classId)?.coverageRadiusM;if(node&&radius)circle(node.position,radius,'#e7cf87');}
    if(this.overlayKind==='industry')for(const industry of state.industries){const color=industry.definitionId==='forest'?'#91bd79':'#d79b68';circle(industry.position,150,color);line([new THREE.Vector3(industry.position.x,industry.position.y+2,industry.position.z),new THREE.Vector3(industry.position.x,industry.position.y+95,industry.position.z)],color);}
    if(this.overlayKind==='traffic'){const reserved=new Set(state.operations.reservations.map(item=>item.edgeId));for(const [edgeId,track] of this.geometry){const points=track.samples.map(sample=>new THREE.Vector3(sample.position.x,sample.position.y+1.8,sample.position.z));line(points,reserved.has(edgeId)?'#ed8b68':'#93a99a',reserved.has(edgeId)?1:.42);}}
    this.scene.add(this.overlay);
  }
  setStress(state:GameState,enabled:boolean):void {
    this.scene.remove(this.trees);disposeObject(this.trees);this.trees=this.assetLevels.has('norway-spruce')?this.authoredForest(enabled?20000:this.profile.vegetation.density):this.createForest(enabled?20000:this.profile.vegetation.density);this.scene.add(this.trees);
    this.scene.remove(this.buildings);disposeObject(this.buildings);this.buildings=new THREE.Group();if(this.assetLevels.has('norway-house'))this.buildings=this.authoredBuildings(state,enabled?2000:360);else this.createBuildings(state,enabled?2000:90);this.scene.add(this.buildings);
    if(this.stressTrains){this.scene.remove(this.stressTrains);disposeObject(this.stressTrains);this.stressTrains=null;}
    if(this.stressTrack){this.scene.remove(this.stressTrack);disposeObject(this.stressTrack);this.stressTrack=null;}
    this.stressCount=enabled?100:1;
    if(enabled) {
      this.stressTrains=new THREE.InstancedMesh(new THREE.BoxGeometry(2.8,3.2,10),new THREE.MeshStandardMaterial({color:'#b24c37'}),99);this.stressTrains.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.stressTrains.frustumCulled=false;this.scene.add(this.stressTrains);
      const positions:number[]=[];
      for(let i=0;i<5000;i++){const x=200+(i%100)*32,z=200+Math.floor(i/100)*65,y=Math.max(4,this.terrain.sample(x,z).elevationM)+1;positions.push(x,y,z,x+25,y,z+10);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.stressTrack=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#bba784'}));this.scene.add(this.stressTrack);
    }
  }
  setTrees(visible:boolean):void {this.trees.visible=visible;}
  private rebuildTracks(state:Readonly<GameState>):void {
    this.scene.remove(this.trackGroup);disposeObject(this.trackGroup);this.trackGroup=new THREE.Group();
    this.geometry=compileGraph(structuredClone(state.railway));this.railwayRevision=state.railway.revision;this.railwaySignature=railwayKey(state);
    for(const track of this.geometry.values())this.trackGroup.add(createTrack(track,this.terrain));
    this.scene.add(this.trackGroup);if(this.assetLevels.size>0)this.rebuildAuthoredInfrastructure(state);
  }
  focus(position:Vec3):void {this.follow=false;this.controls.target.set(position.x,position.y,position.z);this.camera.position.set(position.x+160,position.y+110,position.z+190);this.controls.update();}
  followTrain():void {this.focus(this.trainPosition);this.camera.position.copy(this.trainPosition).add(new THREE.Vector3(35,21,45));this.follow=true;}
  regional():void {this.follow=false;const production=this.terrain.widthM>4000;this.controls.target.set(production?5200:1850,production?180:80,production?5600:1970);this.camera.position.set(production?13000:3500,production?6500:1750,production?14500:3900);this.controls.update();}
  resize():void {const {width,height}=this.canvas.getBoundingClientRect();this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  update(previous:Readonly<GameState>,current:Readonly<GameState>,alpha:number):void {
    this.modelState=current;this.syncLabels(current);if(current.railway.revision!==this.railwayRevision||railwayKey(current)!==this.railwaySignature)this.rebuildTracks(current);this.updateTrainModels(current);this.syncStationModels(current);
    this.syncOverlay(current);this.syncSelectionMarker(current);
    const old=this.trainPosition.clone(),lead=current.trains[0];if(lead){const b=motionPosition(lead.motion,this.geometry);this.trainPosition.set(b.x,b.y,b.z);}
    if(this.follow){const delta=this.trainPosition.clone().sub(old);this.controls.target.add(delta);this.camera.position.add(delta);}
    const shift=new THREE.Vector3((this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0),0,(this.keys.has('KeyS')?1:0)-(this.keys.has('KeyW')?1:0));
    if(shift.lengthSq()){shift.multiplyScalar(this.camera.position.distanceTo(this.controls.target)*.006);this.camera.position.add(shift);this.controls.target.add(shift);this.follow=false;}
    const {x,z}=this.camera.position;
    if(x>=0&&z>=0&&x<=this.terrain.widthM&&z<=this.terrain.depthM)this.camera.position.y=Math.max(this.camera.position.y,this.terrain.sample(x,z).elevationM+8);
    this.controls.update();
    this.water.material.uniforms.time!.value=current.tick*.05;
    this.waterfall.material.uniforms.time!.value=current.tick*.05;
    if(this.stressTrains){const dummy=new THREE.Object3D(),track=[...this.geometry.values()][1]!;for(let i=0;i<99;i++){const s=(i*11+current.tick*.9)%track.lengthM,p=sampleDistance(track,s),q=sampleDistance(track,Math.min(track.lengthM,s+1));dummy.position.set(p.x,p.y+1.6,p.z);dummy.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);dummy.updateMatrix();this.stressTrains.setMatrixAt(i,dummy.matrix);}this.stressTrains.instanceMatrix.needsUpdate=true;}
    this.renderer.render(this.scene,this.camera);
  }
  project(position:Vec3):{x:number;y:number;visible:boolean} {const vector=new THREE.Vector3(position.x,position.y+25,position.z).project(this.camera),rect=this.canvas.getBoundingClientRect();return {x:(vector.x+1)*rect.width/2,y:(1-vector.y)*rect.height/2,visible:vector.z>-1&&vector.z<1&&Math.abs(vector.x)<1&&Math.abs(vector.y)<1};}
  pick(screenX:number,screenY:number):Vec3|null {const rect=this.canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((screenX-rect.left)/rect.width*2-1,-(screenY-rect.top)/rect.height*2+1),this.camera);const point=ray.intersectObject(this.landscape)[0]?.point;return point?{x:point.x,y:point.y,z:point.z}:null;}
  pickEntity(screenX:number,screenY:number):WorldSelection|null {const rect=this.canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((screenX-rect.left)/rect.width*2-1,-(screenY-rect.top)/rect.height*2+1),this.camera);const roots=[...this.trainModels.values()].map(item=>item.group as THREE.Object3D).concat([...this.stationModels.values()]);for(const hit of ray.intersectObjects(roots,true)){let object:THREE.Object3D|null=hit.object;while(object){if(object.userData.selection)return object.userData.selection as WorldSelection;object=object.parent;}}return null;}
  private verifyTerrain():void {this.landscape.updateMatrixWorld(true);const scale=this.terrain.widthM/4000;for(const [x,z] of [[2173,1857],[2411,932],[1601,2047],[2809,2991]]){const sx=x!*scale,sz=z!*scale,ray=new THREE.Raycaster(new THREE.Vector3(sx,3000,sz),new THREE.Vector3(0,-1,0)),hit=ray.intersectObject(this.landscape)[0];if(!hit)throw new Error('Terrain raycast missed');this.terrainErrorM=Math.max(this.terrainErrorM,Math.abs(hit.point.y-this.terrain.sample(sx,sz).elevationM));}if(this.terrainErrorM>.001)throw new Error('Rendered terrain differs from simulation');}
  stats():RenderStats {const info=this.renderer.info,first=[...this.trainModels.values()][0]?.cars[0];return {calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures,trees:this.treeCount,buildings:this.buildingCount,trains:this.stressTrains?this.stressCount:this.trainModels.size,lod:first?.getCurrentLevel()??0,terrainErrorM:this.terrainErrorM,contextLost:this.renderer.getContext().isContextLost()};}
  dispose():void {window.removeEventListener('resize',this.onResize);window.removeEventListener('keydown',this.keyDown);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.clearKeys);this.controls.removeEventListener('start',this.controlStart);this.controls.dispose();disposeObject(this.scene);this.renderer.dispose();this.renderer.forceContextLoss();}
}
function terrainSize(terrain:Heightfield):number {return Math.max(terrain.widthM,terrain.depthM);}
function railwayKey(state:Readonly<GameState>):string {return `${state.railway.revision}|${state.railway.nodes.map(node=>`${node.id}:${node.position.x}:${node.position.y}:${node.position.z}`).join(',')}|${state.railway.edges.map(edge=>`${edge.id}:${edge.from}:${edge.to}`).join(',')}`;}
export function disposeObject(root:THREE.Object3D):void {
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  root.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Points){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);}if(object instanceof THREE.InstancedMesh)object.dispose();if(object instanceof THREE.DirectionalLight||object instanceof THREE.SpotLight||object instanceof THREE.PointLight)object.shadow.dispose();});
  const textures=new Set<THREE.Texture>();for(const material of materials)for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value);
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
