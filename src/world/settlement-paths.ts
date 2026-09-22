import type {Terrain} from './terrain.js';

export interface PathPoint {x:number;z:number}
export interface PathObstacle extends PathPoint {id:string;halfX:number;halfZ:number;rotationY:number}
export interface PathEntrance {id:string;townId:string;door:PathPoint;approach:PathPoint;kind:'house'|'station'}
export interface SettlementPath {points:PathPoint[];width:number;kind:'street'|'door'|'station';townId:string;entranceId?:string}
export interface SettlementPaths {paths:SettlementPath[];access:Record<string,'connected'|'blocked'|'remote'>}
export const pathDistance=(a:PathPoint,b:PathPoint)=>Math.hypot(a.x-b.x,a.z-b.z);
export function localToWorld(origin:PathPoint,rotation:number,x:number,z:number):PathPoint {return {x:origin.x+Math.cos(rotation)*x+Math.sin(rotation)*z,z:origin.z-Math.sin(rotation)*x+Math.cos(rotation)*z};}
const segmentDistance=(p:PathPoint,a:PathPoint,b:PathPoint)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};

/** Conservative, terrain-aware pedestrian corridors. No implicit level crossings. */
export function pathValidator(terrain:Terrain,obstacles:readonly PathObstacle[],rails:readonly PathPoint[][]){
 const bucketSize=32,buildings=new Map<string,PathObstacle[]>(),tracks=new Map<string,[PathPoint,PathPoint][]>();
 const insert=<T>(map:Map<string,T[]>,item:T,minX:number,minZ:number,maxX:number,maxZ:number)=>{for(let x=Math.floor(minX/bucketSize);x<=Math.floor(maxX/bucketSize);x++)for(let z=Math.floor(minZ/bucketSize);z<=Math.floor(maxZ/bucketSize);z++){const key=x+':'+z,list=map.get(key)??[];list.push(item);map.set(key,list);}};
 for(const b of obstacles){const radius=Math.hypot(b.halfX,b.halfZ)+4;insert(buildings,b,b.x-radius,b.z-radius,b.x+radius,b.z+radius);}
 for(const line of rails)for(let i=1;i<line.length;i++){const a=line[i-1]!,b=line[i]!;insert(tracks,[a,b],Math.min(a.x,b.x)-7,Math.min(a.z,b.z)-7,Math.max(a.x,b.x)+7,Math.max(a.z,b.z)+7);}
 const point=(p:PathPoint,radius:number,ignore?:string)=>{
  const key=Math.floor(p.x/bucketSize)+':'+Math.floor(p.z/bucketSize);
  if(p.x<radius||p.z<radius||p.x>terrain.widthM-radius||p.z>terrain.depthM-radius)return false;
  const sample=terrain.sample(p.x,p.z);if(sample.waterLevelM!==null&&sample.elevationM<=sample.waterLevelM+.25)return false;
  for(const b of buildings.get(key)??[]){if(b.id===ignore)continue;const dx=p.x-b.x,dz=p.z-b.z,c=Math.cos(b.rotationY),s=Math.sin(b.rotationY);if(Math.abs(c*dx-s*dz)<b.halfX+radius&&Math.abs(s*dx+c*dz)<b.halfZ+radius)return false;}
  return !(tracks.get(key)??[]).some(([a,b])=>segmentDistance(p,a,b)<radius+2.8);
 };
 return (a:PathPoint,b:PathPoint,width:number,ignore?:string)=>{
  const length=pathDistance(a,b),count=Math.max(1,Math.ceil(length/1.5)),dx=(b.x-a.x)/(length||1),dz=(b.z-a.z)/(length||1);let previous:number|undefined;
  for(let i=0;i<=count;i++){
   const p={x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count};
   if(!point(p,width*.5+.3,ignore))return false;
   const y=terrain.sample(p.x,p.z).elevationM;if(previous!==undefined&&Math.abs(y-previous)>length/count*.32+.03)return false;previous=y;
   for(const side of [-1,1]){const edge={x:p.x-dz*width*.5*side,z:p.z+dx*width*.5*side};if(!point(edge,0,ignore)||Math.abs(terrain.sample(edge.x,edge.z).elevationM-y)>width*.25+.15)return false;}
  }
  return true;
 };
}
type Validator=ReturnType<typeof pathValidator>;
class Queue {
 private values:{id:number;score:number}[]=[];
 push(id:number,score:number){const a=this.values;let i=a.length;a.push({id,score});while(i){const p=(i-1)>>1;if(a[p]!.score<=score)break;a[i]=a[p]!;i=p;}a[i]={id,score};}
 pop(){const a=this.values,first=a[0],last=a.pop();if(a.length&&last){let i=0;while(i*2+1<a.length){let child=i*2+1;if(child+1<a.length&&a[child+1]!.score<a[child]!.score)child++;if(a[child]!.score>=last.score)break;a[i]=a[child]!;i=child;}a[i]=last;}return first;}
}
/** Bounded A* with exact checked end connectors and line-of-sight simplification. */
export function routeSettlementPath(start:PathPoint,goals:readonly PathPoint[],valid:Validator,width=3.4):PathPoint[]|null {
 const candidates=[...goals].sort((a,b)=>pathDistance(start,a)-pathDistance(start,b)).slice(0,12);if(!candidates.length)return null;
 for(const goal of candidates)if(valid(start,goal,width))return [start,goal];
 const reach=pathDistance(start,candidates[0]!);if(reach>650)return null;
 const cell=4,margin=64,minX=Math.floor((Math.min(start.x,...candidates.map(p=>p.x))-margin)/cell)*cell,minZ=Math.floor((Math.min(start.z,...candidates.map(p=>p.z))-margin)/cell)*cell;
 const cols=Math.ceil((Math.max(start.x,...candidates.map(p=>p.x))+margin-minX)/cell)+1,rows=Math.ceil((Math.max(start.z,...candidates.map(p=>p.z))+margin-minZ)/cell)+1;
 if(cols*rows>70000)return null;
 const at=(id:number)=>({x:minX+(id%cols)*cell,z:minZ+Math.floor(id/cols)*cell}),heuristic=(p:PathPoint)=>Math.min(...candidates.map(g=>pathDistance(p,g))),queue=new Queue(),cost=new Map<number,number>(),prev=new Map<number,number>(),closed=new Set<number>();
 const sx=Math.round((start.x-minX)/cell),sz=Math.round((start.z-minZ)/cell);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const id=(sz+dz)*cols+sx+dx,p=at(id);if(valid(start,p,width)){cost.set(id,pathDistance(start,p));queue.push(id,cost.get(id)!+heuristic(p));prev.set(id,-1);}}
 let iterations=0;
 for(let item=queue.pop();item&&iterations++<18000;item=queue.pop()){
  if(closed.has(item.id))continue;closed.add(item.id);const p=at(item.id);
  const goal=candidates.find(g=>pathDistance(p,g)<7&&valid(p,g,width));
  if(goal){const raw:PathPoint[]=[goal];let id=item.id;while(id!==-1){raw.push(at(id));id=prev.get(id)!;}raw.push(start);raw.reverse();const result=[start];for(let i=0;i<raw.length-1;){let end=raw.length-1;while(end>i+1&&!valid(raw[i]!,raw[end]!,width))end--;result.push(raw[end]!);i=end;}return result;}
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const x=item.id%cols+dx,z=Math.floor(item.id/cols)+dz;if(x<0||z<0||x>=cols||z>=rows)continue;const id=z*cols+x;if(closed.has(id))continue;const q=at(id),next=cost.get(item.id)!+pathDistance(p,q);if(next>=(cost.get(id)??Infinity)||!valid(p,q,width))continue;cost.set(id,next);prev.set(id,item.id);queue.push(id,next+heuristic(q));}
 }
 return null;
}

