import {regionalVehicles} from './regional-vehicles.js';
import type { VehicleDefinition } from '../domain/operations.js';

export const vehicleDefinitions:Readonly<Record<string,VehicleDefinition>>=Object.freeze({...regionalVehicles,
  'nord-2-6-0':Object.freeze<VehicleDefinition>({id:'nord-2-6-0',name:'Nord 2-6-0',kind:'locomotive',traction:'steam',availableYear:1900,purchaseCost:12_000_000,massKg:52_000,powerW:620_000,tractiveForceN:118_000,maxSpeedMps:22.22,lengthM:15.2,capacity:{},runningCostPerKm:4_800,maintenancePerDay:18_000}),
  'nord-el-1':Object.freeze<VehicleDefinition>({id:'nord-el-1',name:'Nord El 1',kind:'locomotive',traction:'electric',availableYear:1922,purchaseCost:22_000_000,massKg:61_300,powerW:690_000,tractiveForceN:157_000,maxSpeedMps:19.44,lengthM:12.7,capacity:{},runningCostPerKm:2_400,maintenancePerDay:10_500}),
  'nord-di-3b':Object.freeze<VehicleDefinition>({id:'nord-di-3b',name:'Nord Di 3B',kind:'locomotive',traction:'diesel',availableYear:1960,purchaseCost:32_000_000,massKg:103_000,powerW:1_305_000,tractiveForceN:240_000,maxSpeedMps:39.72,lengthM:18.9,capacity:{},runningCostPerKm:3_200,maintenancePerDay:12_000}),
  'nord-di-4':Object.freeze<VehicleDefinition>({id:'nord-di-4',name:'Nord Di 4',kind:'locomotive',traction:'diesel',availableYear:1981,purchaseCost:48_000_000,massKg:120_000,powerW:2_450_000,tractiveForceN:360_000,maxSpeedMps:38.89,lengthM:20.8,capacity:{},runningCostPerKm:3_800,maintenancePerDay:15_000}),
  'nord-el-18':Object.freeze<VehicleDefinition>({id:'nord-el-18',name:'Nord El 18',kind:'locomotive',traction:'electric',availableYear:1996,purchaseCost:72_000_000,massKg:88_310,powerW:5_400_000,tractiveForceN:275_000,maxSpeedMps:55.56,lengthM:18.5,capacity:{},runningCostPerKm:2_100,maintenancePerDay:18_000}),
  'fjord-passenger-coach':Object.freeze<VehicleDefinition>({id:'fjord-passenger-coach',name:'Fjord Passenger Coach',kind:'wagon',traction:'none',availableYear:1900,purchaseCost:3_000_000,massKg:24_000,powerW:0,tractiveForceN:0,maxSpeedMps:22.22,lengthM:18.4,capacity:{passengers:48,mail:24},runningCostPerKm:900,maintenancePerDay:4_000}),
  'fjord-freight-wagon':Object.freeze<VehicleDefinition>({id:'fjord-freight-wagon',name:'Fjord Freight Wagon',kind:'wagon',traction:'none',availableYear:1900,purchaseCost:2_400_000,massKg:19_000,powerW:0,tractiveForceN:0,maxSpeedMps:18.05,lengthM:12.6,capacity:{timber:40,lumber:40},runningCostPerKm:750,maintenancePerDay:3_200})
});

export type VehicleId=keyof typeof vehicleDefinitions;
export const vehicleDefinition=(id:string):VehicleDefinition|undefined=>vehicleDefinitions[id as VehicleId];
export const vehicleRegion=(campaignId:string):string=>campaignId==='middle-rhine'?'rhine':campaignId==='tyne-wear-coast'?'tyne':'norway';
export const vehicleInCampaign=(id:string,campaignId:string):boolean=>{const region=vehicleRegion(campaignId);return region==='norway'?!id.startsWith('rhine-')&&!id.startsWith('tyne-'):id.startsWith(region+'-');};
export const availableVehicles=(year:number,kind?:VehicleDefinition['kind'],campaignId='norwegian-fjords'):readonly VehicleDefinition[]=>Object.values(vehicleDefinitions).filter(d=>d.availableYear<=year&&(!kind||d.kind===kind)&&vehicleInCampaign(d.id,campaignId));
export const freightCapacityOf=(d:VehicleDefinition|undefined):number=>Math.max(0,...Object.entries(d?.capacity??{}).filter(([kind])=>kind!=='passengers'&&kind!=='mail').map(([,v])=>v??0));
