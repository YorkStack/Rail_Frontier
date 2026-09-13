import type { Id, RailGraph, Traversal } from '../domain/model.js';
import { compileCurve, distance, type TrackGeometry } from './geometry.js';
export function compileGraph(graph: RailGraph): Map<Id<'edge'>, TrackGeometry> {
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  if(nodes.size!==graph.nodes.length) throw new Error('Duplicate rail node');
  const result=new Map<Id<'edge'>,TrackGeometry>();
  for(const edge of graph.edges) {
    const from=nodes.get(edge.from),to=nodes.get(edge.to);
    if(!from || !to || result.has(edge.id) || edge.from===edge.to || !Number.isFinite(edge.speedLimitMps) || edge.speedLimitMps<=0) throw new Error('Invalid rail edge');
    if(distance(from.position,edge.curve.p0)>0.001 || distance(to.position,edge.curve.p3)>0.001) throw new Error('Edge endpoint differs from graph node');
    result.set(edge.id,compileCurve(edge.curve));
  }
  return result;
}
type Candidate={node:Id<'node'>;cost:number};
class MinHeap {
  private values:Candidate[]=[];
  private less(a:Candidate,b:Candidate):boolean {return a.cost<b.cost||a.cost===b.cost&&a.node.localeCompare(b.node)<0;}
  push(item:Candidate):void {let i=this.values.push(item)-1;while(i>0){const parent=(i-1)>>1;if(!this.less(item,this.values[parent]!))break;this.values[i]=this.values[parent]!;i=parent;}this.values[i]=item;}
  pop():Candidate|undefined {
    const first=this.values[0],last=this.values.pop();if(!last||this.values.length===0)return first;
    let i=0;while(i*2+1<this.values.length){let child=i*2+1;if(child+1<this.values.length&&this.less(this.values[child+1]!,this.values[child]!))child++;if(!this.less(this.values[child]!,last))break;this.values[i]=this.values[child]!;i=child;}this.values[i]=last;return first;
  }
}
/** Immutable network snapshot; rebuild once per graph revision, reuse for all train queries. */
export class RailNetwork {
  readonly geometry:ReadonlyMap<Id<'edge'>,TrackGeometry>;
  readonly revision:number;
  private adjacency=new Map<Id<'node'>,{next:Id<'node'>;cost:number;traversal:Traversal}[]>();
  constructor(graph:RailGraph) {
    this.revision=graph.revision;this.geometry=compileGraph(structuredClone(graph));
    for(const node of graph.nodes)this.adjacency.set(node.id,[]);
    for(const edge of [...graph.edges].sort((a,b)=>a.id.localeCompare(b.id))) {
      const cost=this.geometry.get(edge.id)!.lengthM/edge.speedLimitMps;
      this.adjacency.get(edge.from)!.push({next:edge.to,cost,traversal:{edgeId:edge.id,reverse:false}});
      this.adjacency.get(edge.to)!.push({next:edge.from,cost,traversal:{edgeId:edge.id,reverse:true}});
    }
  }
  findPath(from:Id<'node'>,to:Id<'node'>):Traversal[]|null {
    if(!this.adjacency.has(from)||!this.adjacency.has(to))throw new Error('Unknown path endpoint');
    const costs=new Map<Id<'node'>,number>([[from,0]]),previous=new Map<Id<'node'>,{node:Id<'node'>;traversal:Traversal}>(),queue=new MinHeap();queue.push({node:from,cost:0});
    let item;
    while((item=queue.pop())) {
      if(item.cost!==costs.get(item.node))continue;
      if(item.node===to){const path:Traversal[]=[];let cursor=to;while(cursor!==from){const step=previous.get(cursor)!;path.push({...step.traversal});cursor=step.node;}return path.reverse();}
      for(const edge of this.adjacency.get(item.node)!) {const candidate=item.cost+edge.cost;if(candidate<(costs.get(edge.next)??Infinity)){costs.set(edge.next,candidate);previous.set(edge.next,{node:item.node,traversal:edge.traversal});queue.push({node:edge.next,cost:candidate});}}
    }
    return null;
  }
}
export function findPath(graph:RailGraph,from:Id<'node'>,to:Id<'node'>):Traversal[]|null {return new RailNetwork(graph).findPath(from,to);}
