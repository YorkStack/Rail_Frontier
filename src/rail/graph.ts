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
/** Bidirectional least free-running-time path; sorted IDs break equal-cost ties reproducibly. */
export function findPath(graph: RailGraph, from: Id<'node'>, to: Id<'node'>): Traversal[] | null {
  const geometry=compileGraph(graph);
  const pending=new Set(graph.nodes.map(n=>n.id));
  if(!pending.has(from)||!pending.has(to)) throw new Error('Unknown path endpoint');
  const costs=new Map<Id<'node'>,number>([[from,0]]);
  const previous=new Map<Id<'node'>,{node:Id<'node'>; traversal:Traversal}>();
  while(pending.size) {
    const current=[...pending].sort((a,b)=>(costs.get(a)??Infinity)-(costs.get(b)??Infinity)||a.localeCompare(b))[0]!;
    if(!costs.has(current)) return null;
    if(current===to) {
      const path:Traversal[]=[]; let cursor=to;
      while(cursor!==from) { const step=previous.get(cursor)!;path.unshift(step.traversal);cursor=step.node; }
      return path;
    }
    pending.delete(current);
    for(const edge of [...graph.edges].sort((a,b)=>a.id.localeCompare(b.id))) {
      if(edge.from!==current&&edge.to!==current) continue;
      const reverse=edge.to===current,next=reverse?edge.from:edge.to;
      const candidate=costs.get(current)!+geometry.get(edge.id)!.lengthM/edge.speedLimitMps;
      if(pending.has(next)&&candidate<(costs.get(next)??Infinity)) {costs.set(next,candidate);previous.set(next,{node:current,traversal:{edgeId:edge.id,reverse}});}
    }
  }
  return null;
}
