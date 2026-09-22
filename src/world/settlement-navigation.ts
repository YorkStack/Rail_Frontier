import {pathDistance,type PathPoint,type PathEntrance,type SettlementPath} from './settlement-paths.js';

export interface WalkNode extends PathPoint {id:string;component:string;junction:boolean}
export interface WalkEdge {id:string;from:string;to:string;lengthM:number;kinds:SettlementPath['kind'][]}
export interface SettlementNavigation {
 nodes:WalkNode[];
 edges:WalkEdge[];
 entrances:Record<string,{nodeId:string|null;townId:string;kind:PathEntrance['kind']}>;
 townHubs:Record<string,string>;
}
export interface WalkRoute {points:PathPoint[];lengthM:number}
export const emptySettlementNavigation=():SettlementNavigation=>({nodes:[],edges:[],entrances:{},townHubs:{}});
const EPS=1e-5;
const cross=(a:PathPoint,b:PathPoint)=>a.x*b.z-a.z*b.x;
const subtract=(a:PathPoint,b:PathPoint)=>({x:a.x-b.x,z:a.z-b.z});
// Micrometre keys remove floating-point differences at the same intersection, not gaps.
const nodeId=(p:PathPoint)=>`walk:${Math.round(p.x*1e6)}:${Math.round(p.z*1e6)}`;
interface Segment {a:PathPoint;b:PathPoint;kind:SettlementPath['kind'];cuts:number[]}
function fraction(p:PathPoint,s:Segment):number|null {
 const v=subtract(s.b,s.a),d=subtract(p,s.a),length=Math.hypot(v.x,v.z),t=(d.x*v.x+d.z*v.z)/(length*length);
 return t>=-EPS/length&&t<=1+EPS/length&&Math.abs(cross(v,d))/length<=EPS?Math.max(0,Math.min(1,t)):null;
}

/** Build topology only on the checked path centre lines. Close parallel roads do not snap.
 * All paths are ground-level; rail/terrain validity belongs to the upstream corridor planner.
 * Derived on edits/load, never persisted and never used to change passenger demand. */
export function buildSettlementNavigation(paths:readonly SettlementPath[],entrances:readonly PathEntrance[],hubs:Readonly<Record<string,PathPoint>>,access:Readonly<Record<string,string>>):SettlementNavigation {
 const graph=emptySettlementNavigation(),segments:Segment[]=paths.flatMap(path=>path.points.slice(1).map((b,i)=>({a:path.points[i]!,b,kind:path.kind,cuts:[0,1]}))).filter(s=>pathDistance(s.a,s.b)>EPS);
 // Compare only overlapping spatial buckets; long diagonal corridors stay bounded by town size.
 const buckets=new Map<string,number[]>(),pairs=new Set<string>(),cell=64;
 for(const [i,s] of segments.entries())for(let x=Math.floor((Math.min(s.a.x,s.b.x)-EPS)/cell);x<=Math.floor((Math.max(s.a.x,s.b.x)+EPS)/cell);x++)for(let z=Math.floor((Math.min(s.a.z,s.b.z)-EPS)/cell);z<=Math.floor((Math.max(s.a.z,s.b.z)+EPS)/cell);z++){
  const key=x+':'+z,list=buckets.get(key)??[];
  for(const j of list){const pair=j+':'+i;if(pairs.has(pair))continue;pairs.add(pair);const other=segments[j]!,v=subtract(s.b,s.a),w=subtract(other.b,other.a),d=subtract(other.a,s.a),denominator=cross(v,w);
   if(Math.abs(denominator)>1e-10){const t=cross(d,w)/denominator,u=cross(d,v)/denominator;if(t>=0&&t<=1&&u>=0&&u<=1){s.cuts.push(t);other.cuts.push(u);}}
   // Also split T joins, endpoint joins and collinear overlaps, with metric tolerance.
   for(const p of [other.a,other.b]){const t=fraction(p,s);if(t!==null)s.cuts.push(t);}
   for(const p of [s.a,s.b]){const t=fraction(p,other);if(t!==null)other.cuts.push(t);}
  }
  list.push(i);buckets.set(key,list);
 }
 const anchors=[...Object.values(hubs),...entrances.filter(e=>access[e.id]==='connected').map(e=>e.door)];
 for(const p of anchors)for(const s of segments){const t=fraction(p,s);if(t!==null)s.cuts.push(t);}
 const nodes=new Map<string,WalkNode>(),edges=new Map<string,WalkEdge>();
 const insert=(p:PathPoint)=>{const id=nodeId(p);if(!nodes.has(id))nodes.set(id,{id,x:Math.round(p.x*1e6)/1e6,z:Math.round(p.z*1e6)/1e6,component:'',junction:false});return id;};
 for(const s of segments){const cuts=[...new Set(s.cuts)].sort((a,b)=>a-b);for(let i=1;i<cuts.length;i++){
  const at=(t:number)=>({x:s.a.x+(s.b.x-s.a.x)*t,z:s.a.z+(s.b.z-s.a.z)*t}),a=at(cuts[i-1]!),b=at(cuts[i]!);if(pathDistance(a,b)<=EPS)continue;
  const [from,to]=[insert(a),insert(b)].sort() as [string,string],id=from+'|'+to,existing=edges.get(id);
  if(existing){if(!existing.kinds.includes(s.kind))existing.kinds.push(s.kind);}else edges.set(id,{id,from,to,lengthM:pathDistance(nodes.get(from)!,nodes.get(to)!),kinds:[s.kind]});
 }}
 for(const [town,p] of Object.entries(hubs).sort(([a],[b])=>a.localeCompare(b)))graph.townHubs[town]=insert(p);
 for(const e of [...entrances].sort((a,b)=>a.id.localeCompare(b.id)))graph.entrances[e.id]={nodeId:access[e.id]==='connected'&&nodes.has(nodeId(e.door))?nodeId(e.door):null,townId:e.townId,kind:e.kind};
 graph.nodes=[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id));graph.edges=[...edges.values()].sort((a,b)=>a.id.localeCompare(b.id));
 const adjacent=new Map<string,string[]>();for(const e of graph.edges){e.kinds.sort();for(const [a,b] of [[e.from,e.to],[e.to,e.from]] as const){const next=adjacent.get(a)??[];next.push(b);adjacent.set(a,next);}}
 for(const node of graph.nodes){node.junction=(adjacent.get(node.id)?.length??0)>=3;if(node.component)continue;const pending=[node.id];node.component=node.id;for(let i=0;i<pending.length;i++)for(const id of adjacent.get(pending[i]!)??[]){const next=nodes.get(id)!;if(!next.component){next.component=node.id;pending.push(id);}}}
 return graph;
}

