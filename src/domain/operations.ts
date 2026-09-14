import type { CargoKind,Id,Money,Town } from './model.js';
/** Persistent content and operating contracts shared by simulation, saves and UI. */
export interface VehicleDefinition {
  id:string;kind:'locomotive'|'wagon';traction:'steam'|'diesel'|'electric'|'none';availableYear:number;
  purchaseCost:Money;massKg:number;powerW:number;tractiveForceN:number;maxSpeedMps:number;
  lengthM:number;capacity:Partial<Record<CargoKind,number>>;runningCostPerKm:Money;maintenancePerDay:Money;
}
export interface StationDefinition {id:string;purchaseCost:Money;maintenancePerDay:Money;coverageRadiusM:number;storageCapacity:number;platformLengthM:number}
export interface IndustryRecipe {id:string;inputs:Partial<Record<CargoKind,number>>;outputs:Partial<Record<CargoKind,number>>;cycleTicks:number;storageCapacity:number}
export interface TownEconomyState {
  lumberDemand:number;lumberDelivered:number;lumberReceivedToday:number;mailWaiting:number;
  economicActivity:number;connectedDays:number;growthRemainder:number;lastPopulationChange:number;
}
export interface OperationsState {
  demand:{originTownId:Id<'town'>;destinationTownId:Id<'town'>;quantity:number;generatedTick:number}[];
  trainServices:Record<Id<'train'>,{nextStopIndex:number;direction:1|-1;ageDays:number;condition:number;distanceM:number;revenue:Money;operatingCosts:Money;costRemainder:number}>;
  reservations:{edgeId:Id<'edge'>;trainId:Id<'train'>}[];
  infrastructure:Record<Id<'edge'>,{spans:{startM:number;endM:number;kind:'ground'|'bridge'|'tunnel'}[];constructionCost:Money;maintenancePerDay:Money}>;
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
export const emptyOperations=(towns:readonly Pick<Town,'id'|'population'>[]=[]):OperationsState=>({demand:[],trainServices:{},reservations:[],infrastructure:{},industryCycleTicks:{},townEconomy:initialTownEconomy(towns),delivered:{passengers:0,mail:0,timber:0,lumber:0},completedObjectives:[],monthlyAccounts:[],lastCommandSequence:0});
