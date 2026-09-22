import type {GameState} from '../domain/model.js';
import type {GridTerrain} from '../world/terrain.js';
import {SeededRandom} from '../world/random.js';
import {compileGraph} from '../rail/graph.js';

export type SceneryCategory='tree'|'understorey'|'rock';
export interface SceneryPlacement {id:string;assetId:string;category:SceneryCategory;x:number;y:number;z:number;rotationY:number;scale:number}
export interface SceneryTargets {trees:number;understorey:number;rocks:number}
const defaults:SceneryTargets={trees:28000,understorey:12000,rocks:1800};
const cellKey=(x:number,z:number,size:number)=>`${Math.floor(x/size)}:${Math.floor(z/size)}`;

function trackBuckets(state:Pick<GameState,'railway'>,size=100):Map<string,{x:number;z:number}[]> {
  const buckets=new Map<string,{x:number;z:number}[]>();
  for(const track of compileGraph(structuredClone(state.railway)).values())for(const sample of track.samples){const point={x:sample.position.x,z:sample.position.z},key=cellKey(point.x,point.z,size),bucket=buckets.get(key)??[];bucket.push(point);buckets.set(key,bucket);}
  return buckets;
}

function closeToTrack(x:number,z:number,buckets:Map<string,{x:number;z:number}[]>,clearance:number,size=100):boolean {
  const cx=Math.floor(x/size),cz=Math.floor(z/size),range=Math.ceil(clearance/size);
  for(let dz=-range;dz<=range;dz++)for(let dx=-range;dx<=range;dx++)for(const point of buckets.get(`${cx+dx}:${cz+dz}`)??[])if(Math.hypot(x-point.x,z-point.z)<clearance)return true;
  return false;
}

function closeToOperations(x:number,z:number,state:Pick<GameState,'towns'|'industries'|'stations'|'railway'>):boolean {
  if(state.towns.some(item=>Math.hypot(x-item.position.x,z-item.position.z)<330))return true;
  if(state.industries.some(item=>Math.hypot(x-item.position.x,z-item.position.z)<58))return true;
  return state.stations.some(station=>{const node=state.railway.nodes.find(item=>item.id===station.nodeId);return node!==undefined&&Math.hypot(x-node.position.x,z-node.position.z)<34;});
}

function treeAsset(y:number,rock:number,moisture:number,roll:number):string {
  if(y<145&&moisture>.25&&roll<.6)return 'norway-alder';
  if((y>580&&roll<.6)||(moisture>-.2&&roll<.3))return 'norway-birch';
  if((rock>.26||moisture<-.42)&&roll<.7)return 'norway-pine';
  if(y>490||roll>.7)return 'norway-spruce-narrow';
  return 'norway-spruce';
}

/** Pure scenery generation. It consumes its own RNG and never advances simulation state. */
export function generateNorwayScenery(terrain:GridTerrain,state:Pick<GameState,'world'|'railway'|'towns'|'industries'|'stations'>,targets:Partial<SceneryTargets>={}):ReadonlyArray<SceneryPlacement> {
  const desired={...defaults,...targets},tracks=trackBuckets(state),result:SceneryPlacement[]=[],occupied=new Set<string>();
  // Shared woodland nuclei: trees form stands, low scrub occupies their wider fringes.
  const nucleiRandom=new SeededRandom((state.world.seed^0x749cb121)>>>0),nuclei=Array.from({length:1200},()=>({x:nucleiRandom.next()*terrain.widthM,z:nucleiRandom.next()*terrain.depthM,radius:45+nucleiRandom.next()*125}));
  const generate=(category:SceneryCategory,count:number,seedOffset:number)=>{
    const random=new SeededRandom((state.world.seed^0x51ce7e11^seedOffset)>>>0);let accepted=0;
    for(let attempt=0;accepted<count&&attempt<count*110;attempt++){
      const nucleus=nuclei[Math.floor(random.next()*nuclei.length)]!,angle=random.next()*Math.PI*2,radius=Math.sqrt(random.next())*nucleus.radius*(category==='understorey'?1.25:1),clustered=category!=='rock'&&random.next()<.86;
      const x=clustered?nucleus.x+Math.cos(angle)*radius:1+random.next()*(terrain.widthM-2),z=clustered?nucleus.z+Math.sin(angle)*radius:1+random.next()*(terrain.depthM-2),roll=random.next(),choice=random.next(),scaleRoll=random.next(),lodRoll=random.next(),rotationRoll=random.next();
      if(x<1||z<1||x>=terrain.widthM-1||z>=terrain.depthM-1)continue;
      const sample=terrain.sample(x,z),plane=terrain.planeAt(x,z),slope=Math.hypot(plane.dx,plane.dz),moisture=Math.sin(x*.0013-z*.0019)+Math.sin((x+z)*.00041),patch=.5+.5*Math.sin(x*.0021+Math.sin(z*.00071)*2.4)*Math.cos(z*.0017-x*.00033),rockPatch=.5+.5*Math.sin(x*.0037-z*.0011+Math.sin(z*.0009)*1.7)*Math.cos(z*.0029+x*.0004);
      if(x<1||z<1||x>=terrain.widthM-1||z>=terrain.depthM-1||sample.elevationM<=1.6||closeToTrack(x,z,tracks,category==='rock'?16:13)||closeToOperations(x,z,state))continue;
      let assetId='',scale=1,clearanceCell=5;
      if(category==='tree'){
        if(sample.elevationM>810||slope>.78||sample.forest<.18||patch<.34||roll>Math.min(.96,sample.forest*.7+patch*.44)*Math.min(1,(840-sample.elevationM)/220))continue;
        assetId=treeAsset(sample.elevationM,sample.rock,moisture,choice);scale=(.68+scaleRoll*.72)*Math.max(.58,1-Math.max(0,sample.elevationM-440)/850);
      }else if(category==='understorey'){
        if(sample.elevationM>860||slope>.65||sample.forest<.12||patch<.18||roll>.82)continue;
        assetId=moisture>.4&&sample.elevationM<420&&choice<.24?'norway-fern':'norway-shrub';scale=.8+scaleRoll*1.25;clearanceCell=4;
      }else{
        if(sample.elevationM>1100||slope>.98||sample.rock<.2||rockPatch<.46||roll>Math.min(.9,sample.rock*.92+slope*.45))continue;
        assetId=choice<.24?'norway-boulder-a':choice<.48?'norway-boulder-b':choice<.66?'norway-outcrop-a':choice<.82?'norway-outcrop-b':'norway-scree';scale=.7+scaleRoll*1.15;clearanceCell=16;
      }
      const occupancy=cellKey(x,z,clearanceCell);if(occupied.has(`${category}:${occupancy}`))continue;occupied.add(`${category}:${occupancy}`);
      void lodRoll;result.push({id:`${category}:${seedOffset+attempt}`,assetId,category,x,y:sample.elevationM,z,rotationY:rotationRoll*Math.PI*2,scale});accepted++;
    }
    if(accepted<count)throw new Error(`Could place only ${accepted}/${count} ${category} scenery records`);
  };
  generate('tree',desired.trees,0);generate('understorey',desired.understorey,1_000_000);generate('rock',desired.rocks,2_000_000);return result;
}