/** Derived presentation graph, never changes cash, catchment or passenger demand. */
export function connectSettlementPaths(terrain:Terrain,obstacles:readonly PathObstacle[],rails:readonly PathPoint[][],entrances:readonly PathEntrance[],seeds:readonly {townId:string;points:PathPoint[]}[]):SettlementPaths {
 const paths:SettlementPath[]=[],access:SettlementPaths['access']={},valid=pathValidator(terrain,obstacles,rails);
 for(const townId of [...new Set(entrances.filter(e=>e.kind==='house').map(e=>e.townId))]){
  const houses=entrances.filter(e=>e.townId===townId&&e.kind==='house'),townSeeds=seeds.filter(s=>s.townId===townId).flatMap(s=>s.points),root=townSeeds.find(p=>valid(p,p,3.4))??houses.find(h=>valid(h.approach,h.approach,3.4))?.approach;
  if(!root){for(const h of houses)access[h.id]='blocked';continue;}
  const network:PathPoint[]=[root];
  const append=(points:PathPoint[],width:number,kind:SettlementPath['kind'],entranceId?:string)=>{paths.push({points,width,kind,townId,...(entranceId?{entranceId}:{})});for(let i=1;i<points.length;i++){const a=points[i-1]!,b=points[i]!,n=Math.ceil(pathDistance(a,b)/8);for(let j=1;j<=n;j++)network.push({x:a.x+(b.x-a.x)*j/n,z:a.z+(b.z-a.z)*j/n});}network.push(points[0]!);};
  // Existing harbour rows, farm courts and desert blocks guide the connected backbone.
  const pending=townSeeds.filter(p=>valid(p,p,3.4));while(pending.length){pending.sort((a,b)=>Math.min(...network.map(n=>pathDistance(a,n)))-Math.min(...network.map(n=>pathDistance(b,n))));const p=pending.shift()!,route=routeSettlementPath(p,network,valid);if(route&&pathDistance(route[0]!,route.at(-1)!)>.1)append(route,3.4,'street');}
  for(const e of [...houses,...entrances.filter(e=>e.townId===townId&&e.kind==='station')]){
   const distance=Math.min(...network.map(n=>pathDistance(e.approach,n)));if(distance>650){access[e.id]='remote';continue;}
   if(!valid(e.door,e.approach,2.2,e.id)){access[e.id]='blocked';continue;}
   const route=routeSettlementPath(e.approach,network,valid,2.2);if(!route){access[e.id]='blocked';continue;}
   append(route,2.2,e.kind==='station'?'station':'door',e.id);append([e.door,e.approach],2.2,e.kind==='station'?'station':'door',e.id);access[e.id]='connected';
  }
 }
 for(const e of entrances)access[e.id]??='remote';return {paths,access};
}
