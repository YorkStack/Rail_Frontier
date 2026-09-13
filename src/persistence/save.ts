import { z } from 'zod';
import type { GameState } from '../domain/model.js';
import { compileGraph } from '../rail/graph.js';

const finite=z.number().finite(), integer=z.number().int().safe(), nonnegative=integer.nonnegative();
const id=<K extends string>(kind:K)=>z.custom<`${K}:${number}`>((v)=>typeof v==='string' && new RegExp(`^${kind}:[1-9][0-9]*$`).test(v) && Number.isSafeInteger(Number(v.split(':')[1])));
const vec=z.strictObject({x:finite,y:finite,z:finite});
const cargo=z.strictObject({kind:z.enum(['passengers','timber','lumber']),quantity:nonnegative,destinationId:id('station'),originId:id('station'),loadedTick:nonnegative,distanceM:finite.nonnegative()});
const stateSchema: z.ZodType<GameState>=z.strictObject({
  tick:nonnegative,nextEntityId:integer.positive(),rngState:integer.min(0).max(4294967295),campaignId:z.string().min(1),campaignVersion:integer.positive(),
  world:z.strictObject({seed:integer,widthM:finite.positive(),depthM:finite.positive(),cellM:finite.positive(),generatorVersion:integer.positive(),biomeId:z.string().min(1)}),
  railway:z.strictObject({revision:nonnegative,nodes:z.array(z.strictObject({id:id('node'),position:vec})),edges:z.array(z.strictObject({id:id('edge'),from:id('node'),to:id('node'),curve:z.strictObject({p0:vec,p1:vec,p2:vec,p3:vec}),speedLimitMps:finite.positive(),ownerId:id('company')}))}),
  stations:z.array(z.strictObject({id:id('station'),nodeId:id('node'),townId:id('town').nullable(),classId:z.string().min(1),storage:z.array(cargo)})),
  trains:z.array(z.strictObject({id:id('train'),routeId:id('route').nullable(),locomotiveId:z.string().min(1),vehicleIds:z.array(z.string().min(1)),motion:z.strictObject({path:z.array(z.strictObject({edgeId:id('edge'),reverse:z.boolean()})),leg:nonnegative,distanceM:finite.nonnegative(),arrived:z.boolean()}),speedMps:finite.nonnegative(),phase:z.enum(['idle','running','dwelling','blocked']),dwellTicks:nonnegative,cargo:z.array(cargo)})),
  routes:z.array(z.strictObject({id:id('route'),stops:z.array(id('station')).min(2),mode:z.enum(['shuttle','loop'])})),
  towns:z.array(z.strictObject({id:id('town'),name:z.string().min(1),position:vec,population:nonnegative})),
  industries:z.array(z.strictObject({id:id('industry'),definitionId:z.string().min(1),position:vec,inventory:z.partialRecord(z.enum(['passengers','timber','lumber']),nonnegative)})),
  company:z.strictObject({id:id('company'),cash:integer,openingCash:integer,ledger:z.array(z.strictObject({id:id('transaction'),tick:nonnegative,category:z.enum(['construction','vehicle','passenger','freight','maintenance']),amount:integer,entityId:z.string(),description:z.string()}))}),
  objectiveProgress:z.record(z.string(),nonnegative)
});
const envelope=z.strictObject({schemaVersion:z.literal(1),gameVersion:z.literal('0.1.0'),state:stateSchema});
export function validateState(value: unknown): GameState {
  const state=stateSchema.parse(value), geometry=compileGraph(state.railway);
  const entities=[...state.railway.nodes,...state.railway.edges,...state.stations,...state.trains,...state.routes,...state.towns,...state.industries,state.company,...state.company.ledger];
  const ids=new Set<string>(entities.map(e=>e.id));
  if(ids.size!==entities.length || entities.some(e=>Number(e.id.split(':')[1])>=state.nextEntityId)) throw new Error('Duplicate ID or stale ID counter');
  const requireRef=(ref:string|null)=>{if(ref!==null&&!ids.has(ref)) throw new Error(`Dangling reference: ${ref}`);};
  for(const station of state.stations) {requireRef(station.nodeId);requireRef(station.townId);}
  for(const edge of state.railway.edges) requireRef(edge.ownerId);
  for(const route of state.routes) route.stops.forEach(requireRef);
  for(const train of state.trains) {
    requireRef(train.routeId);
    const {motion}=train;
    if(motion.path.length===0) {
      if(train.phase!=='idle'||motion.leg!==0||motion.distanceM!==0) throw new Error('Invalid idle motion');
    } else {
      const current=motion.path[motion.leg];
      if(!current||!geometry.has(current.edgeId)||motion.distanceM>geometry.get(current.edgeId)!.lengthM+1e-6) throw new Error('Invalid train distance');
      let previousEnd:string|undefined;
      for(const leg of motion.path) {
        const edge=state.railway.edges.find(e=>e.id===leg.edgeId); if(!edge) throw new Error('Missing train edge');
        const start=leg.reverse?edge.to:edge.from,end=leg.reverse?edge.from:edge.to;
        if(previousEnd!==undefined&&previousEnd!==start) throw new Error('Disconnected train path'); previousEnd=end;
      }
      if(motion.arrived&&(motion.leg!==motion.path.length-1||Math.abs(motion.distanceM-geometry.get(current.edgeId)!.lengthM)>1e-6)) throw new Error('Invalid arrival');
    }
  }
  for(const lot of [...state.trains.flatMap(t=>t.cargo),...state.stations.flatMap(s=>s.storage)]) {requireRef(lot.originId);requireRef(lot.destinationId);if(lot.loadedTick>state.tick) throw new Error('Cargo timestamp in future');}
  let cash=state.company.openingCash;
  for(const transaction of state.company.ledger) {cash+=transaction.amount;if(!Number.isSafeInteger(cash)||transaction.tick>state.tick) throw new Error('Invalid ledger');}
  if(cash!==state.company.cash) throw new Error('Ledger does not reconcile');
  return state;
}
/** No released predecessors yet. Migration registry must remain explicit and sequential. */
export const migrations=new Map<number,(value:unknown)=>unknown>();
export function serialize(state:GameState):string { return JSON.stringify({schemaVersion:1,gameVersion:'0.1.0',state:validateState(state)}); }
export function deserialize(json:string):GameState {
  if(json.length>20_000_000) throw new Error('Save exceeds 20 MB limit');
  let value:unknown=JSON.parse(json);
  const header=z.object({schemaVersion:integer.positive()});
  let version=header.parse(value).schemaVersion;
  if(version>1) throw new Error('Save was created by a newer game');
  while(version<1) {const migrate=migrations.get(version);if(!migrate) throw new Error('Missing migration');value=migrate(value);version=header.parse(value).schemaVersion;}
  return validateState(envelope.parse(value).state);
}
