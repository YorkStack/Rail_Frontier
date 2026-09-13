import { z } from 'zod';
import type { GameState } from '../domain/model.js';
import { compileGraph } from '../rail/graph.js';
import { emptyOperations } from '../domain/operations.js';

const finite=z.number().finite(), integer=z.number().int().safe(), nonnegative=integer.nonnegative();
const id=<K extends string>(kind:K)=>z.custom<`${K}:${number}`>((v)=>typeof v==='string' && new RegExp(`^${kind}:[1-9][0-9]*$`).test(v) && Number.isSafeInteger(Number(v.split(':')[1])));
const vec=z.strictObject({x:finite,y:finite,z:finite});
const cargo=z.strictObject({kind:z.enum(['passengers','timber','lumber']),quantity:nonnegative,destinationId:id('station'),originId:id('station'),loadedTick:nonnegative,distanceM:finite.nonnegative()});
const stateSchema=z.strictObject({
  operations:z.strictObject({
    demand:z.array(z.strictObject({originTownId:id('town'),destinationTownId:id('town'),quantity:nonnegative,generatedTick:nonnegative})),
    trainServices:z.record(id('train'),z.strictObject({nextStopIndex:nonnegative,direction:z.union([z.literal(1),z.literal(-1)]),ageDays:nonnegative,condition:finite.min(0).max(1),distanceM:finite.nonnegative(),revenue:nonnegative,operatingCosts:nonnegative,costRemainder:finite.min(0).lt(1)})),
    reservations:z.array(z.strictObject({edgeId:id('edge'),trainId:id('train')})),
    infrastructure:z.record(id('edge'),z.strictObject({spans:z.array(z.strictObject({startM:finite.nonnegative(),endM:finite.positive(),kind:z.enum(['ground','bridge','tunnel'])})),constructionCost:nonnegative,maintenancePerDay:nonnegative})),
    industryCycleTicks:z.record(id('industry'),nonnegative),
    delivered:z.strictObject({passengers:nonnegative,timber:nonnegative,lumber:nonnegative}),completedObjectives:z.array(z.string()),
    monthlyAccounts:z.array(z.strictObject({month:nonnegative,revenue:nonnegative,operatingCost:nonnegative,capitalCost:nonnegative})),lastCommandSequence:nonnegative
  }),
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
}) satisfies z.ZodType<GameState>;
const envelope=z.strictObject({schemaVersion:z.literal(2),gameVersion:z.literal('0.2.0'),state:stateSchema});
const legacyEnvelope=z.strictObject({schemaVersion:z.literal(1),gameVersion:z.literal('0.1.0'),state:stateSchema.omit({operations:true})});
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
  for(const demand of state.operations.demand){requireRef(demand.originTownId);requireRef(demand.destinationTownId);if(demand.originTownId===demand.destinationTownId||demand.generatedTick>state.tick)throw new Error('Invalid demand');}
  const reserved=new Set<string>();
  for(const reservation of state.operations.reservations){requireRef(reservation.edgeId);requireRef(reservation.trainId);if(reserved.has(reservation.edgeId))throw new Error('Conflicting edge reservations');reserved.add(reservation.edgeId);}
  for(const [trainId,service] of Object.entries(state.operations.trainServices)){requireRef(trainId);const train=state.trains.find(t=>t.id===trainId)!;const route=state.routes.find(r=>r.id===train.routeId);if(route&&service.nextStopIndex>=route.stops.length)throw new Error('Invalid service stop');}
  for(const [edgeId,infrastructure] of Object.entries(state.operations.infrastructure)){requireRef(edgeId);let end=0;for(const span of infrastructure.spans){if(Math.abs(span.startM-end)>.001||span.endM<=span.startM)throw new Error('Invalid engineering span');end=span.endM;}const edge=state.railway.edges.find(e=>e.id===edgeId)!;if(Math.abs(end-geometry.get(edge.id)!.lengthM)>.01)throw new Error('Engineering spans must cover entire edge');}
  for(const industryId of Object.keys(state.operations.industryCycleTicks))requireRef(industryId);
  if(new Set(state.operations.completedObjectives).size!==state.operations.completedObjectives.length)throw new Error('Duplicate objective completion');
  let cash=state.company.openingCash;
  for(const transaction of state.company.ledger) {cash+=transaction.amount;if(!Number.isSafeInteger(cash)||transaction.tick>state.tick) throw new Error('Invalid ledger');}
  if(cash!==state.company.cash) throw new Error('Ledger does not reconcile');
  return state;
}
export const migrations=new Map<number,(value:unknown)=>unknown>([[1,(value)=>{const legacy=legacyEnvelope.parse(value);return {schemaVersion:2,gameVersion:'0.2.0',state:{...legacy.state,operations:emptyOperations()}};}]]);
export function serialize(state:GameState):string { return JSON.stringify({schemaVersion:2,gameVersion:'0.2.0',state:validateState(state)}); }
export function deserialize(json:string):GameState {
  if(json.length>20_000_000) throw new Error('Save exceeds 20 MB limit');
  let value:unknown=JSON.parse(json);
  const header=z.object({schemaVersion:integer.positive()});
  let version=header.parse(value).schemaVersion;
  if(version>2) throw new Error('Save was created by a newer game');
  while(version<2) {const migrate=migrations.get(version);if(!migrate) throw new Error('Missing migration');value=migrate(value);const next=header.parse(value).schemaVersion;if(next!==version+1)throw new Error('Migration must advance exactly one schema version');version=next;}
  return validateState(envelope.parse(value).state);
}
