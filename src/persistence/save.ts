import { z } from 'zod';
import type { GameState } from '../domain/model.js';
import { compileGraph } from '../rail/graph.js';
import { emptyOperations,initialTownEconomy } from '../domain/operations.js';
import { industryDefinition } from '../content/industries.js';
import { stationDefinition } from '../content/stations.js';
import { vehicleDefinition } from '../content/vehicles.js';
import { currentYear } from '../simulation/calendar.js';

export const SAVE_LIMITS=Object.freeze({
  bytes:20_000_000,nodes:25_000,edges:25_000,stations:5_000,trains:2_000,routes:5_000,towns:5_000,industries:5_000,ledger:100_000,
  demand:50_000,reservations:25_000,monthlyAccounts:10_000,objectives:1_000,vehicleIdsPerTrain:128,pathEdgesPerTrain:25_000,cargoLotsPerEntity:2_048,stopsPerRoute:512,spansPerEdge:2_048
});
const record=(value:unknown):Record<string,unknown>|null=>typeof value==='object'&&value!==null&&!Array.isArray(value)?value as Record<string,unknown>:null;
const limitedArray=(owner:Record<string,unknown>|null,key:string,limit:number,label:string):unknown[]=>{
  const value=owner?.[key];if(!Array.isArray(value))return [];if(value.length>limit)throw new Error(`Save exceeds ${label} limit (${limit.toLocaleString('en')})`);return value;
};
const limitedRecord=(owner:Record<string,unknown>|null,key:string,limit:number,label:string):Record<string,unknown>=>{
  const value=record(owner?.[key]);if(!value)return {};if(Object.keys(value).length>limit)throw new Error(`Save exceeds ${label} limit (${limit.toLocaleString('en')})`);return value;
};
function preflightEnvelope(value:unknown):void {
  const state=record(record(value)?.state);if(!state)return;
  const railway=record(state.railway),operations=record(state.operations),company=record(state.company);
  limitedArray(railway,'nodes',SAVE_LIMITS.nodes,'rail node');limitedArray(railway,'edges',SAVE_LIMITS.edges,'rail edge');
  const stations=limitedArray(state,'stations',SAVE_LIMITS.stations,'station');
  const trains=limitedArray(state,'trains',SAVE_LIMITS.trains,'train');
  const routes=limitedArray(state,'routes',SAVE_LIMITS.routes,'route');
  limitedArray(state,'towns',SAVE_LIMITS.towns,'town');limitedArray(state,'industries',SAVE_LIMITS.industries,'industry');
  limitedArray(company,'ledger',SAVE_LIMITS.ledger,'ledger entry');limitedArray(operations,'demand',SAVE_LIMITS.demand,'demand record');limitedArray(operations,'reservations',SAVE_LIMITS.reservations,'reservation');limitedArray(operations,'monthlyAccounts',SAVE_LIMITS.monthlyAccounts,'monthly account');limitedArray(operations,'completedObjectives',SAVE_LIMITS.objectives,'completed objective');
  limitedRecord(operations,'trainServices',SAVE_LIMITS.trains,'train service');limitedRecord(operations,'infrastructure',SAVE_LIMITS.edges,'infrastructure record');limitedRecord(operations,'industryCycleTicks',SAVE_LIMITS.industries,'industry cycle');limitedRecord(operations,'townEconomy',SAVE_LIMITS.towns,'town economy');limitedRecord(state,'objectiveProgress',SAVE_LIMITS.objectives,'objective progress');
  for(const item of stations)limitedArray(record(item),'storage',SAVE_LIMITS.cargoLotsPerEntity,'station cargo lot');
  for(const item of trains){const train=record(item);limitedArray(train,'vehicleIds',SAVE_LIMITS.vehicleIdsPerTrain,'vehicles per train');limitedArray(record(train?.motion),'path',SAVE_LIMITS.pathEdgesPerTrain,'path edge per train');limitedArray(train,'cargo',SAVE_LIMITS.cargoLotsPerEntity,'train cargo lot');}
  for(const item of routes)limitedArray(record(item),'stops',SAVE_LIMITS.stopsPerRoute,'route stop');
  for(const item of Object.values(limitedRecord(operations,'infrastructure',SAVE_LIMITS.edges,'infrastructure record')))limitedArray(record(item),'spans',SAVE_LIMITS.spansPerEdge,'engineering span per edge');
}

