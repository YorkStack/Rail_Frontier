import type {GameState} from '../domain/model.js';
import type {GridTerrain} from '../world/terrain.js';
import {SeededRandom} from '../world/random.js';
import {compileGraph} from '../rail/graph.js';

export type SettlementComposition='harbour-row'|'farm-courts'|'mountain-terraces'|'industry';
export interface BuildingPlacement {id:string;assetId:string;townId:string|null;composition:SettlementComposition;x:number;y:number;z:number;rotationY:number;scale:number;footprintRadiusM:number}
export const houseFinishes=Object.freeze(['red-white','red-dark','ochre-white','ochre-cream','charcoal-white','charcoal-dark','white-red','white-dark'] as const);

const distanceToSegment=(x:number,z:number,ax:number,az:number,bx:number,bz:number)=>{const dx=bx-ax,dz=bz-az,length=dx*dx+dz*dz,t=length===0?0:Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/length));return Math.hypot(x-(ax+dx*t),z-(az+dz*t));};
function trackSamples(state:Pick<GameState,'railway'>):{x:number;z:number}[][] {return [...compileGraph(structuredClone(state.railway)).values()].map(track=>track.samples.map(sample=>({x:sample.position.x,z:sample.position.z})));}
function nearTrack(x:number,z:number,tracks:{x:number;z:number}[][],clearance=30):boolean {return tracks.some(points=>points.some((point,index)=>index>0&&distanceToSegment(x,z,points[index-1]!.x,points[index-1]!.z,point.x,point.z)<clearance));}
function overlaps(x:number,z:number,radius:number,records:ReadonlyArray<BuildingPlacement>):boolean {return records.some(item=>Math.hypot(x-item.x,z-item.z)<radius+item.footprintRadiusM+3);}

/** Deterministic visual settlement content. It is derived data and never enters saves. */
export function generateNorwaySettlements(terrain:GridTerrain,state:Pick<GameState,'world'|'railway'|'towns'|'industries'>,housesPerTown=15):ReadonlyArray<BuildingPlacement> {
  const records:BuildingPlacement[]=[],tracks=trackSamples(state),random=new SeededRandom((state.world.seed^0x6a11a9e)>>>0);
  const compositions:SettlementComposition[]=['harbour-row','farm-courts','mountain-terraces'];
  for(let townIndex=0;townIndex<state.towns.length;townIndex++){
    const town=state.towns[townIndex]!,composition=compositions[townIndex]!,finishOrder=townIndex===0?[0,2,6,4,1,3,7,5]:townIndex===1?[0,4,2,1,6,5,3,7]:[4,0,6,2,5,1,7,3];let accepted=0;
    for(let attempt=0;accepted<housesPerTown&&attempt<housesPerTown*30;attempt++){
      const jitterA=(random.next()-.5)*12,jitterB=(random.next()-.5)*12,index=accepted;let dx=0,dz=0,rotation=0;
      if(composition==='harbour-row'){const row=Math.floor(attempt/7)%4,column=attempt%7-3;dx=column*29+jitterA;dz=78+row*38+jitterB;rotation=Math.PI/2;}
      else if(composition==='farm-courts'){const court=attempt%3,slot=Math.floor(attempt/3)%8,angle=slot/8*Math.PI*2+court*.28,radius=34+(slot%2)*18,centres=[[-82,-65],[94,18],[-8,108]] as const;dx=Math.cos(angle)*radius+centres[court]![0]+jitterA;dz=Math.sin(angle)*radius+centres[court]![1]+jitterB;rotation=-angle+Math.PI/2;}
      else {const row=Math.floor(attempt/7)%4,column=attempt%7-3;dx=column*27+(row%2)*13+jitterA;dz=-112+row*42+jitterB;rotation=0;}
      const x=town.position.x+dx,z=town.position.z+dz;if(x<15||z<15||x>terrain.widthM-15||z>terrain.depthM-15)continue;const sample=terrain.sample(x,z),slope=Math.hypot(terrain.planeAt(x,z).dx,terrain.planeAt(x,z).dz),radius=7.5;
      if(sample.elevationM<=2||slope>.24||nearTrack(x,z,tracks)||state.industries.some(item=>Math.hypot(x-item.position.x,z-item.position.z)<48)||overlaps(x,z,radius,records))continue;
      const finish=houseFinishes[finishOrder[index%finishOrder.length]!]!;records.push({id:`building:${town.id}:${accepted}`,assetId:`norway-house-${finish}`,townId:town.id,composition,x,y:sample.elevationM,z,rotationY:rotation,scale:.82+random.next()*.24,footprintRadiusM:radius});accepted++;
    }
    if(accepted<housesPerTown)throw new Error(`Could place only ${accepted}/${housesPerTown} buildings at ${town.name}`);
  }
  for(const industry of state.industries){const sawmill=industry.definitionId==='sawmill',assets=sawmill?['norway-sawmill','norway-timber-yard','norway-boathouse']:['norway-barn','norway-stabbur','norway-timber-yard'];for(let index=0;index<assets.length;index++){const angle=(sawmill ? .35 : 1.25)+index*2.1,radius=index===0?0:30+index*13,x=industry.position.x+Math.cos(angle)*radius,z=industry.position.z+Math.sin(angle)*radius,sample=terrain.sample(x,z);records.push({id:`building:${industry.id}:${index}`,assetId:assets[index]!,townId:null,composition:'industry',x,y:sample.elevationM,z,rotationY:angle,scale:1,footprintRadiusM:index===0?12:9});}}
  return records;
}
