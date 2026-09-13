import type { VehicleDefinition } from '../domain/operations.js';

export const vehicleDefinitions=Object.freeze({
  'nord-2-6-0':Object.freeze<VehicleDefinition>({id:'nord-2-6-0',kind:'locomotive',traction:'steam',availableYear:1900,purchaseCost:12_000_000,massKg:52_000,powerW:620_000,tractiveForceN:118_000,maxSpeedMps:22.22,lengthM:15.2,capacity:{},runningCostPerKm:4_800,maintenancePerDay:18_000}),
  'fjord-passenger-coach':Object.freeze<VehicleDefinition>({id:'fjord-passenger-coach',kind:'wagon',traction:'none',availableYear:1900,purchaseCost:3_000_000,massKg:24_000,powerW:0,tractiveForceN:0,maxSpeedMps:22.22,lengthM:18.4,capacity:{passengers:48},runningCostPerKm:900,maintenancePerDay:4_000}),
  'fjord-freight-wagon':Object.freeze<VehicleDefinition>({id:'fjord-freight-wagon',kind:'wagon',traction:'none',availableYear:1900,purchaseCost:2_400_000,massKg:19_000,powerW:0,tractiveForceN:0,maxSpeedMps:18.05,lengthM:12.6,capacity:{timber:40,lumber:40},runningCostPerKm:750,maintenancePerDay:3_200})
});

export type VehicleId=keyof typeof vehicleDefinitions;
export const vehicleDefinition=(id:string):VehicleDefinition|undefined=>vehicleDefinitions[id as VehicleId];
