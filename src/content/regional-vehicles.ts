import type {VehicleDefinition} from '../domain/operations.js';
/** Play-balanced specifications and original, historically inspired silhouettes. */
export const regionalVehicles:Record<string,VehicleDefinition>={};
for(const region of ['rhine','tyne']){
 const engines=region==='rhine'?[
  ['g3','Prussian G 3',1883,'steam',16,480,95000,60],['p8','Prussian P 8',1906,'steam',19,880,135000,100],['v100','DB V 100',1958,'diesel',15,810,177000,100],['e10','DB E 10',1956,'electric',16.5,3700,275000,140]
 ]:[['j21','NER J21',1886,'steam',16,510,97000,65],['a3','LNER A3',1928,'steam',19,1600,150000,145],['class37','BR Class 37',1960,'diesel',18.7,1300,250000,130],['class91','BR Class 91',1989,'electric',19.4,4800,190000,200]];
 for(const [name,label,year,traction,length,power,force,speed] of engines){const id=`${region}-${name}`;regionalVehicles[id]={id,name:String(label),kind:'locomotive',traction:traction as VehicleDefinition['traction'],availableYear:Number(year),purchaseCost:Number(power)*19000,massKg:traction==='steam'?70000:85000,powerW:Number(power)*1000,tractiveForceN:Number(force),maxSpeedMps:Number(speed)/3.6,lengthM:Number(length),capacity:{},runningCostPerKm:traction==='electric'?2400:4200,maintenancePerDay:16000};}
 const wagons:{id:string;name:string;year:number;length:number;capacity:VehicleDefinition['capacity']}[]=[
  {id:'coach',name:region==='rhine'?'Prussian compartment coach':'NER compartment coach',year:1880,length:12.4,capacity:{passengers:40,mail:12}},
  {id:'modern-coach',name:region==='rhine'?'Intercity coach':'BR intercity coach',year:1965,length:22,capacity:{passengers:64,mail:12}},
  {id:'mail',name:'Postal van',year:1880,length:11,capacity:{mail:72}},
  {id:'coal',name:'Open mineral wagon',year:1880,length:8.5,capacity:{coal:25,ore:25}},
  {id:'hopper',name:'Mineral hopper',year:1935,length:11,capacity:{coal:45,ore:45}},
  {id:'goods',name:'Covered goods van',year:1880,length:10,capacity:{lumber:28,steel:28}},
  {id:'flat',name:'Stake wagon',year:1880,length:12,capacity:{timber:35,steel:35}},
  {id:'tank',name:'Oil tank wagon',year:1900,length:11,capacity:{oil:28}}
 ];
 for(const w of wagons){const id=`${region}-${w.id}`;regionalVehicles[id]={id,name:w.name,kind:'wagon',traction:'none',availableYear:w.year,purchaseCost:w.year>1930?3400000:2100000,massKg:w.id.includes('coach')?22000:12000,powerW:0,tractiveForceN:0,maxSpeedMps:w.year>1960?55.5:22.2,lengthM:w.length,capacity:w.capacity,runningCostPerKm:750,maintenancePerDay:3000};}
}
