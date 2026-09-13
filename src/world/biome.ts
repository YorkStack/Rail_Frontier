import type { BiomeDefinition } from './profiles.js';

export const norwaySettlementSites=Object.freeze([
  Object.freeze({x:2200,z:3200}),
  Object.freeze({x:4700,z:4900}),
  Object.freeze({x:8500,z:7800})
]);

export const norwayBiome:Readonly<BiomeDefinition>=Object.freeze({
  id:'fjord',
  terrain:Object.freeze({widthM:16000,depthM:16000,cellM:25,peakM:1250,seaLevelM:0}),
  palette:Object.freeze({water:'#235864',lowland:'#74855c',forest:'#254c39',rock:'#7f8578',snow:'#dedfd4',haze:'#c5d3cd'}),
  lighting:Object.freeze({sunColor:'#ffedcb',sunIntensity:3,skyColor:'#c1d8e0',groundColor:'#566446'}),
  vegetation:Object.freeze({density:28000,minHeightM:9,maxHeightM:24,treelineM:650})
});
