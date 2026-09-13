/** Canonical simulation coordinates: metres, right handed, X east, Y up, Z south. */
export interface Vec3 { x: number; y: number; z: number }
export type EntityKind = 'node' | 'edge' | 'station' | 'train' | 'route' | 'town' | 'industry' | 'company' | 'transaction';
export type Id<K extends EntityKind> = `${K}:${number}`;
export type Money = number; // Integer minor currency units; validate at boundaries.
export type Speed = 0 | 1 | 2 | 4 | 8;
export interface CubicCurve { p0: Vec3; p1: Vec3; p2: Vec3; p3: Vec3 }
export interface RailNode { id: Id<'node'>; position: Vec3 }
export interface RailEdge {
  id: Id<'edge'>; from: Id<'node'>; to: Id<'node'>;
  curve: CubicCurve; speedLimitMps: number; ownerId: Id<'company'>;
}
export interface RailGraph { nodes: RailNode[]; edges: RailEdge[]; revision: number }
export interface Traversal { edgeId: Id<'edge'>; reverse: boolean }
export interface MotionState { path: Traversal[]; leg: number; distanceM: number; arrived: boolean }
export interface Train {
  id: Id<'train'>; routeId: Id<'route'> | null; locomotiveId: string;
  vehicleIds: string[]; motion: MotionState; speedMps: number;
  phase: 'idle' | 'running' | 'dwelling' | 'blocked'; dwellTicks: number;
  cargo: CargoLot[];
}
export type CargoKind = 'passengers' | 'timber' | 'lumber';
export interface CargoLot { kind: CargoKind; quantity: number; destinationId: Id<'station'>; originId: Id<'station'>; loadedTick: number; distanceM: number }
export interface Station { id: Id<'station'>; nodeId: Id<'node'>; townId: Id<'town'> | null; classId: string; storage: CargoLot[] }
export interface Route { id: Id<'route'>; stops: Id<'station'>[]; mode: 'shuttle' | 'loop' }
export interface Town { id: Id<'town'>; name: string; position: Vec3; population: number }
export interface Industry { id: Id<'industry'>; definitionId: string; position: Vec3; inventory: Partial<Record<CargoKind, number>> }
export interface Transaction { id: Id<'transaction'>; tick: number; category: 'construction' | 'vehicle' | 'passenger' | 'freight' | 'maintenance'; amount: Money; entityId: string; description: string }
export interface WorldDefinition { seed: number; widthM: number; depthM: number; cellM: number; generatorVersion: number; biomeId: string }
export interface CampaignDefinition {
  id: string; version: number; title: string; startingYear: number; startingCash: Money;
  world: WorldDefinition; towns: Town[];
  objectives: { id: string; type: 'connectTowns' | 'deliverPassengers' | 'operatingProfit'; target: number }[];
}
export interface GameState {
  tick: number; nextEntityId: number; rngState: number; campaignId: string; campaignVersion: number;
  world: WorldDefinition; railway: RailGraph; stations: Station[]; trains: Train[];
  routes: Route[]; towns: Town[]; industries: Industry[];
  company: { id: Id<'company'>; cash: Money; openingCash: Money; ledger: Transaction[] };
  objectiveProgress: Record<string, number>;
}
export function allocateId<K extends EntityKind>(state: Pick<GameState, 'nextEntityId'>, kind: K): Id<K> {
  if (!Number.isSafeInteger(state.nextEntityId) || state.nextEntityId < 1 || state.nextEntityId >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid ID counter');
  return `${kind}:${state.nextEntityId++}`;
}
