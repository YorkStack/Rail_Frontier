import type { CargoKind,CubicCurve,Id,Money,Town,Vec3 } from './model.js';
/** Persistent content and operating contracts shared by simulation, saves and UI. */
export interface VehicleDefinition {
  id:string;name:string;kind:'locomotive'|'wagon';traction:'steam'|'diesel'|'electric'|'none';availableYear:number;
  purchaseCost:Money;massKg:number;powerW:number;tractiveForceN:number;maxSpeedMps:number;
  lengthM:number;capacity:Partial<Record<CargoKind,number>>;runningCostPerKm:Money;maintenancePerDay:Money;
}
export interface StationDefinition {id:string;purchaseCost:Money;maintenancePerDay:Money;coverageRadiusM:number;storageCapacity:number;platformLengthM:number}
export interface IndustryRecipe {id:string;inputs:Partial<Record<CargoKind,number>>;outputs:Partial<Record<CargoKind,number>>;cycleTicks:number;storageCapacity:number}
export interface TownEconomyState {
  lumberDemand:number;lumberDelivered:number;lumberReceivedToday:number;mailWaiting:number;
  economicActivity:number;connectedDays:number;growthRemainder:number;lastPopulationChange:number;
}
export type EarthworkKind='cut'|'fill'|'formation';
export interface EarthworkSection {
  startM:number;endM:number;kind:EarthworkKind;maxDepthM:number;crossSectionAreaM2:number;volumeM3:number;
}
export type TerrainOperation=
  | {id:string;kind:'station-pad';version:1;sequence:number;stationId:Id<'station'>;center:Vec3;orientationRad:number;lengthM:number;widthM:number;targetElevationM:number;bounds:{minX:number;minZ:number;maxX:number;maxZ:number}}
  | {id:string;kind:'alignment';version:1;sequence:number;sourceId:string;curve:CubicCurve;formationWidthM:number;shoulderWidthM:number;sections:EarthworkSection[];bounds:{minX:number;minZ:number;maxX:number;maxZ:number}};
export interface TerrainEngineeringState {revision:number;patchGeneratorVersion:1;operations:TerrainOperation[]}
export interface OperationsState {
  demand:{originTownId:Id<'town'>;destinationTownId:Id<'town'>;quantity:number;generatedTick:number}[];
  trainServices:Record<Id<'train'>,{nextStopIndex:number;direction:1|-1;ageDays:number;condition:number;distanceM:number;revenue:Money;operatingCosts:Money;costRemainder:number}>;
  reservations:{edgeId:Id<'edge'>;trainId:Id<'train'>}[];
  infrastructure:Record<Id<'edge'>,{spans:{startM:number;endM:number;kind:'ground'|'bridge'|'tunnel'|'station'}[];constructionCost:Money;maintenancePerDay:Money;electrified:boolean;electrificationCost:Money;electrificationMaintenancePerDay:Money}>;
  terrain:TerrainEngineeringState;
  industryCycleTicks:Record<Id<'industry'>,number>;
  townEconomy:Record<Id<'town'>,TownEconomyState>;
  delivered:Record<CargoKind,number>;
  completedObjectives:string[];
  monthlyAccounts:{month:number;revenue:Money;operatingCost:Money;capitalCost:Money}[];
  lastCommandSequence:number;
}
export const dailyLumberDemand=(population:number):number=>Math.max(1,Math.floor(population/400));
export const dailyMailDemand=(population:number):number=>Math.max(1,Math.floor(population*.01));
export const initialTownEconomy=(towns:readonly Pick<Town,'id'|'population'>[]):OperationsState['townEconomy']=>Object.fromEntries(towns.map(town=>[town.id,{lumberDemand:dailyLumberDemand(town.population)*7,lumberDelivered:0,lumberReceivedToday:0,mailWaiting:dailyMailDemand(town.population)*7,economicActivity:35,connectedDays:0,growthRemainder:0,lastPopulationChange:0}])) as OperationsState['townEconomy'];
export const emptyOperations=(towns:readonly Pick<Town,'id'|'population'>[]=[]):OperationsState=>({demand:[],trainServices:{},reservations:[],infrastructure:{},terrain:{revision:0,patchGeneratorVersion:1,operations:[]},industryCycleTicks:{},townEconomy:initialTownEconomy(towns),delivered:{passengers:0,mail:0,timber:0,lumber:0},completedObjectives:[],monthlyAccounts:[],lastCommandSequence:0});