const finite=z.number().finite(), integer=z.number().int().safe(), nonnegative=integer.nonnegative();
const id=<K extends string>(kind:K)=>z.custom<`${K}:${number}`>((v)=>typeof v==='string' && new RegExp(`^${kind}:[1-9][0-9]*$`).test(v) && Number.isSafeInteger(Number(v.split(':')[1])));
const vec=z.strictObject({x:finite,y:finite,z:finite});
const cargoV3=z.strictObject({kind:z.enum(['passengers','timber','lumber']),quantity:nonnegative,destinationId:id('station'),originId:id('station'),loadedTick:nonnegative,distanceM:finite.nonnegative()});
const cargo=z.strictObject({kind:z.enum(['passengers','mail','timber','lumber']),quantity:nonnegative,destinationId:id('station'),originId:id('station'),loadedTick:nonnegative,distanceM:finite.nonnegative()});
const infrastructureV5Schema=z.record(id('edge'),z.strictObject({spans:z.array(z.strictObject({startM:finite.nonnegative(),endM:finite.positive(),kind:z.enum(['ground','bridge','tunnel'])})),constructionCost:nonnegative,maintenancePerDay:nonnegative}));
const infrastructureSchema=z.record(id('edge'),z.strictObject({spans:z.array(z.strictObject({startM:finite.nonnegative(),endM:finite.positive(),kind:z.enum(['ground','bridge','tunnel'])})),constructionCost:nonnegative,maintenancePerDay:nonnegative,electrified:z.boolean(),electrificationCost:nonnegative,electrificationMaintenancePerDay:nonnegative}));
const operationsV2Schema=z.strictObject({
  demand:z.array(z.strictObject({originTownId:id('town'),destinationTownId:id('town'),quantity:nonnegative,generatedTick:nonnegative})),
  trainServices:z.record(id('train'),z.strictObject({nextStopIndex:nonnegative,direction:z.union([z.literal(1),z.literal(-1)]),ageDays:nonnegative,condition:finite.min(0).max(1),distanceM:finite.nonnegative(),revenue:nonnegative,operatingCosts:nonnegative,costRemainder:finite.min(0).lt(1)})),
  reservations:z.array(z.strictObject({edgeId:id('edge'),trainId:id('train')})),
  infrastructure:infrastructureV5Schema,
  industryCycleTicks:z.record(id('industry'),nonnegative),
  delivered:z.strictObject({passengers:nonnegative,timber:nonnegative,lumber:nonnegative}),completedObjectives:z.array(z.string()),
  monthlyAccounts:z.array(z.strictObject({month:nonnegative,revenue:nonnegative,operatingCost:nonnegative,capitalCost:nonnegative})),lastCommandSequence:nonnegative
});
const townEconomySchema=z.record(id('town'),z.strictObject({lumberDemand:nonnegative,lumberDelivered:nonnegative,lumberReceivedToday:nonnegative,mailWaiting:nonnegative,economicActivity:integer.min(0).max(100),connectedDays:nonnegative,growthRemainder:finite.min(0).lt(1),lastPopulationChange:nonnegative}));
const operationsV3Schema=operationsV2Schema.extend({townEconomy:townEconomySchema});
const operationsV5Schema=operationsV3Schema.extend({delivered:z.strictObject({passengers:nonnegative,mail:nonnegative,timber:nonnegative,lumber:nonnegative})});
const operationsSchema=operationsV5Schema.extend({infrastructure:infrastructureSchema});
const stateSchema=z.strictObject({
  operations:operationsSchema,
  tick:nonnegative,startingYear:integer.positive(),nextEntityId:integer.positive(),rngState:integer.min(0).max(4294967295),campaignId:z.string().min(1),campaignVersion:integer.positive(),
  world:z.strictObject({seed:integer,widthM:finite.positive(),depthM:finite.positive(),cellM:finite.positive(),generatorVersion:integer.positive(),biomeId:z.string().min(1)}),
  railway:z.strictObject({revision:nonnegative,nodes:z.array(z.strictObject({id:id('node'),position:vec})),edges:z.array(z.strictObject({id:id('edge'),from:id('node'),to:id('node'),curve:z.strictObject({p0:vec,p1:vec,p2:vec,p3:vec}),speedLimitMps:finite.positive(),ownerId:id('company')}))}),
  stations:z.array(z.strictObject({id:id('station'),nodeId:id('node'),townId:id('town').nullable(),classId:z.string().min(1),storage:z.array(cargo)})),
  trains:z.array(z.strictObject({id:id('train'),routeId:id('route').nullable(),locomotiveId:z.string().min(1),vehicleIds:z.array(z.string().min(1)),motion:z.strictObject({path:z.array(z.strictObject({edgeId:id('edge'),reverse:z.boolean()})),leg:nonnegative,distanceM:finite.nonnegative(),arrived:z.boolean()}),speedMps:finite.nonnegative(),phase:z.enum(['idle','running','dwelling','blocked']),dwellTicks:nonnegative,cargo:z.array(cargo)})),
  routes:z.array(z.strictObject({id:id('route'),stops:z.array(id('station')).min(2),mode:z.enum(['shuttle','loop'])})),
  towns:z.array(z.strictObject({id:id('town'),name:z.string().min(1),position:vec,population:nonnegative})),
  industries:z.array(z.strictObject({id:id('industry'),definitionId:z.string().min(1),position:vec,inventory:z.partialRecord(z.enum(['passengers','mail','timber','lumber']),nonnegative)})),
  company:z.strictObject({id:id('company'),cash:integer,openingCash:integer,ledger:z.array(z.strictObject({id:id('transaction'),tick:nonnegative,category:z.enum(['construction','vehicle','passenger','mail','freight','maintenance']),amount:integer,entityId:z.string(),description:z.string()}))}),
  objectiveProgress:z.record(z.string(),nonnegative)
}) satisfies z.ZodType<GameState>;
const stateV5Schema=stateSchema.extend({operations:operationsV5Schema});
const stateV4Schema=stateV5Schema.omit({startingYear:true});
const stateV3Schema=stateV4Schema.extend({
  operations:operationsV3Schema,
  stations:z.array(z.strictObject({id:id('station'),nodeId:id('node'),townId:id('town').nullable(),classId:z.string().min(1),storage:z.array(cargoV3)})),
  trains:z.array(z.strictObject({id:id('train'),routeId:id('route').nullable(),locomotiveId:z.string().min(1),vehicleIds:z.array(z.string().min(1)),motion:z.strictObject({path:z.array(z.strictObject({edgeId:id('edge'),reverse:z.boolean()})),leg:nonnegative,distanceM:finite.nonnegative(),arrived:z.boolean()}),speedMps:finite.nonnegative(),phase:z.enum(['idle','running','dwelling','blocked']),dwellTicks:nonnegative,cargo:z.array(cargoV3)})),
  industries:z.array(z.strictObject({id:id('industry'),definitionId:z.string().min(1),position:vec,inventory:z.partialRecord(z.enum(['passengers','timber','lumber']),nonnegative)})),
  company:z.strictObject({id:id('company'),cash:integer,openingCash:integer,ledger:z.array(z.strictObject({id:id('transaction'),tick:nonnegative,category:z.enum(['construction','vehicle','passenger','freight','maintenance']),amount:integer,entityId:z.string(),description:z.string()}))})
});
const stateV2Schema=stateV3Schema.extend({operations:operationsV2Schema});
const envelope=z.strictObject({schemaVersion:z.literal(6),gameVersion:z.literal('0.6.0'),state:stateSchema});
const versionFiveEnvelope=z.strictObject({schemaVersion:z.literal(5),gameVersion:z.literal('0.5.0'),state:stateV5Schema});
const versionFourEnvelope=z.strictObject({schemaVersion:z.literal(4),gameVersion:z.literal('0.4.0'),state:stateV4Schema});
const versionThreeEnvelope=z.strictObject({schemaVersion:z.literal(3),gameVersion:z.literal('0.3.0'),state:stateV3Schema});
const versionTwoEnvelope=z.strictObject({schemaVersion:z.literal(2),gameVersion:z.literal('0.2.0'),state:stateV2Schema});
const legacyEnvelope=z.strictObject({schemaVersion:z.literal(1),gameVersion:z.literal('0.1.0'),state:stateV3Schema.omit({operations:true})});
export function validateState(value: unknown): GameState {
  const state=stateSchema.parse(value), geometry=compileGraph(state.railway);
  const entities=[...state.railway.nodes,...state.railway.edges,...state.stations,...state.trains,...state.routes,...state.towns,...state.industries,state.company,...state.company.ledger];
  const ids=new Set<string>(entities.map(e=>e.id));
  if(ids.size!==entities.length || entities.some(e=>Number(e.id.split(':')[1])>=state.nextEntityId)) throw new Error('Duplicate ID or stale ID counter');
  const requireRef=(ref:string|null)=>{if(ref!==null&&!ids.has(ref)) throw new Error(`Dangling reference: ${ref}`);};
  for(const station of state.stations) {requireRef(station.nodeId);requireRef(station.townId);const definition=stationDefinition(station.classId);if(!definition)throw new Error(`Unknown station class: ${station.classId}`);const stored=station.storage.reduce((sum,lot)=>sum+lot.quantity,0);if(!Number.isSafeInteger(stored)||stored>definition.storageCapacity)throw new Error('Station storage exceeds capacity');}
  for(const edge of state.railway.edges) requireRef(edge.ownerId);
  for(const route of state.routes) route.stops.forEach(requireRef);
  for(const train of state.trains) {
    requireRef(train.routeId);
    if(state.campaignId==='norwegian-fjords'){const definitions=[vehicleDefinition(train.locomotiveId),...train.vehicleIds.map(vehicleDefinition)];if(!definitions[0]||definitions[0].kind!=='locomotive'||definitions.slice(1).some(definition=>!definition||definition.kind!=='wagon'))throw new Error('Train contains unknown vehicle content');if(definitions.some(definition=>definition!.availableYear>currentYear(state)))throw new Error('Train contains vehicle content from a future year');}
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
  for(const [edgeId,infrastructure] of Object.entries(state.operations.infrastructure)){requireRef(edgeId);let end=0;for(const span of infrastructure.spans){if(Math.abs(span.startM-end)>.001||span.endM<=span.startM)throw new Error('Invalid engineering span');end=span.endM;}const edge=state.railway.edges.find(e=>e.id===edgeId)!;if(Math.abs(end-geometry.get(edge.id)!.lengthM)>.01)throw new Error('Engineering spans must cover entire edge');if(infrastructure.electrified?(infrastructure.electrificationCost<=0||infrastructure.electrificationMaintenancePerDay<=0):(infrastructure.electrificationCost!==0||infrastructure.electrificationMaintenancePerDay!==0))throw new Error('Invalid electrification record');}
  for(const industryId of Object.keys(state.operations.industryCycleTicks))requireRef(industryId);
  for(const industry of state.industries) {
    const recipe=industryDefinition(industry.definitionId);if(!recipe)throw new Error(`Unknown industry: ${industry.definitionId}`);
    const progress=state.operations.industryCycleTicks[industry.id];if(progress===undefined||progress>recipe.cycleTicks)throw new Error('Invalid industry cycle');
    const stored=Object.values(industry.inventory).reduce((sum,quantity)=>sum+(quantity??0),0);if(stored>recipe.storageCapacity)throw new Error('Industry storage exceeds capacity');
  }
  const townEconomyIds=Object.keys(state.operations.townEconomy).sort(),townIds=state.towns.map(town=>town.id).sort();if(townEconomyIds.join('|')!==townIds.join('|'))throw new Error('Town economy records must match towns');
  for(const town of state.towns) {
    const economy=state.operations.townEconomy[town.id]!;if(economy.lumberReceivedToday>economy.lumberDelivered)throw new Error('Invalid town economy');
  }
  if(new Set(state.operations.completedObjectives).size!==state.operations.completedObjectives.length)throw new Error('Duplicate objective completion');
  let cash=state.company.openingCash;
  for(const transaction of state.company.ledger) {cash+=transaction.amount;if(!Number.isSafeInteger(cash)||transaction.tick>state.tick) throw new Error('Invalid ledger');}
  if(cash!==state.company.cash) throw new Error('Ledger does not reconcile');
  return state;
}
const emptyVersionTwoOperations=()=>{const {townEconomy:_,delivered,...previous}=emptyOperations();const {mail:__,...legacyDelivered}=delivered;return {...previous,delivered:legacyDelivered};};
export const migrations=new Map<number,(value:unknown)=>unknown>([
  [1,(value)=>{const legacy=legacyEnvelope.parse(value);return {schemaVersion:2,gameVersion:'0.2.0',state:{...legacy.state,operations:emptyVersionTwoOperations()}};}],
  [2,(value)=>{const previous=versionTwoEnvelope.parse(value);return {schemaVersion:3,gameVersion:'0.3.0',state:{...previous.state,operations:{...previous.state.operations,townEconomy:initialTownEconomy(previous.state.towns)}}};}],
  [3,(value)=>{const previous=versionThreeEnvelope.parse(value);return {schemaVersion:4,gameVersion:'0.4.0',state:{...previous.state,operations:{...previous.state.operations,delivered:{...previous.state.operations.delivered,mail:0}}}};}],
  [4,(value)=>{const previous=versionFourEnvelope.parse(value);return {schemaVersion:5,gameVersion:'0.5.0',state:{...previous.state,startingYear:1900}};}],
  [5,(value)=>{const previous=versionFiveEnvelope.parse(value);return {schemaVersion:6,gameVersion:'0.6.0',state:{...previous.state,operations:{...previous.state.operations,infrastructure:Object.fromEntries(Object.entries(previous.state.operations.infrastructure).map(([edgeId,infrastructure])=>[edgeId,{...infrastructure,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0}]))}}};}]
]);
export function serialize(state:GameState):string { return JSON.stringify({schemaVersion:6,gameVersion:'0.6.0',state:validateState(state)}); }
export function deserialize(json:string):GameState {
  if(json.length>SAVE_LIMITS.bytes||new TextEncoder().encode(json).byteLength>SAVE_LIMITS.bytes) throw new Error('Save exceeds 20 MB limit');
  let value:unknown=JSON.parse(json);
  preflightEnvelope(value);
  const header=z.object({schemaVersion:integer.positive()});
  let version=header.parse(value).schemaVersion;
  if(version>6) throw new Error('Save was created by a newer game');
  while(version<6) {const migrate=migrations.get(version);if(!migrate)throw new Error('Missing migration');value=migrate(value);const next=header.parse(value).schemaVersion;if(next!==version+1)throw new Error('Migration must advance exactly one schema version');version=next;}
  return validateState(envelope.parse(value).state);
}
