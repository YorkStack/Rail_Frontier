import type {GameState} from '../domain/model.js';
import type {GridTerrain} from '../world/terrain.js';
import {SeededRandom} from '../world/random.js';
import {compileGraph} from '../rail/graph.js';
import {currentYear} from '../simulation/calendar.js';
import type {SceneryPlacement} from './scenery-placement.js';
import type {AccessPlot} from '../world/settlement-access.js';
export type RegionalPlot=AccessPlot&{y:number};
const regionOf=(state:Pick<GameState,'world'>)=>state.world.biomeId==='southwest'?'arizona':state.world.biomeId;
function clearOfRails(state:Readonly<GameState>):(x:number,z:number,r:number)=>boolean {
 const buckets=new Map<string,{x:number;z:number}[]>();for(const geometry of compileGraph(structuredClone(state.railway)).values())for(const s of geometry.samples){const p=s.position,k=`${Math.floor(p.x/100)}:${Math.floor(p.z/100)}`,items=buckets.get(k)??[];items.push(p);buckets.set(k,items);}
 return(x,z,r)=>{const cx=Math.floor(x/100),cz=Math.floor(z/100);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const p of buckets.get(`${cx+dx}:${cz+dz}`)??[])if(Math.hypot(x-p.x,z-p.z)<r)return false;return !state.stations.some(s=>{const n=state.railway.nodes.find(n=>n.id===s.nodeId);return n&&Math.hypot(x-n.position.x,z-n.position.z)<r+40;});};
}
export function generateRegionalPlots(terrain:GridTerrain,state:Readonly<GameState>):RegionalPlot[] {
 const region=regionOf(state),plots:RegionalPlot[]=[],clear=clearOfRails(state),year=currentYear(state);
 const add=(asset:string,x:number,z:number,townId:string|null,rotationY=0,radius=12)=>{if(x<25||z<25||x>terrain.widthM-25||z>terrain.depthM-25||!clear(x,z,radius+16))return false;const s=terrain.sample(x,z),p=terrain.planeAt(x,z);if(s.elevationM<(s.waterLevelM??-999)+1.5||Math.hypot(p.dx,p.dz)>.20||plots.some(a=>Math.hypot(x-a.x,z-a.z)<radius+a.footprintRadiusM+3))return false;plots.push({id:`regional:${region}:${plots.length}`,assetId:`${region}-${asset}`,x,y:s.elevationM,z,townId,rotationY,scale:1,footprintRadiusM:radius});return true;};
 for(const town of state.towns){
  if(region==='arizona'){add('windpump',town.position.x+225,town.position.z-180,null,0,9);for(let i=0;i<6;i++)add('ranch-fence',town.position.x+245,town.position.z-200+i*8,null,0,2);continue;}
  const styles=region==='rhine'?['half-timber','stone-house','shop','brick-house','villa','barn']:['terrace','brick-house','shop','terrace','stone-house','barn'];
  let accepted=0;
  // Search outward from the real settlement coordinate. Narrow river towns can
  // occupy only one bank, while flatter English towns naturally spread wider.
  for(let attempt=0;accepted<54&&attempt<1500;attempt++){
   const ring=Math.floor(attempt/30),angle=attempt*2.399963+Number(town.id.split(':')[1]),radius=44+ring*13+(attempt%5)*4;
   const x=town.position.x+Math.cos(angle)*radius,z=town.position.z+Math.sin(angle)*radius*.72,rotationY=Math.atan2(town.position.x-x,town.position.z-z);
   if(add(styles[(accepted+ring)%styles.length]!,x,z,town.id,rotationY,region==='tyne'?10:8))accepted++;
  }
  add('church',town.position.x-210,town.position.z+60,town.id,0,18);
  for(let i=0;i<4;i++)add(year>=1930?'truck':'cart',town.position.x-110+i*65,town.position.z+12,null,Math.PI/2,3);
  add('water-tower',town.position.x+210,town.position.z+80,null,0,6);
 }
 if(region!=='arizona'){
  for(const industry of state.industries){const {x,z}=industry.position,kind=industry.definitionId.includes('mine')?'mine':industry.definitionId.includes('port')||industry.definitionId.includes('terminal')?'warehouse':'factory';add(kind,x,z,null,0,22);add('crates',x+32,z+8,null,0,4);if(kind==='warehouse'){
    add('crane',x+40,z+30,null,0,12);
    for(let a=0;a<48;a++){const angle=a*2.4,r=100+Math.floor(a/12)*75,bx=x+Math.cos(angle)*r,bz=z+Math.sin(angle)*r;if(bx<20||bz<20||bx>terrain.widthM-20||bz>terrain.depthM-20)continue;const water=terrain.sample(bx,bz).waterLevelM;if(water===null||[[0,0],[-4,-13],[4,13]].some(([dx,dz])=>terrain.sample(bx+dx!,bz+dz!).elevationM>water-1.5))continue;plots.push({id:`barge:${industry.id}`,assetId:`${region}-barge`,x:bx,y:water-1.3,z:bz,townId:null,rotationY:0,scale:1,footprintRadiusM:14});break;}
   }}
  const last=state.towns[1]!;for(let r=380;r<=1000;r+=80)if(add(region==='rhine'?'castle':'lighthouse',last.position.x+r,last.position.z+100,null,0,20))break;
 }
 if(region!=='arizona'){for(const house of [...plots].filter(p=>p.townId).filter((_,i)=>i%3===0))add('hedge',house.x+13,house.z+16,null,house.rotationY,2);}
 return plots;
}
export function generateRegionalScenery(terrain:GridTerrain,state:Readonly<GameState>,count=26000):SceneryPlacement[] {
 const region=regionOf(state),arizona=region==='arizona',random=new SeededRandom(state.world.seed^0x751abc),clear=clearOfRails(state),out:SceneryPlacement[]=[],nuclei=Array.from({length:700},()=>({x:random.next()*terrain.widthM,z:random.next()*terrain.depthM}));
 for(const town of state.towns)for(let i=0;i<35;i++){const a=i*2.4,r=360+i*16;nuclei.push({x:town.position.x+Math.cos(a)*r,z:town.position.z+Math.sin(a)*r});}
 for(let i=0;i<count*12&&out.length<count;i++){
  const nucleus=nuclei[Math.floor(random.next()*nuclei.length)]!,cluster=random.next()<.8,angle=random.next()*Math.PI*2,r=Math.sqrt(random.next())*190;
  const x=cluster?nucleus.x+Math.cos(angle)*r:random.next()*terrain.widthM,z=cluster?nucleus.z+Math.sin(angle)*r:random.next()*terrain.depthM;
  if(x<10||z<10||x>terrain.widthM-10||z>terrain.depthM-10)continue;
  const s=terrain.sample(x,z),p=terrain.planeAt(x,z),slope=Math.hypot(p.dx,p.dz),roll=random.next();
  if(s.elevationM<(s.waterLevelM??-999)+2||slope>.8||!clear(x,z,17)||state.towns.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<315)||state.industries.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<65))continue;
  let asset:string,category:SceneryPlacement['category'];
  if(arizona){const wash=s.forest>.28;asset=s.elevationM>650?(roll<.4?'juniper':roll<.7?'sage':'grass'):wash?(roll<.35?'mesquite':roll<.7?'creosote':'grass'):roll<.12?'saguaro':roll<.35?'prickly-pear':roll<.55?'yucca':roll<.83?'creosote':'sage';category=['juniper','mesquite','saguaro'].includes(asset)?'tree':'understorey';}
  else if(slope>.36&&roll<.4){asset='rock';category='rock';}
  else if(roll<s.forest*.8){asset=region==='rhine'?(slope>.2?'pine':roll<.16?'oak':'beech'):(roll<.12?'oak':'birch');category='tree';}
  else {asset=region==='rhine'?(slope>.12?'vine':roll<.7?'hedge':'grass'):(slope>.12?'gorse':roll<.7?'hedge':'grass');category='understorey';}
  out.push({id:`${region}-plant:${out.length}`,assetId:`${region}-${asset}`,category,x,y:s.elevationM,z,rotationY:random.next()*Math.PI*2,scale:.65+random.next()*.65});
 }
 return out;
}
