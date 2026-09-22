import type {CampaignDefinition} from '../domain/model.js';
import type {BiomeDefinition} from '../world/profiles.js';
import type {CampaignPresentation} from './presentation.js';
import {europeGenerator,europeSites,europeDem,geoPoint,type EuropeRegion} from '../world/europe.js';
export const europeCampaigns=Object.fromEntries((['rhine','tyne'] as const).map(region=>{
 const generator=europeGenerator(region),d=europeDem[region],seed=region==='rhine'?500722:550922;
 const objectives:CampaignDefinition['objectives']=region==='rhine'?
  [{id:'rhine-connection',type:'connectTowns',target:2},{id:'rhine-freight',type:'deliverFreight',target:60},{id:'rhine-profit',type:'operatingProfit',target:1_500_000}]:
  [{id:'tyne-connection',type:'connectTowns',target:2},{id:'tyne-freight',type:'deliverFreight',target:100},{id:'tyne-profit',type:'operatingProfit',target:2_000_000}];
 const campaign:CampaignDefinition={id:region==='rhine'?'middle-rhine':'tyne-wear-coast',version:1,title:region==='rhine'?'Middle Rhine':'Tyne & Wear Coast',startingYear:1900,startingCash:1_000_000_000,world:{seed,widthM:32000,depthM:32000,cellM:d.cellM,generatorVersion:1,biomeId:region},towns:europeSites[region].map((s,i)=>{const p=geoPoint(region,s.latitude,s.longitude);return{id:`town:${i+2}` as const,name:s.name,position:{...p,y:generator.elevation(p.x,p.z,seed)},population:s.population};}),objectives};
 return [region,campaign];
})) as Record<EuropeRegion,CampaignDefinition>;
export function europePresentation(region:EuropeRegion):CampaignPresentation {
 const campaign=europeCampaigns[region],start=campaign.towns[0]!.position,second=campaign.towns[1]!.position,third=campaign.towns[2]!.position;
 const biome:BiomeDefinition={id:region,terrain:{widthM:32000,depthM:32000,cellM:80,peakM:region==='rhine'?580:270,seaLevelM:0},palette:{water:region==='rhine'?'#48645f':'#345767',lowland:region==='rhine'?'#778254':'#738063',forest:'#354b32',rock:region==='rhine'?'#77776e':'#85816e',snow:'#dedcd0',haze:region==='rhine'?'#c8c5ae':'#b6c5c7'},lighting:{sunColor:region==='rhine'?'#fff0d1':'#ecf2ed',sunIntensity:2.4,skyColor:'#c0d3dc',groundColor:'#5e6651'},vegetation:{density:22000,minHeightM:2,maxHeightM:20,treelineM:900},surface:{scree:'#8b8270',sand:'#b4ab8c',soil:'#6b6150',snowLineM:99999}};
 return{id:`${region}-v1`,rendererId:'fjord',assetManifestUrl:`/packs/${region}.json`,assetRoles:{station:`${region}-station`,bridgeSpan:`${region}-bridge-span`,tunnelPortal:`${region}-tunnel-portal`},biome,proceduralScenery:region,entryCameraId:'entry',cameraPresets:{entry:{targetXZ:start,offset:{x:220,y:120,z:240}},regional:{targetXZ:second,offset:{x:6500,y:4900,z:7000}},settlement:{targetXZ:start,offset:{x:135,y:65,z:150}},industry:{targetXZ:third,offset:{x:240,y:140,z:260}},coast:{targetXZ:second,offset:{x:2100,y:1300,z:1400}},train:{targetXZ:start,offset:{x:120,y:60,z:150}}},cameraSweep:['regional','settlement','industry','coast']};
}
