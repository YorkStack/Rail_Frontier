import type { BiomeDefinition } from './profiles.js';
import {norwayV1SettlementSites,norwayV1WorldProfile} from './norway-v1.js';

export const norwaySettlementSites=norwayV1SettlementSites;

export const norwayBiome:Readonly<BiomeDefinition>=Object.freeze({
  id:'fjord',
  terrain:Object.freeze({widthM:norwayV1WorldProfile.widthM,depthM:norwayV1WorldProfile.depthM,cellM:norwayV1WorldProfile.cellM,peakM:norwayV1WorldProfile.peakM,seaLevelM:norwayV1WorldProfile.seaLevelM}),
  palette:Object.freeze({water:'#235864',lowland:'#74855c',forest:'#254c39',rock:'#7f8578',snow:'#dedfd4',haze:'#c5d3cd'}),
  lighting:Object.freeze({sunColor:'#ffedcb',sunIntensity:3,skyColor:'#c1d8e0',groundColor:'#566446'}),
  vegetation:Object.freeze({density:28000,minHeightM:9,maxHeightM:24,treelineM:650})
});
