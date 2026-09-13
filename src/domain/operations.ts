import type { CargoKind,Id,Money } from './model.js';
/** Implementation-phase contracts. Economic systems consuming these remain pending. */
export interface VehicleDefinition {
  id:string;kind:'locomotive'|'wagon';traction:'steam'|'diesel'|'electric'|'none';availableYear:number;
  purchaseCost:Money;massKg:number;powerW:number;tractiveForceN:number;maxSpeedMps:number;
  lengthM:number;capacity:Partial<Record<CargoKind,number>>;runningCostPerKm:Money;maintenancePerDay:Money;
}
export interface StationDefinition {id:string;purchaseCost:Money;maintenancePerDay:Money;coverageRadiusM:number;storageCapacity:number;platformLengthM:number}
export interface IndustryRecipe {id:string;inputs:Partial<Record<CargoKind,number>>;outputs:Partial<Record<CargoKind,number>>;cycleTicks:number;storageCapacity:number}
export interface OperationsState {
  demand:{originTownId:Id<'town'>;destinationTownId:Id<'town'>;quantity:number;generatedTick:number}[];
  trainServices:Record<Id<'train'>,{nextStopIndex:number;direction:1|-1;ageDays:number;condition:number;distanceM:number;revenue:Money;operatingCosts:Money;costRemainder:number}>;
  reservations:{edgeId:Id<'edge'>;trainId:Id<'train'>}[];
  infrastructure:Record<Id<'edge'>,{spans:{startM:number;endM:number;kind:'ground'|'bridge'|'tunnel'}[];constructionCost:Money;maintenancePerDay:Money}>;
  industryCycleTicks:Record<Id<'industry'>,number>;
  delivered:Record<CargoKind,number>;
  completedObjectives:string[];
  monthlyAccounts:{month:number;revenue:Money;operatingCost:Money;capitalCost:Money}[];
  lastCommandSequence:number;
}
export const emptyOperations=():OperationsState=>({demand:[],trainServices:{},reservations:[],infrastructure:{},industryCycleTicks:{},delivered:{passengers:0,timber:0,lumber:0},completedObjectives:[],monthlyAccounts:[],lastCommandSequence:0});
