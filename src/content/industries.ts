import { allocateId, type CampaignDefinition,type CargoKind, type GameState, type Industry } from '../domain/model.js';
import type { IndustryRecipe } from '../domain/operations.js';
import { createInitialState, norway } from './norway.js';
import {norwayWorldGeneratorFor} from '../world/norway-generators.js';

export const industryDefinitions=Object.freeze({
  'coal-terminal':Object.freeze<IndustryRecipe>({id:'coal-terminal',inputs:{},outputs:{coal:20},cycleTicks:1200,storageCapacity:600}),
  'coal-mine':Object.freeze<IndustryRecipe>({id:'coal-mine',inputs:{},outputs:{coal:20},cycleTicks:1200,storageCapacity:600}),
  'iron-mine':Object.freeze<IndustryRecipe>({id:'iron-mine',inputs:{},outputs:{ore:20},cycleTicks:1200,storageCapacity:600}),
  steelworks:Object.freeze<IndustryRecipe>({id:'steelworks',inputs:{coal:10,ore:15},outputs:{steel:12},cycleTicks:900,storageCapacity:600}),
  'oil-terminal':Object.freeze<IndustryRecipe>({id:'oil-terminal',inputs:{},outputs:{oil:20},cycleTicks:1600,storageCapacity:600}),
  'freight-port':Object.freeze<IndustryRecipe>({id:'freight-port',inputs:{steel:8,oil:4},outputs:{},cycleTicks:600,storageCapacity:600}),
  forest:Object.freeze<IndustryRecipe>({id:'forest',inputs:{},outputs:{timber:20},cycleTicks:1200,storageCapacity:500}),
  sawmill:Object.freeze<IndustryRecipe>({id:'sawmill',inputs:{timber:10},outputs:{lumber:7},cycleTicks:600,storageCapacity:500})
});

export type IndustryDefinitionId=keyof typeof industryDefinitions;
export const industryDefinition=(id:string):IndustryRecipe|undefined=>industryDefinitions[id as IndustryDefinitionId];
export const industryName=(id:string):string=>id==='forest'?'Granli Forest':id==='sawmill'?'Sundvik Sawmill':({'coal-terminal':'Coal wharf','coal-mine':'Coal mine','iron-mine':'Iron ore mine',steelworks:'Steelworks','oil-terminal':'Oil terminal','freight-port':'Export harbour'} as Record<string,string>)[id]??id;

const inventory=(values:Partial<Record<CargoKind,number>>):Industry['inventory']=>({...values});

/** Add the fixed first freight chain without changing the ID contract of createInitialState(). */
export function addNorwayIndustries(state:GameState):GameState {
  if(state.campaignId!==norway.id||state.industries.length>0)return state;
  const sites=[
    {definitionId:'forest',x:4890,z:5030,inventory:inventory({})},
    {definitionId:'sawmill',x:2420,z:3290,inventory:inventory({})}
  ] as const;
  for(const site of sites) {
    const id=allocateId(state,'industry');
    state.industries.push({id,definitionId:site.definitionId,position:{x:site.x,y:norwayWorldGeneratorFor(state.world).elevation(site.x,site.z,state.world.seed),z:site.z},inventory:site.inventory});
    state.operations.industryCycleTicks[id]=0;
  }
  return state;
}

export const createNorwayGameState=(campaign:CampaignDefinition=norway):GameState=>addNorwayIndustries(createInitialState(campaign));

/** Regional industrial sites are gameplay compositions, not a cadastral reconstruction of 1900. */
export function addRegionalIndustries(state:GameState,terrain:import('../world/terrain.js').GridTerrain):GameState {
 if(!['middle-rhine','tyne-wear-coast'].includes(state.campaignId)||state.industries.length)return state;
 const kinds=[state.campaignId==='middle-rhine'?'coal-terminal':'coal-mine','iron-mine','steelworks','oil-terminal','freight-port'] as const;
 for(const [i,definitionId] of kinds.entries()){
  const town=state.towns[i%state.towns.length]!;let point:{x:number;y:number;z:number}|null=null;
  const needsWater=definitionId.includes('terminal')||definitionId.includes('port');
  for(let a=0;a<720;a++){const angle=(a*.618+i)*Math.PI*2,r=350+Math.floor(a/24)*75,x=town.position.x+Math.cos(angle)*r,z=town.position.z+Math.sin(angle)*r;if(x<50||z<50||x>terrain.widthM-50||z>terrain.depthM-50)continue;const s=terrain.sample(x,z),p=terrain.planeAt(x,z);const shore=!needsWater||Array.from({length:16},(_,n)=>{const a=n*Math.PI/8,wx=x+Math.cos(a)*200,wz=z+Math.sin(a)*200;if(wx<0||wz<0||wx>terrain.widthM||wz>terrain.depthM)return false;const w=terrain.sample(wx,wz);return w.elevationM<(w.waterLevelM??-999)-.5;}).some(Boolean);if(shore&&s.elevationM>(s.waterLevelM??-999)+2&&Math.hypot(p.dx,p.dz)<.16&&!state.industries.some(n=>Math.hypot(x-n.position.x,z-n.position.z)<150)){point={x,y:s.elevationM,z};break;}}
  if(!point)throw new Error('Regional industry needs a buildable site');const id=allocateId(state,'industry');state.industries.push({id,definitionId,position:point,inventory:{}});state.operations.industryCycleTicks[id]=0;
 }
 return state;
}
