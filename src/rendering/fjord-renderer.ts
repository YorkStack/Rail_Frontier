import {createStationPlatform,STATION_MODEL_OFFSET_M} from './station-platform.js';
import {followTarget} from './follow-target.js';
import {createVillageRoads,villageRoads,streetEra} from './settlement-roads.js';
import {currentYear} from '../simulation/calendar.js';
import {setTerrainPortalOpenings} from './terrain-material.js';
import * as THREE from 'three';
import type {EngineeringInterval} from '../rail/planner.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type { GameState,MotionState,Vec3 } from '../domain/model.js';
import type { MapOverlay,WorldRenderer,WorldSelection } from '../application/ports.js';
import type { GridTerrain } from '../world/terrain.js';
import {EngineeredTerrain,ENGINEERED_PATCH_CELL_M} from '../world/engineered-terrain.js';
import type { BiomeDefinition } from '../world/profiles.js';
import { SeededRandom } from '../world/random.js';
import { shorelineX } from '../world/fjord-study.js';
import { compileGraph } from '../rail/graph.js';
import { motionPosition } from '../simulation/motion.js';
import { terrainMesh } from './terrain-mesh.js';
import { createElectrification,createTrack } from './track-mesh.js';
import { sampleDistance,type TrackGeometry } from '../rail/geometry.js';
import { vehicleDefinition } from '../content/vehicles.js';
import { stationDefinition } from '../content/stations.js';
import { industryName } from '../content/industries.js';
import {generateNorwayScenery,type SceneryCategory} from './scenery-placement.js';
import {generateNorwaySettlements} from './settlement-placement.js';
import {generateArizonaSettlements} from './arizona-settlement-placement.js';
import type {CampaignContent} from '../content/registry.js';
import type {StationSite} from '../rail/station-layout.js';
import {BRIDGE_MODULE_LENGTH_M,deriveInfrastructurePlacements} from './infrastructure-placement.js';

