import type { VehicleDefinition } from '../domain/operations.js';

export const vehicleDefinitions=Object.freeze({
  'nord-2-6-0':Object.freeze<VehicleDefinition>({id:'nord-2-6-0',name:'Nord 2-6-0',kind:'locomotive',traction:'steam',availableYear:1900,purchaseCost:12_000_000,massKg:52_000,powerW:620_000,tractiveForceN:118_000,maxSpeedMps:22.22,lengthM:15.2,capacity:{},runningCostPerKm:4_800,maintenancePerDay:18_000}),
  'nord-di-3b':Object.freeze<VehicleDefinition>({id:'nord-di-3b',name:'Nord Di 3B',kind:'locomotive',traction:'diesel',availableYear:1960,purchaseCost:32_000_000,massKg:103_000,powerW:1_305_000,tractiveForceN:240_000,maxSpeedMps:39.72,lengthM:18.9,capacity:{},runningCostPerKm:3_200,maintenancePerDay:12_000}),
  'fjord-passenger-coach':Object.freeze<VehicleDefinition>({id:'fjord-passenger-coach',name:'Fjord Passenger Coach',kind:'wagon',traction:'none',availableYear:1900,purchaseCost:3_000_000,massKg:24_000,powerW:0,tractiveForceN:0,maxSpeedMps:22.22,lengthM:18.4,capacity:{passengers:48,mail:24},runningCostPerKm:900,maintenancePerDay:4_000}),
  'fjord-freight-wagon':Object.freeze<VehicleDefinition>({id:'fjord-freight-wagon',name:'Fjord Freight Wagon',kind:'wagon',traction:'none',availableYear:1900,purchaseCost:2_400_000,massKg:19_000,powerW:0,tractiveForceN:0,maxSpeedMps:18.05,lengthM:12.6,capacity:{timber:40,lumber:40},runningCostPerKm:750,maintenancePerDay:3_200})
});

export type VehicleId=keyof typeof vehicleDefinitions;
export const vehicleDefinition=(id:string):VehicleDefinition|undefined=>vehicleDefinitions[id as VehicleId];
export const availableVehicles=(year:number,kind?:VehicleDefinition['kind']):readonly VehicleDefinition[]=>Object.values(vehicleDefinitions).filter(definition=>definition.availableYear<=year&&(!kind||definition.kind===kind));
