import type {GameState,Id} from '../domain/model.js';

/** Construction targets, excluding implementation nodes between alignment segments. */
export function railConnectionNodes(state:Readonly<GameState>) {
  const stops=new Set(state.stations.flatMap(s=>s.layout.kind==='single-platform'?[s.layout.stopNodeId]:[]));
  const ports=new Set(state.stations.flatMap(s=>s.layout.kind==='single-platform'?s.layout.ports.map(p=>p.nodeId):[]));
  const degree=new Map<Id<'node'>,number>();
  for(const edge of state.railway.edges)for(const id of [edge.from,edge.to])degree.set(id,(degree.get(id)??0)+1);
  return state.railway.nodes.filter(node=>!stops.has(node.id)&&(ports.has(node.id)?(degree.get(node.id)??0)<2:degree.get(node.id)!==2));
}

export interface LabelBox {x:number;y:number;width:number;height:number;priority:number;}
/** Keep selected labels first, then station names; circle buttons remain available. */
export function visibleConnectionLabels(boxes:LabelBox[]):Set<number> {
  const accepted:number[]=[];
  for(const {index,box} of boxes.map((box,index)=>({box,index})).sort((a,b)=>b.box.priority-a.box.priority)) {
    if(accepted.every(index=>{const other=boxes[index]!;return box.x+box.width+8<=other.x||other.x+other.width+8<=box.x||box.y+box.height+8<=other.y||other.y+other.height+8<=box.y;}))accepted.push(index);
  }
  return new Set(accepted);
}
