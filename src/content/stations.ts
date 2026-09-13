import type { StationDefinition } from '../domain/operations.js';

export const stationDefinitions=Object.freeze({
  'rural-halt':Object.freeze<StationDefinition>({id:'rural-halt',purchaseCost:2_500_000,maintenancePerDay:2_500,coverageRadiusM:900,storageCapacity:500,platformLengthM:90}),
  'town-station':Object.freeze<StationDefinition>({id:'town-station',purchaseCost:7_500_000,maintenancePerDay:6_000,coverageRadiusM:1500,storageCapacity:1500,platformLengthM:180})
});

export type StationClassId=keyof typeof stationDefinitions;
export const stationDefinition=(id:string):StationDefinition|undefined=>stationDefinitions[id as StationClassId];
