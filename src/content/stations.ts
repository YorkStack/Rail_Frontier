import type { StationDefinition } from '../domain/operations.js';

export const stationDefinitions=Object.freeze({
  'rural-halt':Object.freeze<StationDefinition>({id:'rural-halt',purchaseCost:2_500_000,maintenancePerDay:2_500,coverageRadiusM:900,storageCapacity:500,platformLengthM:90}),
  'small-station':Object.freeze<StationDefinition>({id:'small-station',purchaseCost:4_500_000,maintenancePerDay:4_000,coverageRadiusM:1200,storageCapacity:900,platformLengthM:140}),
  'town-station':Object.freeze<StationDefinition>({id:'town-station',purchaseCost:7_500_000,maintenancePerDay:6_000,coverageRadiusM:1500,storageCapacity:1500,platformLengthM:180}),
  'city-station':Object.freeze<StationDefinition>({id:'city-station',purchaseCost:13_500_000,maintenancePerDay:10_000,coverageRadiusM:2200,storageCapacity:3500,platformLengthM:260}),
  'freight-terminal':Object.freeze<StationDefinition>({id:'freight-terminal',purchaseCost:18_000_000,maintenancePerDay:13_000,coverageRadiusM:2400,storageCapacity:6000,platformLengthM:300}),
  'major-terminal':Object.freeze<StationDefinition>({id:'major-terminal',purchaseCost:28_000_000,maintenancePerDay:19_000,coverageRadiusM:3200,storageCapacity:10_000,platformLengthM:400})
});

export type StationClassId=keyof typeof stationDefinitions;
export const stationDefinition=(id:string):StationDefinition|undefined=>stationDefinitions[id as StationClassId];
export const stationClassName=(id:string):string=>id.split('-').map(part=>part[0]!.toUpperCase()+part.slice(1)).join(' ');