/** Reuse one immutable routing index per derived settlement network, not one per frame. */
export class SettlementNavigator {
 private nodes:Map<string,WalkNode>;
 private adjacent=new Map<string,{id:string;distance:number}[]>();
 constructor(private readonly graph:SettlementNavigation){
  this.nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  for(const e of graph.edges)for(const [a,b] of [[e.from,e.to],[e.to,e.from]] as const){const next=this.adjacent.get(a)??[];next.push({id:b,distance:e.lengthM});this.adjacent.set(a,next);}
 }
 route(fromEntrance:string,toEntrance:string):WalkRoute|null {return this.findPath(this.graph.entrances[fromEntrance]?.nodeId,this.graph.entrances[toEntrance]?.nodeId);}
 routeToTown(entrance:string):WalkRoute|null {const e=this.graph.entrances[entrance];return this.findPath(e?.nodeId,e?this.graph.townHubs[e.townId]:undefined);}
 private findPath(from:string|null|undefined,to:string|null|undefined):WalkRoute|null {
  if(!from||!to||!this.nodes.has(from)||!this.nodes.has(to)||this.nodes.get(from)!.component!==this.nodes.get(to)!.component)return null;
  const costs=new Map([[from,0]]),previous=new Map<string,string>(),pending:{id:string;cost:number}[]=[{id:from,cost:0}];
  while(pending.length){pending.sort((a,b)=>b.cost-a.cost||b.id.localeCompare(a.id));const item=pending.pop()!;if(item.cost!==costs.get(item.id))continue;
   if(item.id===to){const ids=[to];while(ids.at(-1)!==from)ids.push(previous.get(ids.at(-1)!)!);return {lengthM:item.cost,points:ids.reverse().map(id=>{const p=this.nodes.get(id)!;return {x:p.x,z:p.z};})};}
   for(const next of this.adjacent.get(item.id)??[]){const cost=item.cost+next.distance;if(cost>=(costs.get(next.id)??Infinity))continue;costs.set(next.id,cost);previous.set(next.id,item.id);pending.push({id:next.id,cost});}
  }
  return null;
 }
}