export interface RenderStats { calls:number;triangles:number;terrainTriangles:number;terrainPatchTriangles:number;geometries:number;textures:number;trees:number;detailedTrees:number;simplifiedTrees:number;buildings:number;trains:number;lod:number;terrainErrorM:number;terrainPatchCells:number;bridgeModules:number;bridgeAbutments:number;tunnelPortals:number;retainingWalls:number;contextLost:boolean }
export interface AssetReport { name:string;lod:number;sizeM:number[];normalsFinite:boolean;materials:number;triangles:number }
interface PackAsset {id:string;kind:'vehicle'|'station'|'building'|'vegetation'|'rock'|'infrastructure';lods:{path:string}[]}
interface PackTexture {id:string;path:string;role:'baseColor'|'normal'|'roughness';colorSpace:'srgb'|'linear'}
interface PackBinding {materialPrefix:string;map:string;normalMap:string;roughnessMap:string;repeat:[number,number]}
interface PackManifest {version:number;campaignId:string;assets:PackAsset[];textures?:PackTexture[];materialBindings?:PackBinding[]}
export class FjordRenderer implements WorldRenderer {
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(42,1,.5,50000);
  readonly renderer:THREE.WebGLRenderer;
  readonly controls:OrbitControls;
  landscape:THREE.Mesh;
  readonly assets:AssetReport[]=[];
  readonly labels:{name:string;position:Vec3;selection:WorldSelection}[];
  readonly terrain:GridTerrain;
  readonly profile:BiomeDefinition;
  private geometry:ReturnType<typeof compileGraph>;
  private railwayRevision:number;
  private terrainRevision:number;
  private railwaySignature:string;
  private electrificationSignature:string;
  private trackGroup=new THREE.Group();
  private assetLevels=new Map<string,THREE.Object3D[]>();
  private assetLibrary=new THREE.Group();
  private trainModels=new Map<string,{group:THREE.Group;cars:THREE.LOD[];assetIds:string[];signature:string}>();
  private stationModels=new Map<string,THREE.LOD>();
  private infrastructureModels=new THREE.Group();
  private modelState:Readonly<GameState>;
  private water:THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
  private shoreContact:THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  private waterfall:THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;
  private trees:THREE.Group;
  private buildings=new THREE.Group();
  private preview:THREE.Object3D|null=null;
  private marker:THREE.Object3D|null=null;
  private portHandles:THREE.Object3D|null=null;
  private selectionMarker:THREE.Object3D|null=null;
  private selection:WorldSelection|null=null;
  private inspectionModel:THREE.LOD|null=null;
  private inspectionAssetId='';
  private readonly sun:THREE.DirectionalLight;
  private readonly sunOffset:THREE.Vector3;
  private detailedTreeCount=0;
  private simplifiedTreeCount=0;
  private overlay=new THREE.Group();
  private overlayKind:MapOverlay='none';
  private overlaySignature='';
  private trainPosition=new THREE.Vector3();
  private follow=false;
  private followedTrainId:string|undefined;
  private treeCount=0;
  private buildingCount=0;
  private structureCounts={bridgeModules:0,bridgeAbutments:0,tunnelPortals:0,retainingWalls:0};
  private terrainErrorM=0;
  private stressTrains:THREE.InstancedMesh|null=null;
  private stressTrack:THREE.LineSegments|null=null;
  private stressCount=1;
  private readonly onResize=()=>this.resize();
  private readonly keys=new Set<string>();
  private readonly keyDown=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement||document.querySelector('dialog[open]'))return;this.keys.add(event.code);};
  private readonly keyUp=(event:KeyboardEvent)=>this.keys.delete(event.code);
  private readonly clearKeys=()=>this.keys.clear();
  private readonly controlStart=()=>{this.follow=false;};

  private readonly ownsRenderer:boolean;
  private terrainSurfaceMaterial:THREE.Material;
  private terrainBlockoutMaterial:THREE.MeshStandardMaterial|null=null;
  constructor(private readonly canvas:HTMLCanvasElement,terrain:GridTerrain,state:GameState,private readonly content:CampaignContent,sharedRenderer?:THREE.WebGLRenderer) {
    this.terrain=terrain;this.profile=content.presentation.biome;this.modelState=state;this.geometry=compileGraph(state.railway);this.railwayRevision=state.railway.revision;this.terrainRevision=state.operations.terrain.revision;this.railwaySignature=railwayKey(state);this.electrificationSignature=this.electrificationKey(state);
    this.ownsRenderer=sharedRenderer===undefined;this.renderer=sharedRenderer??createWebGLRenderer(canvas);configureWebGLRenderer(this.renderer);
    const scale=terrainSize(terrain)/4000;this.scene.background=new THREE.Color(this.profile.palette.haze);this.scene.fog=new THREE.FogExp2(this.profile.palette.haze,.00018/scale);
    this.sunOffset=new THREE.Vector3(-1200,2600,1400).multiplyScalar(scale);this.sun=new THREE.DirectionalLight(this.profile.lighting.sunColor,this.profile.lighting.sunIntensity);this.sun.position.copy(this.sunOffset);this.sun.target.position.set(terrain.widthM*.45,0,terrain.depthM*.45);this.sun.castShadow=true;
    const shadowRadius=terrain.widthM>4000?700:360;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-shadowRadius;this.sun.shadow.camera.right=shadowRadius;this.sun.shadow.camera.top=shadowRadius;this.sun.shadow.camera.bottom=-shadowRadius;this.sun.shadow.camera.near=100;this.sun.shadow.camera.far=this.sunOffset.length()+shadowRadius*2;this.sun.shadow.normalBias=1.2;
    this.scene.add(this.sun,this.sun.target,new THREE.HemisphereLight(this.profile.lighting.skyColor,this.profile.lighting.groundColor,2.1));
    this.landscape=terrainMesh(terrain,this.profile);this.terrainSurfaceMaterial=this.landscape.material as THREE.Material;this.scene.add(this.landscape);
    this.water=this.createWater();this.water.visible=terrain.waterLevelM!==null;this.scene.add(this.water);
    this.shoreContact=this.createShoreContact();this.scene.add(this.shoreContact);
    this.waterfall=this.createWaterfall();this.waterfall.visible=content.worldGenerator.landforms.waterfall!==null;this.scene.add(this.waterfall);
    this.rebuildTracks(state);
    this.trees=content.presentation.proceduralScenery==='southwest-study'?this.createSouthwestVegetation(this.profile.vegetation.density):this.createForest(this.profile.vegetation.density);this.scene.add(this.trees);
    if(content.presentation.proceduralScenery==='southwest-study')this.createSouthwestBuildings(state,180);else this.createBuildings(state,terrain.widthM>4000?360:90);this.scene.add(this.buildings);this.assetLibrary.visible=false;this.scene.add(this.assetLibrary);
    this.rebuildAuthoredInfrastructure(state);
    this.labels=[
      ...state.towns.map(town=>({name:town.name,position:town.position,selection:{kind:'town' as const,id:town.id}})),
      ...state.industries.map(industry=>({name:industryName(industry.definitionId),position:industry.position,selection:{kind:'industry' as const,id:industry.id}}))
    ];
    this.scene.add(this.overlay);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.075;
    this.controls.minDistance=18;this.controls.maxDistance=terrainSize(terrain)*1.45;this.controls.maxPolarAngle=Math.PI*.475;this.controls.minPolarAngle=.15;this.controls.screenSpacePanning=false;
    this.controls.addEventListener('start',this.controlStart);
    this.entry();this.resize();window.addEventListener('resize',this.onResize);
    window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.clearKeys);
    this.verifyTerrain();
  }
  async loadAssets():Promise<void> {
    const assetManifestUrl=this.content.presentation.assetManifestUrl;if(assetManifestUrl===null)return;
    const response=await fetch(assetManifestUrl);if(!response.ok)throw new Error(`${this.content.presentation.id} asset manifest could not be loaded`);
    const manifest=await response.json() as PackManifest;if(manifest.version!==1||manifest.campaignId!==this.modelState.campaignId||!Array.isArray(manifest.assets))throw new Error(`${this.content.presentation.id} asset manifest is incompatible`);
    const loader=new GLTFLoader(),textureLoader=new THREE.TextureLoader(),textures=new Map<string,THREE.Texture>();
    await Promise.all((manifest.textures??[]).map(async definition=>{const value=await textureLoader.loadAsync(definition.path);value.colorSpace=definition.colorSpace==='srgb'?THREE.SRGBColorSpace:THREE.NoColorSpace;value.wrapS=value.wrapT=THREE.RepeatWrapping;value.userData.assetLibrary=true;textures.set(definition.id,value);}));
    const loadedAssets=await Promise.all(manifest.assets.map(async asset=>({asset,loaded:await Promise.all(asset.lods.map(lod=>loader.loadAsync(lod.path)))})));
    for(const {asset,loaded} of loadedAssets) {
      if(asset.lods.length!==2)throw new Error(`Asset ${asset.id} is missing an LOD`);
      const levels:THREE.Object3D[]=[];
      for(let lod=0;lod<loaded.length;lod++) {
        const group=loaded[lod]!.scene;group.updateMatrixWorld(true);const dimensions=new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());let normalsFinite=true,triangles=0;const materials=new Set<THREE.Material>();
        group.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;const normal=object.geometry.getAttribute('normal');if(!normal)normalsFinite=false;else for(let index=0;index<normal.count;index++)if(!Number.isFinite(normal.getX(index)+normal.getY(index)+normal.getZ(index)))normalsFinite=false;triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3;for(const material of Array.isArray(object.material)?object.material:[object.material]){const binding=(manifest.materialBindings??[]).find(item=>material.name.startsWith(item.materialPrefix));if(binding&&material instanceof THREE.MeshStandardMaterial){material.map=textures.get(binding.map)??null;material.normalMap=textures.get(binding.normalMap)??null;material.roughnessMap=textures.get(binding.roughnessMap)??null;material.normalScale.set(.22,.22);for(const texture of [material.map,material.normalMap,material.roughnessMap])texture?.repeat.set(...binding.repeat);material.needsUpdate=true;}materials.add(material);}}});
        if(!normalsFinite)throw new Error(`Asset ${asset.id} has invalid normals`);this.assets.push({name:asset.id,lod,sizeM:dimensions.toArray(),normalsFinite,materials:materials.size,triangles});const optimized=this.optimizedAssetLevel(group,asset.id);levels.push(optimized);this.assetLibrary.add(optimized);disposeObject(group);
      }
      if(asset.kind==='vehicle') {const front=levels[0]!.getObjectByName('forward_probe')?.getWorldPosition(new THREE.Vector3()),up=levels[0]!.getObjectByName('up_probe')?.getWorldPosition(new THREE.Vector3());if(!front||!up||front.z>=0||Math.abs(up.y-2)>.001)throw new Error(`Asset ${asset.id} has invalid runtime axes`);}
      this.assetLevels.set(asset.id,levels);
    }
    this.replaceAuthoredScenery(this.modelState);this.rebuildAuthoredInfrastructure(this.modelState);this.syncTrainModels(this.modelState);this.syncStationModels(this.modelState);
  }
  private optimizedAssetLevel(source:THREE.Object3D,id:string):THREE.Group {
    source.updateMatrixWorld(true);const result=new THREE.Group(),batches=new Map<string,{material:THREE.Material;geometries:THREE.BufferGeometry[]}>(),markers=new Set(['coupler_front','coupler_rear','forward_probe','up_probe','platform_origin','track_side','ground_origin','footprint_nw','footprint_se','span_start','span_end','track_center']);
    source.traverse(object=>{if(object instanceof THREE.Mesh){if(id===this.content.presentation.assetRoles.station&&object.name==='RF_Station_Platform')return;const materials=Array.isArray(object.material)?object.material:[object.material];if(materials.length!==1)throw new Error(`Asset ${id} has unsupported multi-material geometry`);const material=materials[0]!,batch=batches.get(material.uuid)??{material,geometries:[] as THREE.BufferGeometry[]},geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);batch.geometries.push(geometry);batches.set(material.uuid,batch);}else if(markers.has(object.name)){const marker=new THREE.Object3D();marker.name=object.name;marker.position.copy(object.getWorldPosition(new THREE.Vector3()));result.add(marker);}});
    for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometries,false);batch.geometries.forEach(value=>value.dispose());if(!geometry)throw new Error(`Asset ${id} contains incompatible geometry attributes`);const mesh=new THREE.Mesh(geometry,batch.material.clone());mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);}return result;
  }
  private cloneLod(id:string,distance=180):THREE.LOD {const levels=this.assetLevels.get(id);if(!levels)throw new Error(`Missing runtime asset: ${id}`);const lod=new THREE.LOD();levels.forEach((level,index)=>{const clone=level.clone(true);clone.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry=object.geometry.clone();object.material=Array.isArray(object.material)?object.material.map(material=>material.clone()):object.material.clone();}});lod.addLevel(clone,index===0?0:distance,.15);});return lod;}
  private syncTrainModels(state:Readonly<GameState>):void {if(this.assetLevels.size===0)return;for(const model of this.trainModels.values())model.group.visible=false;for(const train of state.trains){const assetIds=[train.locomotiveId,...train.vehicleIds],signature=assetIds.join('|'),existing=this.trainModels.get(train.id);if(existing&&existing.signature!==signature){this.scene.remove(existing.group);this.trainModels.delete(train.id);}if(!this.trainModels.has(train.id)){const group=new THREE.Group(),cars=assetIds.map(id=>this.cloneLod(id));group.userData.selection={kind:'train',id:train.id} satisfies WorldSelection;for(const car of cars)group.add(car);this.scene.add(group);this.trainModels.set(train.id,{group,cars,assetIds,signature});}this.trainModels.get(train.id)!.group.visible=true;}}
  private behind(motion:MotionState,distanceM:number):{position:Vec3;ahead:Vec3} {let leg=motion.leg,distance=motion.distanceM-distanceM;while(distance<0&&leg>0){leg--;distance+=this.geometry.get(motion.path[leg]!.edgeId)!.lengthM;}distance=Math.max(0,distance);const sample=(offset:number)=>{let sampleLeg=leg,s=distance+offset;while(sampleLeg<motion.path.length-1&&s>this.geometry.get(motion.path[sampleLeg]!.edgeId)!.lengthM){s-=this.geometry.get(motion.path[sampleLeg]!.edgeId)!.lengthM;sampleLeg++;}const traversal=motion.path[sampleLeg]!,geometry=this.geometry.get(traversal.edgeId)!;return sampleDistance(geometry,traversal.reverse?geometry.lengthM-Math.min(s,geometry.lengthM):Math.min(s,geometry.lengthM));};return {position:sample(0),ahead:sample(.25)};}
  private updateTrainModels(state:Readonly<GameState>):void {this.syncTrainModels(state);for(const train of state.trains){const model=this.trainModels.get(train.id);if(!model)continue;let offset=0,previousLength=vehicleDefinition(train.locomotiveId)?.lengthM??15.2;for(let index=0;index<model.cars.length;index++){if(index>0){const length=vehicleDefinition(train.vehicleIds[index-1]!)?.lengthM??12;offset+=previousLength/2+length/2+.6;previousLength=length;}const {position,ahead}=this.behind(train.motion,offset),car=model.cars[index]!;car.position.set(position.x,position.y+.12,position.z);car.rotation.y=Math.atan2(-(ahead.x-position.x),-(ahead.z-position.z));}model.group.visible=this.inspectionModel===null;}}
  private instancedAsset(id:string,lod:number,placements:THREE.Matrix4[],castShadow=lod===0):THREE.Group {
    const source=this.assetLevels.get(id)?.[lod];if(!source)throw new Error(`Missing instanced asset: ${id}`);source.updateMatrixWorld(true);const group=new THREE.Group(),batches=new Map<string,{material:THREE.Material;geometries:THREE.BufferGeometry[]}>();
    source.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const materials=Array.isArray(object.material)?object.material:[object.material];if(materials.length!==1)throw new Error(`Instanced asset ${id} has unsupported multi-material geometry`);const material=materials[0]!,batch=batches.get(material.uuid)??{material,geometries:[] as THREE.BufferGeometry[]},geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);batch.geometries.push(geometry);batches.set(material.uuid,batch);});
    for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometries,false);batch.geometries.forEach(value=>value.dispose());if(!geometry)throw new Error(`Instanced asset ${id} contains incompatible geometry attributes`);const instances=new THREE.InstancedMesh(geometry,batch.material.clone(),placements.length);placements.forEach((placement,index)=>instances.setMatrixAt(index,placement));instances.castShadow=castShadow;instances.receiveShadow=true;instances.computeBoundingSphere();group.add(instances);}return group;
  }
  private authoredForest(count:number):THREE.Group {
    const random=new SeededRandom(708),placements:THREE.Matrix4[]=[],dummy=new THREE.Object3D();
    for(let tries=0;placements.length<count&&tries<count*30;tries++) {const x=random.next()*this.terrain.widthM,z=random.next()*this.terrain.depthM,y=this.terrain.sample(x,z).elevationM,corridor=this.corridorX(z);if(y<10||y>this.profile.vegetation.treelineM||Math.abs(x-corridor)<24||Math.abs(z-6100)<24)continue;const scale=.72+random.next()*.62;dummy.position.set(x,y,z);dummy.rotation.set(0,random.next()*Math.PI*2,0);dummy.scale.setScalar(scale);dummy.updateMatrix();placements.push(dummy.matrix.clone());}
    this.treeCount=placements.length;return this.instancedAsset('norway-spruce',1,placements);
  }
  private authoredScenery(state:Readonly<GameState>):THREE.Group {
    const source=generateNorwayScenery(this.terrain,state),dummy=new THREE.Object3D(),records=source.map(record=>{dummy.position.set(record.x,record.y,record.z);dummy.rotation.set(0,record.rotationY,0);dummy.scale.setScalar(record.scale);dummy.updateMatrix();return {...record,matrix:dummy.matrix.clone(),detail:1 as 0|1};});
    const group=new THREE.Group(),capacities=new Map<string,number>();for(const record of records)capacities.set(record.assetId,(capacities.get(record.assetId)??0)+1);
    const levels=new Map<string,THREE.Group>();for(const [id,count] of capacities)for(const lod of [0,1] as const){const level=this.instancedAsset(id,lod,Array.from({length:count},()=>new THREE.Matrix4()),lod===0);level.name=`${id}:lod${lod}`;levels.set(`${id}:${lod}`,level);group.add(level);}
    group.userData.scenery={records,levels,lastCamera:new THREE.Vector3(Number.POSITIVE_INFINITY,0,0),lastRotation:new THREE.Quaternion(),lastAspect:0};this.treeCount=records.filter(record=>record.category==='tree').length;this.updateSceneryLod(group,true);return group;
  }
  private updateSceneryLod(group=this.trees,force=false):void {
    const runtime=group.userData.scenery as {records:Array<{assetId:string;category:SceneryCategory;x:number;y:number;z:number;matrix:THREE.Matrix4;detail:0|1}>;levels:Map<string,THREE.Group>;lastCamera:THREE.Vector3;lastRotation:THREE.Quaternion;lastAspect:number}|undefined;if(!runtime)return;
    if(!force&&runtime.lastCamera.distanceToSquared(this.camera.position)<2500&&runtime.lastRotation.angleTo(this.camera.quaternion)<.015&&runtime.lastAspect===this.camera.aspect)return;runtime.lastCamera.copy(this.camera.position);runtime.lastRotation.copy(this.camera.quaternion);runtime.lastAspect=this.camera.aspect;
    this.camera.updateMatrixWorld();const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse)),bound=new THREE.Sphere(new THREE.Vector3(),40);
    const batches=new Map<string,THREE.Matrix4[]>();let detailed=0,simplified=0;
    for(const record of runtime.records){const dx=record.x-this.camera.position.x,dy=record.y-this.camera.position.y,dz=record.z-this.camera.position.z,distance=Math.hypot(dx,dy,dz),near=record.category==='rock'?620:record.category==='understorey'?220:300,far=record.category==='rock'?800:record.category==='understorey'?320:420;if(record.detail===1&&distance<near)record.detail=0;else if(record.detail===0&&distance>far)record.detail=1;if(record.category==='tree'){if(record.detail===0)detailed++;else simplified++;}const visible=record.category==='understorey'?distance<1800:record.category==='tree'?distance<2600:distance<6500;bound.center.set(record.x,record.y+8,record.z);if(!visible||!frustum.intersectsSphere(bound))continue;const key=`${record.assetId}:${record.detail}`,batch=batches.get(key)??[];batch.push(record.matrix);batches.set(key,batch);}
    for(const [key,level] of runtime.levels){const matrices=batches.get(key)??[];level.traverse(object=>{if(!(object instanceof THREE.InstancedMesh))return;object.count=matrices.length;matrices.forEach((matrix,index)=>object.setMatrixAt(index,matrix));object.instanceMatrix.needsUpdate=true;object.computeBoundingSphere();});}
    this.detailedTreeCount=detailed;this.simplifiedTreeCount=simplified;
  }
  private legacyAuthoredBuildings(state:Readonly<GameState>,count:number):THREE.Group {
    const random=new SeededRandom(144),placements:THREE.Matrix4[]=[],dummy=new THREE.Object3D();
    for(let index=0;index<count;index++){const town=state.towns[index%state.towns.length]!;let x=town.position.x,z=town.position.z;for(let attempt=0;attempt<24;attempt++){const angle=random.next()*Math.PI*2,radius=Math.sqrt(random.next())*400;x=Math.max(2,Math.min(this.terrain.widthM-2,town.position.x+Math.cos(angle)*radius));z=Math.max(2,Math.min(this.terrain.depthM-2,town.position.z+Math.sin(angle)*radius));if(Math.abs(x-this.corridorX(z))>58)break;}dummy.position.set(x,Math.max(.5,this.terrain.sample(x,z).elevationM),z);dummy.rotation.set(0,Math.round(random.next()*3)*Math.PI/2,0);dummy.scale.setScalar(.72+random.next()*.48);dummy.updateMatrix();placements.push(dummy.matrix.clone());}
    this.buildingCount=count;return this.instancedAsset('norway-house',0,placements);
  }
  private authoredSettlements(state:Readonly<GameState>):THREE.Group {
    const records=generateNorwaySettlements(this.terrain,state),batches=new Map<string,THREE.Matrix4[]>(),dummy=new THREE.Object3D(),group=new THREE.Group();
    for(const record of records){const matrices=batches.get(record.assetId)??[];dummy.position.set(record.x,record.y,record.z);dummy.rotation.set(0,record.rotationY,0);dummy.scale.setScalar(record.scale);dummy.updateMatrix();matrices.push(dummy.matrix.clone());batches.set(record.assetId,matrices);}
    for(const [id,matrices] of batches)group.add(this.instancedAsset(id,0,matrices));
    group.userData.roadPlots=records;this.addVillageRoads(group,state);
    this.buildingCount=records.length;return group;
  }
  private addVillageRoads(group:THREE.Group,state:Readonly<GameState>):void {
    const plots=group.userData.roadPlots;if(!plots)return;
    const old=group.getObjectByName('village-roads');if(old){group.remove(old);disposeObject(old);}
    group.add(createVillageRoads(this.terrain,villageRoads(state,plots,this.content.presentation.proceduralScenery==='southwest-study',currentYear(state)),plots));
    group.userData.roadEra=streetEra(currentYear(state));group.userData.roadTerrainRevision=state.operations.terrain.revision;
  }
  private authoredArizonaSettlements(state:Readonly<GameState>):THREE.Group {
    const records=generateArizonaSettlements(this.terrain,state),batches=new Map<string,THREE.Matrix4[]>(),dummy=new THREE.Object3D(),group=new THREE.Group();
    for(const record of records){const matrices=batches.get(record.assetId)??[];dummy.position.set(record.x,record.y,record.z);dummy.rotation.set(0,record.rotationY,0);dummy.scale.setScalar(record.scale);dummy.updateMatrix();matrices.push(dummy.matrix.clone());batches.set(record.assetId,matrices);}
    for(const [id,matrices] of batches)group.add(this.instancedAsset(id,0,matrices));
    group.userData.roadPlots=records;this.addVillageRoads(group,state);
    this.buildingCount=records.length;return group;
  }
  private replaceAuthoredScenery(state:Readonly<GameState>):void {
    if(this.content.presentation.proceduralScenery==='norway-fallback'){this.scene.remove(this.trees);disposeObject(this.trees);this.trees=this.assetLevels.has('norway-pine')?this.authoredScenery(state):this.authoredForest(this.profile.vegetation.density);this.scene.add(this.trees);}
    this.scene.remove(this.buildings);disposeObject(this.buildings);
    this.buildings=this.content.presentation.proceduralScenery==='southwest-study'?this.authoredArizonaSettlements(state):this.assetLevels.has('norway-house-red-white')?this.authoredSettlements(state):this.legacyAuthoredBuildings(state,360);this.scene.add(this.buildings);
  }
  private syncStationModels(state:Readonly<GameState>):void {
    const assetId=this.content.presentation.assetRoles.station;if(!assetId||!this.assetLevels.has(assetId))return;for(const model of this.stationModels.values())model.visible=false;
    for(const station of state.stations){if(!this.stationModels.has(station.id)){const model=this.cloneLod(assetId,260);model.userData.selection={kind:'station',id:station.id} satisfies WorldSelection;this.scene.add(model);this.stationModels.set(station.id,model);}const model=this.stationModels.get(station.id)!,node=state.railway.nodes.find(candidate=>candidate.id===station.nodeId),edge=state.railway.edges.find(candidate=>candidate.from===station.nodeId||candidate.to===station.nodeId);if(!node||!edge)continue;const otherId=edge.from===node.id?edge.to:edge.from,other=state.railway.nodes.find(candidate=>candidate.id===otherId);if(!other)continue;const yaw=station.layout.kind==='single-platform'?station.layout.orientationRad:Math.atan2(-(other.position.x-node.position.x),-(other.position.z-node.position.z));model.position.set(node.position.x+Math.cos(yaw)*STATION_MODEL_OFFSET_M,node.position.y,node.position.z-Math.sin(yaw)*STATION_MODEL_OFFSET_M);model.rotation.y=yaw;model.visible=this.inspectionModel===null;}
  }
  private rebuildAuthoredInfrastructure(state:Readonly<GameState>):void {
    this.scene.remove(this.infrastructureModels);disposeObject(this.infrastructureModels);this.infrastructureModels=new THREE.Group();
    const layout=deriveInfrastructurePlacements(this.geometry,state.operations.infrastructure,state.operations.terrain,this.terrain),bridgeAsset=this.content.presentation.assetRoles.bridgeSpan,tunnelAsset=this.content.presentation.assetRoles.tunnelPortal,dummy=new THREE.Object3D();
    this.structureCounts={bridgeModules:layout.bridgeModules.length,bridgeAbutments:layout.transitions.filter(item=>item.kind==='bridge-abutment').length,tunnelPortals:layout.transitions.filter(item=>item.kind==='tunnel-portal').length,retainingWalls:layout.retainingWalls.length};
    const bridgeMatrices=layout.bridgeModules.map(item=>{dummy.position.set(item.position.x,item.position.y-.9,item.position.z);dummy.rotation.set(0,item.rotationY,0);dummy.scale.set(1,1,item.lengthM/BRIDGE_MODULE_LENGTH_M);dummy.updateMatrix();return dummy.matrix.clone();});
    if(bridgeMatrices.length>0){if(bridgeAsset&&this.assetLevels.has(bridgeAsset))this.infrastructureModels.add(this.instancedAsset(bridgeAsset,0,bridgeMatrices));else{const deckMatrices=layout.bridgeModules.map(item=>{dummy.position.set(item.position.x,item.position.y-.72,item.position.z);dummy.rotation.set(0,item.rotationY,0);dummy.scale.set(7,.8,item.lengthM);dummy.updateMatrix();return dummy.matrix.clone();}),deck=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#40514e',roughness:.68,metalness:.3}),deckMatrices.length);deckMatrices.forEach((matrix,index)=>deck.setMatrixAt(index,matrix));deck.castShadow=true;deck.receiveShadow=true;deck.computeBoundingSphere();this.infrastructureModels.add(deck);}}
    const tunnelPortals=layout.transitions.filter(item=>item.kind==='tunnel-portal');
    setTerrainPortalOpenings(this.terrainSurfaceMaterial,tunnelPortals);
    for(const item of tunnelPortals){
      const recess=new THREE.Group();recess.position.set(item.position.x,item.position.y,item.position.z);recess.rotation.y=item.rotationY;
      const darkness=new THREE.Mesh(new THREE.PlaneGeometry(4.8,6.4),new THREE.MeshBasicMaterial({color:'#080c0a'}));darkness.position.set(0,2.8,-3.9);recess.add(darkness);
      const stone=new THREE.MeshStandardMaterial({color:'#55584f',roughness:1});
      for(const side of [-1,1]){const wall=new THREE.Mesh(new THREE.BoxGeometry(.3,6.4,5.2),stone);wall.position.set(side*2.5,2.8,-1.4);recess.add(wall);}
      const roof=new THREE.Mesh(new THREE.BoxGeometry(5.3,.3,5.2),stone);roof.position.set(0,6.1,-1.4);recess.add(roof);
      const floor=new THREE.Mesh(new THREE.BoxGeometry(4.8,.2,10),stone);floor.position.set(0,-.55,1);recess.add(floor);this.infrastructureModels.add(recess);
    }
    if(tunnelAsset&&this.assetLevels.has(tunnelAsset))for(const item of tunnelPortals){const model=this.cloneLod(tunnelAsset,280);model.position.set(item.position.x,item.position.y,item.position.z);model.rotation.y=item.rotationY;this.infrastructureModels.add(model);}else if(tunnelPortals.length>0){const material=new THREE.MeshStandardMaterial({color:'#8b887c',roughness:.98});for(const item of tunnelPortals){const portal=new THREE.Group();for(const x of [-3.3,3.3]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(1.5,5,3),material);pillar.position.set(x,2.1,0);portal.add(pillar);}const arch=new THREE.Mesh(new THREE.TorusGeometry(3.3,.8,7,18,Math.PI),material);arch.position.y=4.6;portal.add(arch);portal.position.set(item.position.x,item.position.y,item.position.z);portal.rotation.y=item.rotationY;this.infrastructureModels.add(portal);}}
    const abutmentMatrices:THREE.Matrix4[]=[];
    for(const item of layout.transitions.filter(item=>item.kind==='bridge-abutment')){const ground=this.terrain.sample(item.position.x,item.position.z).elevationM,top=item.position.y-.7,height=Math.max(1.5,Math.min(12,Math.abs(top-ground)));dummy.position.set(item.position.x,Math.min(top,ground)+height/2,item.position.z);dummy.rotation.set(0,item.rotationY,0);dummy.scale.set(9,height,3.2);dummy.updateMatrix();abutmentMatrices.push(dummy.matrix.clone());}
    const wallParts:THREE.BufferGeometry[]=[];
    for(const item of layout.retainingWalls){
      const geometry=new THREE.BoxGeometry(.7,1,item.lengthM),positions=geometry.getAttribute('position');
      for(let i=0;i<positions.count;i++){const start=positions.getZ(i)>0,height=start?item.startHeightM:item.endHeightM,railY=start?item.startRailY:item.endRailY,base=railY-.55,upper=item.earthwork==='cut'?base+height:base,lower=item.earthwork==='cut'?base:base-height;positions.setY(i,positions.getY(i)>0?upper:lower);}
      geometry.rotateY(item.rotationY);geometry.translate(item.position.x,0,item.position.z);geometry.computeVertexNormals();wallParts.push(geometry);
    }
    if(wallParts.length){const combined=mergeGeometries(wallParts),walls=new THREE.Mesh(combined,new THREE.MeshStandardMaterial({color:'#777b6d',roughness:.97}));walls.castShadow=true;walls.receiveShadow=true;this.infrastructureModels.add(walls);for(const part of wallParts)part.dispose();}
    const addMasonry=(matrices:THREE.Matrix4[],color:string)=>{if(matrices.length===0)return;const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color,roughness:.96}),matrices.length);matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.infrastructureModels.add(mesh);};
    addMasonry(abutmentMatrices,'#81796a');
    this.scene.add(this.infrastructureModels);
  }
  private createWater():THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial> {
    const material=new THREE.ShaderMaterial({
      uniforms:{time:{value:0},deep:{value:new THREE.Color('#173f4a')},light:{value:new THREE.Color('#73999b')},sky:{value:new THREE.Color('#b7c9c7')}},
      vertexShader:'varying vec3 world; void main(){ vec4 p=modelMatrix*vec4(position,1.0); world=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
      fragmentShader:`uniform float time; uniform vec3 deep; uniform vec3 light; uniform vec3 sky; varying vec3 world;
        void main(){ float a=world.x*.024+world.z*.039+time*.42,b=world.x*.011-world.z*.027-time*.31;
        vec3 normal=normalize(vec3(cos(a)*.075+cos(b)*.045,1.0,sin(a)*.12-sin(b)*.05));vec3 viewDir=normalize(cameraPosition-world);
        float fresnel=pow(1.0-max(0.0,dot(normal,viewDir)),3.2),spark=pow(max(0.0,dot(normal,normalize(vec3(-.35,.8,.48)))),72.0);
        float variation=.5+.5*sin(world.x*.0047+world.z*.0061+sin(world.z*.0013));vec3 color=mix(deep,light,.11+variation*.08);color=mix(color,sky,fresnel*.42);color+=spark*.18;gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(terrainSize(this.terrain),terrainSize(this.terrain)),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(this.terrain.widthM/2,.15,this.terrain.depthM/2);return mesh;
  }
  private createWaterfall():THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial> {
    const production=this.terrain.widthM>4000,landmark=this.content.worldGenerator.landforms.waterfall,watercourse=this.content.worldGenerator.landforms.watercourse,z=production&&landmark?landmark.z:2470,crossSection=this.content.worldGenerator.landforms.waterCrossSection(z),bank=production&&landmark?(landmark.bank==='east'?crossSection.eastBankX:crossSection.westBankX):shorelineX(z),direction=production&&landmark?.bank==='west'?-1:1,offset=production&&landmark?landmark.offsetFromBankM:260,positions:number[]=[],uv:number[]=[],indices:number[]=[];
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv; uniform float time; void main(){float edge=smoothstep(0.0,.16,vUv.x)*smoothstep(0.0,.16,1.0-vUv.x);float flow=.5+.5*sin(vUv.y*38.0-time*5.5+sin(vUv.x*9.0)*1.2);float broken=.5+.5*sin(vUv.x*19.0+vUv.y*13.0-time*2.0);vec3 color=mix(vec3(.48,.72,.76),vec3(.86,.96,.95),.35+flow*.25+broken*.12);gl_FragColor=vec4(color,edge*(.56+flow*.2));}`});
    if(landmark===null)return new THREE.Mesh(new THREE.BufferGeometry(),material);
    if(bank===null)throw new Error('Waterfall landmark has no matching water bank');
    const points=watercourse?[watercourse.upstream,watercourse.lip,...Array.from({length:18},(_,index)=>({x:watercourse.lip.x+(watercourse.plunge.x-watercourse.lip.x)*(index+1)/19,z:watercourse.lip.z+(watercourse.plunge.z-watercourse.lip.z)*(index+1)/19})),watercourse.plunge,watercourse.outlet]:Array.from({length:81},(_,i)=>({x:bank!+direction*(offset-i*(production?7.5:3.5)),z}));
    const lipY=watercourse?this.terrain.sample(watercourse.lip.x,watercourse.lip.z).elevationM+1.5:0,plungeY=watercourse?this.terrain.sample(watercourse.plunge.x,watercourse.plunge.z).elevationM+2:0;
    for(let i=0;i<points.length;i++) {
      const point=points[i]!,previous=points[Math.max(0,i-1)]!,next=points[Math.min(points.length-1,i+1)]!,length=Math.hypot(next.x-previous.x,next.z-previous.z)||1,nx=-(next.z-previous.z)/length,nz=(next.x-previous.x)/length,width=(watercourse?4.5:5)+(watercourse?5.5:3)*Math.sin(i/(points.length-1)*Math.PI),fallStart=watercourse?2:-1,fallEnd=watercourse?points.length-2:-1;
      for(const side of [-1,1]) {const sampleX=point.x+nx*side*width,sampleZ=point.z+nz*side*width,fallT=watercourse&&i>=fallStart&&i<=fallEnd?(i-fallStart)/(fallEnd-fallStart):null,y=fallT===null?Math.max(.6,this.terrain.sample(sampleX,sampleZ).elevationM+1.3):lipY+(plungeY-lipY)*fallT;positions.push(sampleX,y,sampleZ);uv.push((side+1)/2,1-i/(points.length-1));}
      if(i>0){const a=(i-1)*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=3;
    if(watercourse){
      const plungeY=this.terrain.sample(watercourse.plunge.x,watercourse.plunge.z).elevationM;
      const foamMaterial=new THREE.MeshBasicMaterial({color:'#d7efed',transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}),foam=new THREE.Mesh(new THREE.CircleGeometry(14,48),foamMaterial);foam.rotation.x=-Math.PI/2;foam.position.set(watercourse.plunge.x,plungeY+1.1,watercourse.plunge.z);foam.renderOrder=4;mesh.add(foam);
      const sprayRandom=new SeededRandom(905),sprayPositions:number[]=[];for(let index=0;index<72;index++){const angle=sprayRandom.next()*Math.PI*2,radius=3+sprayRandom.next()*15,height=3+Math.pow(sprayRandom.next(),1.9)*34;sprayPositions.push(watercourse.plunge.x+Math.cos(angle)*radius,plungeY+height,watercourse.plunge.z+Math.sin(angle)*radius);}
      const sprayGeometry=new THREE.BufferGeometry();sprayGeometry.setAttribute('position',new THREE.Float32BufferAttribute(sprayPositions,3));const spray=new THREE.Points(sprayGeometry,new THREE.PointsMaterial({color:'#e2f2ef',size:1.8,transparent:true,opacity:.26,depthWrite:false,sizeAttenuation:true}));spray.renderOrder=4;mesh.add(spray);
    }
    return mesh;
  }
  private createShoreContact():THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial> {const positions:number[]=[],indices:number[]=[],middle=this.content.worldGenerator.landforms.waterCrossSection(this.terrain.depthM/2);if(this.terrain.widthM>4000&&middle.westBankX!==null&&middle.eastBankX!==null)for(const side of ['west','east'] as const)for(let index=0;index<=160;index++){const z=index/160*this.terrain.depthM,section=this.content.worldGenerator.landforms.waterCrossSection(z),edge=side==='west'?section.westBankX:section.eastBankX;if(edge===null)continue;const inside=side==='west'?1:-1,base=positions.length/3;positions.push(edge,.32,z,edge+inside*5,.34,z);if(index>0){const previous=base-2;indices.push(previous,previous+1,base,previous+1,base+1,base);}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);const material=new THREE.MeshBasicMaterial({color:'#c6d8d3',transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=2;return mesh;}
  private corridorX(z:number):number {return this.content.worldGenerator.landforms.corridorX(z);}
  private createForest(count:number):THREE.Group {
    const group=new THREE.Group(),random=new SeededRandom(708),mat=new THREE.MeshStandardMaterial({color:'#e7eedc',roughness:1});
    const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5,1),mat,count),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.07,1,4),new THREE.MeshStandardMaterial({color:'#574d39'}),count),dummy=new THREE.Object3D(),color=new THREE.Color();
    let placed=0;
    for(let tries=0;placed<count&&tries<count*30;tries++) {
      const x=random.next()*this.terrain.widthM,z=random.next()*this.terrain.depthM,y=this.terrain.sample(x,z).elevationM;
      const production=this.terrain.widthM>4000,corridor=production?this.corridorX(z):shorelineX(z)+75;
      if(y<10||y>this.profile.vegetation.treelineM||Math.abs(x-corridor)<24||Math.abs(z-(production?6100:2470))<24)continue;
      const h=9+random.next()*15;dummy.position.set(x,y+h*.58,z);dummy.rotation.set(0,random.next()*Math.PI*2,0);dummy.scale.set(h*.27,h,h*.27);dummy.updateMatrix();crowns.setMatrixAt(placed,dummy.matrix);
      color.setHSL(.27+random.next()*.08,.22+random.next()*.2,.18+random.next()*.12);crowns.setColorAt(placed,color);
      dummy.position.y=y+h*.3;dummy.scale.set(h,h*.6,h);dummy.updateMatrix();trunks.setMatrixAt(placed,dummy.matrix);placed++;
    }
    crowns.count=trunks.count=placed;crowns.castShadow=true;crowns.computeBoundingSphere();trunks.computeBoundingSphere();group.add(crowns,trunks);this.treeCount=placed;return group;
  }
  private createSouthwestVegetation(count:number):THREE.Group {
    type Kind='shrub'|'grass'|'saguaro'|'juniper'|'mesquite';type SouthwestRecord={kind:Kind;x:number;y:number;z:number;detail:0|1;main:THREE.Matrix4;arms:THREE.Matrix4[]};
    const group=new THREE.Group(),random=new SeededRandom(270519),dummy=new THREE.Object3D(),records:SouthwestRecord[]=[],materials={shrub:new THREE.MeshStandardMaterial({color:'#777444',roughness:1}),grass:new THREE.MeshStandardMaterial({color:'#b49a58',roughness:1}),cactus:new THREE.MeshStandardMaterial({color:'#4d7048',roughness:.92}),juniper:new THREE.MeshStandardMaterial({color:'#415b3f',roughness:1}),mesquite:new THREE.MeshStandardMaterial({color:'#6b633a',roughness:1}),bark:new THREE.MeshStandardMaterial({color:'#5f4535',roughness:1})};
    let placed=0;
    for(let tries=0;placed<count&&tries<count*35;tries++){
      const town=random.next()<.34?this.modelState.towns[Math.floor(random.next()*this.modelState.towns.length)]:undefined,angle=random.next()*Math.PI*2,radius=260+Math.sqrt(random.next())*1150,x=town?Math.max(1,Math.min(this.terrain.widthM-1,town.position.x+Math.cos(angle)*radius)):random.next()*this.terrain.widthM,z=town?Math.max(1,Math.min(this.terrain.depthM-1,town.position.z+Math.sin(angle)*radius)):random.next()*this.terrain.depthM,sample=this.terrain.sample(x,z),y=sample.elevationM,slope=this.terrain.planeAt(x,z),grade=Math.hypot(slope.dx,slope.dz),wash=Math.abs(Math.sin(x*.00073+z*.00111)+Math.sin(z*.00029-x*.00041)*.55),patch=.5+.5*Math.sin(x*.00135+Math.sin(z*.00031)*2.7)*Math.cos(z*.00108-x*.00019);
      if(sample.urban>.16||sample.rock>.72||Math.abs(x-this.corridorX(z))<38||patch<.48)continue;
      const roll=random.next(),yaw=random.next()*Math.PI*2,cool=sample.forest+.28*Math.max(0,(y-520)/900),kind:Kind=cool>.42&&y>560?'juniper':wash<.13&&y<980?'mesquite':y<720&&grade<.22&&roll>.72?'saguaro':sample.rock>.38||grade>.24?'grass':'shrub',arms:THREE.Matrix4[]=[];dummy.rotation.set(0,yaw,0);dummy.position.set(x,y,z);
      if(kind==='shrub'){const h=.55+random.next()*1.05;dummy.position.y+=h*.42;dummy.scale.set(.9+random.next()*1.2,h,.75+random.next()*1.1);}
      else if(kind==='grass'){const h=.4+random.next()*.7;dummy.position.y+=h*.5;dummy.scale.set(.2+random.next()*.22,h,.2+random.next()*.22);}
      else if(kind==='saguaro'){const h=2.4+random.next()*5.1;dummy.position.y+=h*.5;dummy.scale.set(1,h,1);for(const side of [-1,1]){const arm=.7+random.next()*1.2;dummy.position.set(x+Math.cos(yaw)*side*arm*.28,y+h*(side<0?.4:.62),z+Math.sin(yaw)*side*arm*.28);dummy.rotation.set(0,yaw,Math.PI/2);dummy.scale.set(1,arm,1);dummy.updateMatrix();arms.push(dummy.matrix.clone());}dummy.position.set(x,y+h*.5,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(1,h,1);}
      else {const h=kind==='juniper'?3.2+random.next()*4.2:2.2+random.next()*3.4;dummy.position.y+=h*.55;dummy.scale.set(kind==='juniper'?1.8:2.2,h,kind==='juniper'?1.7:2.0);}
      dummy.updateMatrix();records.push({kind,x,y,z,detail:1,main:dummy.matrix.clone(),arms});placed++;
    }
    const part=(geometry:THREE.BufferGeometry,position:THREE.Vector3,scale:THREE.Vector3)=>{const compatible=geometry.index?geometry.toNonIndexed():geometry;return compatible.applyMatrix4(new THREE.Matrix4().compose(position,new THREE.Quaternion(),scale));},juniperDetail=mergeGeometries([part(new THREE.CylinderGeometry(.12,.2,1,7),new THREE.Vector3(0,.35,0),new THREE.Vector3(1,.7,1)),part(new THREE.IcosahedronGeometry(1,1),new THREE.Vector3(-.12,.72,0),new THREE.Vector3(1,.42,.92)),part(new THREE.IcosahedronGeometry(1,1),new THREE.Vector3(.3,.78,.08),new THREE.Vector3(.72,.34,.7))],false)!,mesquiteDetail=mergeGeometries([part(new THREE.CylinderGeometry(.1,.18,1,7),new THREE.Vector3(0,.3,0),new THREE.Vector3(1,.6,1)),part(new THREE.IcosahedronGeometry(1,1),new THREE.Vector3(-.32,.68,0),new THREE.Vector3(.78,.3,.68)),part(new THREE.IcosahedronGeometry(1,1),new THREE.Vector3(.38,.72,.04),new THREE.Vector3(.86,.32,.72)),part(new THREE.IcosahedronGeometry(1,1),new THREE.Vector3(0,.82,-.18),new THREE.Vector3(.65,.27,.62))],false)!,geometries:Record<string,THREE.BufferGeometry>={
      'shrub:0':new THREE.DodecahedronGeometry(1,1),'shrub:1':new THREE.DodecahedronGeometry(1,0),'grass:0':new THREE.ConeGeometry(1,1,5),'grass:1':new THREE.ConeGeometry(1,1,3),'saguaro:0':new THREE.CylinderGeometry(.32,.42,1,10),'saguaro:1':new THREE.CylinderGeometry(.32,.42,1,6),'juniper:0':juniperDetail,'juniper:1':new THREE.IcosahedronGeometry(1,0),'mesquite:0':mesquiteDetail,'mesquite:1':new THREE.IcosahedronGeometry(1,0),'saguaro-arm:0':new THREE.CylinderGeometry(.18,.22,1,8)
    },materialFor=(kind:Kind)=>kind==='saguaro'?materials.cactus:materials[kind],meshes=new Map<string,THREE.InstancedMesh>();
    for(const kind of ['shrub','grass','saguaro','juniper','mesquite'] as Kind[])for(const lod of [0,1] as const){const mesh=new THREE.InstancedMesh(geometries[`${kind}:${lod}`]!,materialFor(kind),count);mesh.name=`southwest:${kind}:lod${lod}`;mesh.count=0;mesh.castShadow=lod===0;mesh.receiveShadow=true;meshes.set(`${kind}:${lod}`,mesh);group.add(mesh);}const arms=new THREE.InstancedMesh(geometries['saguaro-arm:0']!,materials.cactus,count*2);arms.name='southwest:saguaro-arms';arms.count=0;arms.castShadow=true;meshes.set('saguaro-arms:0',arms);group.add(arms);
    group.userData.southwest={records,meshes,lastCamera:new THREE.Vector3(Number.POSITIVE_INFINITY,0,0)};this.treeCount=placed;this.updateSouthwestLod(group,true);return group;
  }
  private updateSouthwestLod(group=this.trees,force=false):void {
    type Kind='shrub'|'grass'|'saguaro'|'juniper'|'mesquite';type Record={kind:Kind;x:number;y:number;z:number;detail:0|1;main:THREE.Matrix4;arms:THREE.Matrix4[]};const runtime=group.userData.southwest as {records:Record[];meshes:Map<string,THREE.InstancedMesh>;lastCamera:THREE.Vector3}|undefined;if(!runtime)return;
    if(!force&&runtime.lastCamera.distanceToSquared(this.camera.position)<6400)return;runtime.lastCamera.copy(this.camera.position);const batches=new Map<string,THREE.Matrix4[]>(),armMatrices:THREE.Matrix4[]=[];let detailed=0,simplified=0;
    for(const record of runtime.records){const distance=Math.hypot(record.x-this.camera.position.x,record.y-this.camera.position.y,record.z-this.camera.position.z),near=record.kind==='saguaro'||record.kind==='juniper'?620:430,far=near+180;if(record.detail===1&&distance<near)record.detail=0;else if(record.detail===0&&distance>far)record.detail=1;const key=`${record.kind}:${record.detail}`,batch=batches.get(key)??[];batch.push(record.main);batches.set(key,batch);if(record.detail===0){detailed++;if(record.kind==='saguaro')armMatrices.push(...record.arms);}else simplified++;}
    for(const [key,mesh] of runtime.meshes){const matrices=key==='saguaro-arms:0'?armMatrices:batches.get(key)??[];mesh.count=matrices.length;matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}this.detailedTreeCount=detailed;this.simplifiedTreeCount=simplified;
  }
  private createBuildings(state:GameState,count:number):void {
    const random=new SeededRandom(144),dummy=new THREE.Object3D();
    const body=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.9}),count);
    const roof=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,4),new THREE.MeshStandardMaterial({color:'#484f4b',roughness:1}),count);
    const palettes=['#b04f3d','#e2dac0','#be914f','#8b392e','#b8c0b4'];
    for(let i=0;i<count;i++) {
      const town=state.towns[i%state.towns.length]!;let x=town.position.x,z=town.position.z;
      for(let attempt=0;attempt<24;attempt++){const angle=random.next()*Math.PI*2,radius=Math.sqrt(random.next())*(count>100?400:95);x=Math.max(2,Math.min(this.terrain.widthM-2,town.position.x+Math.cos(angle)*radius));z=Math.max(2,Math.min(this.terrain.depthM-2,town.position.z+Math.sin(angle)*radius));if(this.terrain.widthM<=4000||Math.abs(x-this.corridorX(z))>58)break;}
      const y=Math.max(.5,this.terrain.sample(x,z).elevationM);
      const w=7+random.next()*5,h=6+random.next()*7,d=9+random.next()*7,rotation=Math.round(random.next()*3)*Math.PI/2;
      dummy.position.set(x,y+h/2,z);dummy.rotation.set(0,rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);body.setColorAt(i,new THREE.Color(palettes[i%palettes.length]!));
      dummy.position.y=y+h+2;dummy.rotation.y=rotation+Math.PI/4;dummy.scale.set(w*.82,5,d*.82);dummy.updateMatrix();roof.setMatrixAt(i,dummy.matrix);
    }
    body.castShadow=true;roof.castShadow=true;body.computeBoundingSphere();roof.computeBoundingSphere();this.buildings.add(body,roof);this.buildingCount=count;
  }
  private createSouthwestBuildings(state:GameState,count:number):void {
    const random=new SeededRandom(519),dummy=new THREE.Object3D(),body=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:1}),count),roof=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#6f4a38',roughness:1}),count),palettes=['#c9865d','#d7aa78','#b96949','#e0c092','#8f5544'];
    for(let i=0;i<count;i++){const town=state.towns[i%state.towns.length]!;let x=town.position.x,z=town.position.z;for(let attempt=0;attempt<24;attempt++){const angle=random.next()*Math.PI*2,radius=25+Math.sqrt(random.next())*300;x=Math.max(3,Math.min(this.terrain.widthM-3,town.position.x+Math.cos(angle)*radius));z=Math.max(3,Math.min(this.terrain.depthM-3,town.position.z+Math.sin(angle)*radius));if(Math.abs(x-this.corridorX(z))>70)break;}const y=this.terrain.sample(x,z).elevationM,w=7+random.next()*9,h=3.5+random.next()*4,d=8+random.next()*11,rotation=Math.round(random.next()*3)*Math.PI/2;dummy.position.set(x,y+h/2,z);dummy.rotation.set(0,rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);body.setColorAt(i,new THREE.Color(palettes[i%palettes.length]!));dummy.position.y=y+h+.28;dummy.scale.set(w+1,.55,d+1);dummy.updateMatrix();roof.setMatrixAt(i,dummy.matrix);}
    body.castShadow=true;roof.castShadow=true;body.computeBoundingSphere();roof.computeBoundingSphere();this.buildings.add(body,roof);this.buildingCount=count;
  }
  private planningGesture=false;
  setPlanningGesture(active:boolean):void {if(active&&!this.planningGesture){this.follow=false;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=true;}this.planningGesture=active;this.controls.enabled=!active;}
  frameRoute(points:readonly Vec3[],area?:{left:number;top:number;right:number;bottom:number}):void {
    if(!points.length)return;this.follow=false;const center=new THREE.Vector3();for(const p of points)center.add(new THREE.Vector3(p.x,p.y,p.z));center.multiplyScalar(1/points.length);
    const radius=Math.max(180,...points.map(p=>Math.hypot(p.x-center.x,p.z-center.z)));this.controls.target.copy(center);this.camera.position.copy(center).add(new THREE.Vector3(radius*.45,radius*1.5,radius*1.85));this.controls.update();
    if(!area)return;
    const height=this.canvas.getBoundingClientRect().height;
    // Fit the endpoints into the actually available map, above controls and beside the planner.
    for(let pass=0;pass<7;pass++){
      this.camera.updateMatrixWorld(true);const screens=points.map(p=>this.project(p,0)),xs=screens.map(p=>p.x),ys=screens.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),scale=Math.max(1,(right-left)/(area.right-area.left),(bottom-top)/(area.bottom-area.top));
      const offset=this.camera.position.clone().sub(this.controls.target);if(scale>1.001){this.camera.position.copy(this.controls.target).add(offset.multiplyScalar(scale*1.04));this.controls.update();continue;}
      const dx=(left+right-area.left-area.right)/2,dy=(top+bottom-area.top-area.bottom)/2;if(Math.abs(dx)+Math.abs(dy)<.5)break;
      const unit=2*offset.length()*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))/height,rightAxis=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),upAxis=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion),shift=rightAxis.multiplyScalar(dx*unit).add(upAxis.multiplyScalar(-dy*unit));this.controls.target.add(shift);this.camera.position.add(shift);this.controls.update();
    }
  }
  setPreview(geometry:TrackGeometry|null,color='#edc879'):void {
    this.setAlignmentPreview(geometry?[geometry]:[],color);
  }
  setAlignmentPreview(geometries:readonly TrackGeometry[],color='#edc879',spans?:readonly (readonly EngineeringInterval[])[]):void {
    if(this.preview){this.scene.remove(this.preview);disposeObject(this.preview);this.preview=null;}
    if(geometries.length===0)return;
    const group=new THREE.Group(),material=new THREE.LineBasicMaterial({color,depthTest:false});
    geometries.forEach((geometry,index)=>{
      const sections=spans?.[index];if(!sections){const points=geometry.samples.map(s=>new THREE.Vector3(s.position.x,s.position.y+.6,s.position.z));group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material));return;}
      for(const span of sections){const count=Math.max(2,Math.min(128,Math.ceil((span.endM-span.startM)/12))),points=Array.from({length:count+1},(_,i)=>{const p=sampleDistance(geometry,span.startM+(span.endM-span.startM)*i/count);return new THREE.Vector3(p.x,p.y+1,p.z);});
        const lineMaterial=span.kind==='tunnel'?new THREE.LineDashedMaterial({color:'#f3d0b1',dashSize:8,gapSize:6,depthTest:false}):new THREE.LineBasicMaterial({color:span.kind==='bridge'?'#b1e6e0':color,depthTest:false});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMaterial);line.computeLineDistances();group.add(line);
        if(span.kind==='tunnel'&&span.endM-span.startM>15){for(const at of [0,points.length-1]){const portal=new THREE.Mesh(new THREE.TorusGeometry(4,.8,6,14),new THREE.MeshBasicMaterial({color:'#f3d0b1',depthTest:false}));portal.position.copy(points[at]!);portal.lookAt(points[at===0?1:points.length-2]!);group.add(portal);}}
        if(span.kind==='bridge'&&span.endM-span.startM>20){for(let i=1;i<points.length;i+=4){const p=points[i]!,ground=this.terrain.sample(p.x,p.z).elevationM,h=Math.max(0,p.y-ground);if(h>1){const support=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.6,h,5),new THREE.MeshBasicMaterial({color:'#b1e6e0',transparent:true,opacity:.6}));support.position.set(p.x,p.y-h/2,p.z);group.add(support);}}}
      }
    });
    group.renderOrder=10;this.preview=group;this.scene.add(group);
  }
  setStationPreview(site:StationSite|null,valid=true):void {
    if(this.preview){this.scene.remove(this.preview);disposeObject(this.preview);this.preview=null;}
    if(!site)return;
    const color=valid?'#edc879':'#d7795f',group=new THREE.Group(),local=new THREE.Group();local.position.set(site.center.x,site.center.y+.2,site.center.z);local.rotation.y=site.orientationRad;group.add(local);
    const solid=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthTest:false}),ghost=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.10,depthTest:false});
    const box=(x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);local.add(mesh);};
    box(0,0,0,site.widthM,.15,site.lengthM,ghost);
    const rails=new THREE.MeshBasicMaterial({color:valid?'#e8eee4':'#f5b49b',depthTest:false});
    for(const x of [-.7175,.7175])box(x,.7,0,.18,.22,site.lengthM,rails);
    const sleeper=new THREE.InstancedMesh(new THREE.BoxGeometry(2.7,.16,.28),solid,Math.ceil(site.lengthM/1.9)),matrix=new THREE.Matrix4();for(let i=0;i<sleeper.count;i++){matrix.makeTranslation(0,.48,-site.lengthM/2+i*1.9);sleeper.setMatrixAt(i,matrix);}local.add(sleeper);
    box(3.6,.65,0,3.8,1,Math.max(12,site.lengthM-12),solid);
    // A small transparent shelter makes the platform side legible before purchase.
    box(4,2.8,0,3.2,3.4,7,ghost);box(4,4.65,0,4,.25,8,solid);
    for(const point of [site.portA,site.portB]){const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.8,8,32),new THREE.MeshBasicMaterial({color,depthTest:false}));ring.rotation.x=Math.PI/2;ring.position.set(point.x,point.y+1.2,point.z);group.add(ring);}
    group.renderOrder=10;this.preview=group;this.scene.add(group);
  }
  setMarker(position:Vec3|null,color='#edc879'):void {
    if(this.marker){this.scene.remove(this.marker);disposeObject(this.marker);this.marker=null;}
    if(!position)return;
    const group=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(9,.7,8,36),new THREE.MeshBasicMaterial({color,depthTest:false})),pin=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,16,8),new THREE.MeshBasicMaterial({color,depthTest:false}));ring.rotation.x=Math.PI/2;pin.position.y=8;group.add(ring,pin);group.position.set(position.x,position.y+1.2,position.z);group.renderOrder=11;this.marker=group;this.scene.add(group);
  }
  setRailPortHandles(points:readonly Vec3[]):void {
    if(this.portHandles){this.scene.remove(this.portHandles);disposeObject(this.portHandles);this.portHandles=null;}
    if(points.length===0)return;
    const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:'#edc879',depthTest:false});
    for(const point of points){const ring=new THREE.Mesh(new THREE.TorusGeometry(6,.8,8,32),material);ring.rotation.x=Math.PI/2;ring.position.set(point.x,point.y+1.2,point.z);group.add(ring);}
    group.renderOrder=12;this.portHandles=group;this.scene.add(group);
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
    this.scene.remove(this.trees);disposeObject(this.trees);this.trees=enabled?(this.assetLevels.has('norway-spruce')?this.authoredForest(20000):this.createForest(20000)):(this.assetLevels.has('norway-pine')?this.authoredScenery(state):this.assetLevels.has('norway-spruce')?this.authoredForest(this.profile.vegetation.density):this.createForest(this.profile.vegetation.density));this.scene.add(this.trees);
    this.scene.remove(this.buildings);disposeObject(this.buildings);this.buildings=new THREE.Group();if(enabled&&this.assetLevels.has('norway-house'))this.buildings=this.legacyAuthoredBuildings(state,2000);else if(!enabled&&this.assetLevels.has('norway-house-red-white'))this.buildings=this.authoredSettlements(state);else if(this.assetLevels.has('norway-house'))this.buildings=this.legacyAuthoredBuildings(state,360);else this.createBuildings(state,enabled?2000:90);this.scene.add(this.buildings);
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
  setTerrainBlockout(enabled:boolean):void {if(enabled){this.terrainBlockoutMaterial??=new THREE.MeshStandardMaterial({color:'#8b9188',roughness:1,metalness:0});this.landscape.material=this.terrainBlockoutMaterial;}else{this.landscape.material=this.terrainSurfaceMaterial;this.terrainBlockoutMaterial?.dispose();this.terrainBlockoutMaterial=null;}}
  private electrificationKey(state:Readonly<GameState>):string {return Object.entries(state.operations.infrastructure).filter(([,item])=>item.electrified).map(([edgeId])=>edgeId).sort().join('|');}
  private rebuildTracks(state:Readonly<GameState>):void {
    this.scene.remove(this.trackGroup);disposeObject(this.trackGroup);this.trackGroup=new THREE.Group();
    this.geometry=compileGraph(structuredClone(state.railway));this.railwayRevision=state.railway.revision;this.railwaySignature=railwayKey(state);this.electrificationSignature=this.electrificationKey(state);
    for(const [edgeId,track] of this.geometry){this.trackGroup.add(createTrack(track,this.terrain));if(state.operations.infrastructure[edgeId]?.electrified)this.trackGroup.add(createElectrification(track));}
    for(const station of state.stations){
      const node=state.railway.nodes.find(item=>item.id===station.nodeId);if(!node)continue;
      const edge=state.railway.edges.find(item=>item.from===node.id||item.to===node.id),other=edge?state.railway.nodes.find(item=>item.id===(edge.from===node.id?edge.to:edge.from)):undefined;
      const yaw=station.layout.kind==='single-platform'?station.layout.orientationRad:other?Math.atan2(-(other.position.x-node.position.x),-(other.position.z-node.position.z)):0;
      const platform=createStationPlatform(station.layout.kind==='single-platform'?station.layout.pad.lengthM:28);platform.position.set(node.position.x,node.position.y,node.position.z);platform.rotation.y=yaw;platform.userData.selection={kind:'station',id:station.id} satisfies WorldSelection;this.trackGroup.add(platform);
    }
    this.scene.add(this.trackGroup);if(this.assetLevels.size>0){this.rebuildAuthoredInfrastructure(state);this.replaceAuthoredScenery(state);}
  }
  private rebuildTerrain(state:Readonly<GameState>):void {const previous=this.landscape,next=terrainMesh(this.terrain,this.profile);next.visible=previous.visible;this.scene.remove(previous);previous.geometry.dispose();this.terrainSurfaceMaterial.dispose();this.landscape=next;this.terrainSurfaceMaterial=next.material;this.terrainRevision=state.operations.terrain.revision;if(this.terrainBlockoutMaterial)this.landscape.material=this.terrainBlockoutMaterial;this.scene.add(this.landscape);this.terrainErrorM=0;this.verifyTerrain();}
  focus(position:Vec3):void {this.follow=false;this.controls.target.set(position.x,position.y,position.z);this.camera.position.set(position.x+160,position.y+110,position.z+190);this.controls.update();}
  canFollowTrain():boolean {return followTarget(this.modelState)!==undefined;}
  followTrain(id?:string):boolean {
    const preferred=id??(this.selection?.kind==='train'?this.selection.id:undefined),train=followTarget(this.modelState,preferred)??(id===undefined?followTarget(this.modelState):undefined);
    if(!train)return false;
    const position=motionPosition(train.motion,this.geometry);this.trainPosition.set(position.x,position.y,position.z);this.focus(position);
    this.camera.position.copy(this.trainPosition).add(new THREE.Vector3(35,21,45));this.camera.position.y=Math.max(this.camera.position.y,this.terrain.sample(Math.max(0,Math.min(this.terrain.widthM,this.camera.position.x)),Math.max(0,Math.min(this.terrain.depthM,this.camera.position.z))).elevationM+8);
    this.followedTrainId=train.id;this.follow=true;this.controls.update();return true;
  }
  setVehicleInspection(view:'front'|'left'|'right'|'roof',assetId='nord-2-6-0'):void {if(!this.assetLevels.has(assetId))return;if(this.inspectionAssetId!==assetId){if(this.inspectionModel){this.scene.remove(this.inspectionModel);disposeObject(this.inspectionModel);}this.inspectionModel=this.cloneLod(assetId);this.inspectionAssetId=assetId;this.inspectionModel.position.set(0,100,0);this.scene.add(this.inspectionModel);}this.landscape.visible=false;this.water.visible=false;this.shoreContact.visible=false;this.waterfall.visible=false;this.trackGroup.visible=false;this.infrastructureModels.visible=false;this.buildings.visible=false;this.trees.visible=false;for(const model of this.trainModels.values())model.group.visible=false;for(const station of this.stationModels.values())station.visible=false;const car=this.inspectionModel!;car.updateMatrixWorld(true);const origin=car.getWorldPosition(new THREE.Vector3()),target=origin.clone().add(new THREE.Vector3(0,2.5,0)),probe=car.getObjectByName('forward_probe')?.getWorldPosition(new THREE.Vector3()),forward=(probe??origin.clone().add(new THREE.Vector3(0,0,-1))).sub(origin).setY(0).normalize(),right=new THREE.Vector3(forward.z,0,-forward.x),offset=view==='front'?forward.multiplyScalar(21).add(new THREE.Vector3(0,4,0)):view==='left'?right.multiplyScalar(-24).add(new THREE.Vector3(0,5,0)):view==='right'?right.multiplyScalar(24).add(new THREE.Vector3(0,5,0)):right.multiplyScalar(10).addScaledVector(forward,-8).add(new THREE.Vector3(0,21,0));this.follow=false;this.controls.target.copy(target);this.camera.position.copy(target).add(offset);this.controls.update();}
  setCameraPreset(id:string):void {if(this.terrain.widthM<=4000){this.regional();return;}const preset=this.content.presentation.cameraPresets[id];if(!preset)throw new Error(`Unknown camera preset: ${id}`);const sample=this.terrain.sample(preset.targetXZ.x,preset.targetXZ.z),target=new THREE.Vector3(preset.targetXZ.x,sample.elevationM,preset.targetXZ.z);this.follow=false;this.controls.target.copy(target);this.camera.position.set(target.x+preset.offset.x,target.y+preset.offset.y,target.z+preset.offset.z);this.controls.update();}
  setCameraSweep(progress:number):void {const ids=this.content.presentation.cameraSweep;if(ids.length<2){this.regional();return;}const scaled=Math.max(0,Math.min(.999999,progress))*(ids.length-1),index=Math.floor(scaled),mix=scaled-index,a=this.content.presentation.cameraPresets[ids[index]!]!,b=this.content.presentation.cameraPresets[ids[index+1]!]!,x=THREE.MathUtils.lerp(a.targetXZ.x,b.targetXZ.x,mix),z=THREE.MathUtils.lerp(a.targetXZ.z,b.targetXZ.z,mix),target=new THREE.Vector3(x,this.terrain.sample(x,z).elevationM,z),offset=new THREE.Vector3(a.offset.x,a.offset.y,a.offset.z).lerp(new THREE.Vector3(b.offset.x,b.offset.y,b.offset.z),mix);this.follow=false;this.controls.target.copy(target);this.camera.position.copy(target).add(offset);this.controls.update();}
  private showWorld():void {if(this.inspectionModel){this.scene.remove(this.inspectionModel);disposeObject(this.inspectionModel);this.inspectionModel=null;this.inspectionAssetId='';}this.landscape.visible=true;this.water.visible=this.terrain.waterLevelM!==null;this.shoreContact.visible=this.terrain.waterLevelM!==null;this.waterfall.visible=this.content.worldGenerator.landforms.waterfall!==null;this.trackGroup.visible=true;this.infrastructureModels.visible=true;this.buildings.visible=true;this.trees.visible=true;for(const model of this.trainModels.values())model.group.visible=true;for(const station of this.stationModels.values())station.visible=true;}
  entry():void {this.showWorld();if(this.terrain.widthM>4000){this.setCameraPreset(this.content.presentation.entryCameraId);return;}this.follow=false;this.controls.target.set(1850,80,1970);this.camera.position.set(2010,190,2160);this.controls.update();}
  regional():void {this.showWorld();if(this.terrain.widthM>4000){this.setCameraPreset('regional');return;}this.follow=false;this.controls.target.set(1850,80,1970);this.camera.position.set(3500,1750,3900);this.controls.update();}
  resize():void {const {width,height}=this.canvas.getBoundingClientRect();this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  update(previous:Readonly<GameState>,current:Readonly<GameState>,alpha:number):void {
    this.modelState=current;this.syncLabels(current);if(this.buildings.userData.roadEra!==streetEra(currentYear(current))||this.buildings.userData.roadTerrainRevision!==current.operations.terrain.revision)this.addVillageRoads(this.buildings,current);if(current.operations.terrain.revision!==this.terrainRevision)this.rebuildTerrain(current);if(current.railway.revision!==this.railwayRevision||railwayKey(current)!==this.railwaySignature||this.electrificationKey(current)!==this.electrificationSignature)this.rebuildTracks(current);this.updateTrainModels(current);this.syncStationModels(current);
    this.syncOverlay(current);this.syncSelectionMarker(current);
    if(this.follow){const lead=followTarget(current,this.followedTrainId);if(!lead)this.follow=false;else{const old=this.trainPosition.clone(),position=motionPosition(lead.motion,this.geometry);this.trainPosition.set(position.x,position.y,position.z);const delta=this.trainPosition.clone().sub(old);this.controls.target.add(delta);this.camera.position.add(delta);}}
    const shift=new THREE.Vector3((this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0),0,(this.keys.has('KeyS')?1:0)-(this.keys.has('KeyW')?1:0));
    if(!this.planningGesture&&shift.lengthSq()){shift.multiplyScalar(this.camera.position.distanceTo(this.controls.target)*.006);this.camera.position.add(shift);this.controls.target.add(shift);this.follow=false;}
    const {x,z}=this.camera.position;
    if(!this.inspectionModel&&x>=0&&z>=0&&x<=this.terrain.widthM&&z<=this.terrain.depthM)this.camera.position.y=Math.max(this.camera.position.y,this.terrain.sample(x,z).elevationM+8);
    if(!this.planningGesture)this.controls.update();this.sun.target.position.copy(this.controls.target);this.sun.position.copy(this.controls.target).add(this.sunOffset);this.updateSceneryLod();this.updateSouthwestLod();
    this.water.material.uniforms.time!.value=current.tick*.05;
    this.waterfall.material.uniforms.time!.value=current.tick*.05;
    if(this.stressTrains){const dummy=new THREE.Object3D(),track=[...this.geometry.values()][1]!;for(let i=0;i<99;i++){const s=(i*11+current.tick*.9)%track.lengthM,p=sampleDistance(track,s),q=sampleDistance(track,Math.min(track.lengthM,s+1));dummy.position.set(p.x,p.y+1.6,p.z);dummy.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);dummy.updateMatrix();this.stressTrains.setMatrixAt(i,dummy.matrix);}this.stressTrains.instanceMatrix.needsUpdate=true;}
    this.renderer.render(this.scene,this.camera);
  }
  project(position:Vec3,elevationOffset=25):{x:number;y:number;visible:boolean} {const vector=new THREE.Vector3(position.x,position.y+elevationOffset,position.z).project(this.camera),rect=this.canvas.getBoundingClientRect();return {x:(vector.x+1)*rect.width/2,y:(1-vector.y)*rect.height/2,visible:vector.z>-1&&vector.z<1&&Math.abs(vector.x)<1&&Math.abs(vector.y)<1};}
  pick(screenX:number,screenY:number):Vec3|null {const rect=this.canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((screenX-rect.left)/rect.width*2-1,-(screenY-rect.top)/rect.height*2+1),this.camera);const point=ray.intersectObject(this.landscape)[0]?.point;return point?{x:point.x,y:point.y,z:point.z}:null;}
  pickEntity(screenX:number,screenY:number):WorldSelection|null {const rect=this.canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((screenX-rect.left)/rect.width*2-1,-(screenY-rect.top)/rect.height*2+1),this.camera);const roots=[...this.trainModels.values()].map(item=>item.group as THREE.Object3D).concat([...this.stationModels.values()]);for(const hit of ray.intersectObjects(roots,true)){let object:THREE.Object3D|null=hit.object;while(object){if(object.userData.selection)return object.userData.selection as WorldSelection;object=object.parent;}}return null;}
  private verifyTerrain():void {this.landscape.updateMatrixWorld(true);const scale=this.terrain.widthM/4000;for(const [x,z] of [[2173,1857],[2411,932],[1601,2047],[2809,2991]]){const sx=x!*scale,sz=z!*scale,ray=new THREE.Raycaster(new THREE.Vector3(sx,3000,sz),new THREE.Vector3(0,-1,0)),hit=ray.intersectObject(this.landscape)[0];if(!hit)throw new Error('Terrain raycast missed');this.terrainErrorM=Math.max(this.terrainErrorM,Math.abs(hit.point.y-this.terrain.sample(sx,sz).elevationM));}if(this.terrainErrorM>.001)throw new Error('Rendered terrain differs from simulation');}
  stats():RenderStats {const info=this.renderer.info,first=[...this.trainModels.values()][0]?.cars[0],terrainPatchCells=this.terrain instanceof EngineeredTerrain?this.terrain.affectedCellKeys().size:0,patchDivisions=Math.max(1,Math.ceil(this.terrain.cellM/ENGINEERED_PATCH_CELL_M));return {calls:info.render.calls,triangles:info.render.triangles,terrainTriangles:(this.landscape.geometry.getIndex()?.count??this.landscape.geometry.getAttribute('position').count)/3,terrainPatchTriangles:terrainPatchCells*patchDivisions*patchDivisions*2,geometries:info.memory.geometries,textures:info.memory.textures,trees:this.treeCount,detailedTrees:this.detailedTreeCount,simplifiedTrees:this.simplifiedTreeCount,buildings:this.buildingCount,trains:this.stressTrains?this.stressCount:this.trainModels.size,lod:first?.getCurrentLevel()??0,terrainErrorM:this.terrainErrorM,terrainPatchCells,...this.structureCounts,contextLost:this.renderer.getContext().isContextLost()};}
  dispose():void {window.removeEventListener('resize',this.onResize);window.removeEventListener('keydown',this.keyDown);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.clearKeys);this.controls.removeEventListener('start',this.controlStart);this.controls.dispose();if(this.terrainBlockoutMaterial){this.landscape.material=this.terrainSurfaceMaterial;this.terrainBlockoutMaterial.dispose();this.terrainBlockoutMaterial=null;}disposeObject(this.scene);if(this.ownsRenderer){this.renderer.dispose();this.renderer.forceContextLoss();}}
}
export class CampaignRenderHost {
  readonly renderer:THREE.WebGLRenderer;
  private disposed=false;
  constructor(private readonly canvas:HTMLCanvasElement) {this.renderer=createWebGLRenderer(canvas);configureWebGLRenderer(this.renderer);}
  create(terrain:GridTerrain,state:GameState,content:CampaignContent):FjordRenderer {if(this.disposed)throw new Error('Render host is disposed');if(!['fjord','terrain-study'].includes(content.presentation.rendererId))throw new Error(`Unsupported renderer: ${content.presentation.rendererId}`);return new FjordRenderer(this.canvas,terrain,state,content,this.renderer);}
  dispose():void {if(this.disposed)return;this.renderer.dispose();this.renderer.forceContextLoss();this.disposed=true;}
}
function createWebGLRenderer(canvas:HTMLCanvasElement):THREE.WebGLRenderer {return new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
function configureWebGLRenderer(renderer:THREE.WebGLRenderer):void {renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;}
function terrainSize(terrain:GridTerrain):number {return Math.max(terrain.widthM,terrain.depthM);}
function railwayKey(state:Readonly<GameState>):string {return `${state.railway.revision}|${state.railway.nodes.map(node=>`${node.id}:${node.position.x}:${node.position.y}:${node.position.z}`).join(',')}|${state.railway.edges.map(edge=>`${edge.id}:${edge.from}:${edge.to}`).join(',')}`;}
export function disposeObject(root:THREE.Object3D,disposeSharedTextures=root instanceof THREE.Scene):void {
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  root.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Points){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);}if(object instanceof THREE.InstancedMesh)object.dispose();if(object instanceof THREE.DirectionalLight||object instanceof THREE.SpotLight||object instanceof THREE.PointLight)object.shadow.dispose();});
  const textures=new Set<THREE.Texture>();for(const material of materials)for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value);
  geometries.forEach(g=>g.dispose());textures.forEach(t=>{if(disposeSharedTextures||!t.userData.assetLibrary)t.dispose();});materials.forEach(m=>m.dispose());
}
