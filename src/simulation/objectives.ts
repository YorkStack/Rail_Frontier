import { norway } from '../content/norway.js';
import type { CampaignDefinition, GameState, Id } from '../domain/model.js';
import { townCoverage } from './coverage.js';

const fjordStudy:CampaignDefinition={...norway,id:'fjord-study',title:'The Northern Line'};
const registry=new Map<string,CampaignDefinition>([[`${norway.id}@${norway.version}`,norway],[`${fjordStudy.id}@${fjordStudy.version}`,fjordStudy]]);

function connectedCoveredTowns(state:GameState):number {
  const coverage=townCoverage(state),stationById=new Map(state.stations.map(station=>[station.id,station])),adjacency=new Map<Id<'node'>,Id<'node'>[]>();
  for(const node of state.railway.nodes)adjacency.set(node.id,[]);
  for(const edge of state.railway.edges){adjacency.get(edge.from)?.push(edge.to);adjacency.get(edge.to)?.push(edge.from);}
  const nodes=[...coverage.values()].map(id=>stationById.get(id)!.nodeId);let largest=0;
  for(const origin of new Set(nodes)) {
    const visited=new Set<Id<'node'>>(),stack=[origin];while(stack.length){const node=stack.pop()!;if(visited.has(node))continue;visited.add(node);stack.push(...(adjacency.get(node)??[]));}
    largest=Math.max(largest,nodes.filter(node=>visited.has(node)).length);
  }
  return largest;
}

export function evaluateObjectives(state:GameState):void {
  const campaign=registry.get(`${state.campaignId}@${state.campaignVersion}`);if(!campaign)return;
  const revenue=state.operations.monthlyAccounts.reduce((sum,account)=>sum+account.revenue,0),operating=state.operations.monthlyAccounts.reduce((sum,account)=>sum+account.operatingCost,0);
  for(const objective of campaign.objectives) {
    const progress=objective.type==='connectTowns'?connectedCoveredTowns(state):objective.type==='deliverPassengers'?state.operations.delivered.passengers:Math.max(0,revenue-operating);
    state.objectiveProgress[objective.id]=progress;
    if(progress>=objective.target&&!state.operations.completedObjectives.includes(objective.id))state.operations.completedObjectives.push(objective.id);
  }
}
