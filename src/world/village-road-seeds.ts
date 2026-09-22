import type {GameState} from '../domain/model.js';
export interface Plot {x:number;z:number;townId:string|null;footprintRadiusM?:number}
export type RoadSurface=import('./settlement-era.js').SurfaceKind;
interface Point {x:number;z:number}
export interface VillageRoad {points:Point[];width:number;surface:RoadSurface;townId?:string}
/** Art-direction eras: paving reaches town streets first; farm access remains unpaved. */
export {settlementEra as streetEra} from './settlement-era.js';
export function villageRoadSeeds(state:Pick<GameState,'towns'>&Partial<Pick<GameState,'world'>>,plots:readonly Plot[],southwest:boolean,year:number):VillageRoad[]{
 const roads:VillageRoad[]=[],modern=year>=1960;
 for(const [index,town] of state.towns.entries()){
  const houses=plots.filter(p=>p.townId===town.id);if(!houses.length)continue;
  const add=(points:Point[],width:number,central=false)=>roads.push({points,width,townId:town.id,surface:modern?'asphalt':central&&!southwest?'cobbles':'dirt'});
  if(state.world?.biomeId==='rhine'||state.world?.biomeId==='tyne'){
   const half=state.world.biomeId==='rhine'?118:155;
   for(const side of [-1,1])for(let row=0;row<3;row++){const z=town.position.z+side*(28+row*28);add(Array.from({length:7},(_,i)=>({x:town.position.x-half+i*half/3,z:z+Math.sin(i*.45)*7})),row===0?6:4.5,row===0);}
   for(const side of [-1,1])add([-96,-55,-28,28,55,96].map(z=>({x:town.position.x+side*(half+10),z:town.position.z+z})),5,true);
   add([{x:town.position.x-48,z:town.position.z+22},{x:town.position.x-70,z:town.position.z+26},{x:town.position.x-half-10,z:town.position.z+28}],4,true);
  }else if(southwest){
   for(const offset of [0,-142,142])add([-330,-180,0,180,330].map((z,i)=>({x:town.position.x+offset+Math.sin(i*1.5)*3,z:town.position.z+z})),offset===0?11:6,true);
   for(const offset of [-188,0,188])add([-200,-100,0,100,200].map((x,i)=>({x:town.position.x+x,z:town.position.z+offset+Math.sin(i*1.8)*2})),6);
  }else if(index!==1){
   const base=index===0?78:-112,spacing=index===0?38:42,rows=new Map<number,Plot[]>();
   for(const house of houses){const row=Math.round((house.z-town.position.z-base)/spacing);const group=rows.get(row)??[];group.push(house);rows.set(row,group);}
   const junctions:Point[]=[];
   for(const [row,group] of [...rows].sort((a,b)=>a[0]-b[0])){
    const z=town.position.z+base+row*spacing+(index===0?-17:17),minX=Math.min(...group.map(p=>p.x))-22,maxX=Math.max(...group.map(p=>p.x))+20;
    add(Array.from({length:6},(_,i)=>({x:minX+(maxX-minX)*i/5,z:z+Math.sin(i*1.3+row)*2})),5.5,row===0);
    junctions.push({x:minX-4,z});
   }
   if(junctions.length>1)add(junctions,4);
   // A short winding approach ends at the town forecourt, not across its railway site.
   const first=junctions[0]!;add([{x:town.position.x-48,z:town.position.z+22},{x:first.x-14,z:(town.position.z+first.z)/2},first],4);
  }else{
   // Farm courts are connected by a wandering lane, with compact loops between yards.
   const centres=[{x:town.position.x-82,z:town.position.z-65},{x:town.position.x+94,z:town.position.z+18},{x:town.position.x-8,z:town.position.z+108}];
   add([centres[0]!,{x:town.position.x-8,z:town.position.z-32},centres[1]!,{x:town.position.x+68,z:town.position.z+83},centres[2]!],4);
   for(const c of centres)roads.push({points:Array.from({length:9},(_,i)=>({x:c.x+Math.cos(i/8*Math.PI*2)*17,z:c.z+Math.sin(i/8*Math.PI*2)*17})),width:3,townId:town.id,surface:'dirt'});
  }
 }
 return roads;
}
