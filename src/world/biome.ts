import type { BiomeDefinition } from './profiles.js';
import {norwayV1SettlementSites,norwayV1WorldProfile} from './norway-v1.js';

export const norwaySettlementSites=norwayV1SettlementSites;

export const norwayBiome:Readonly<BiomeDefinition>=Object.freeze({
  id:'fjord',
  terrain:Object.freeze({widthM:norwayV1WorldProfile.widthM,depthM:norwayV1WorldProfile.depthM,cellM:norwayV1WorldProfile.cellM,peakM:norwayV1WorldProfile.peakM,seaLevelM:norwayV1WorldProfile.seaLevelM}),
  palette:Object.freeze({water:'#234f59',lowland:'#66795b',forest:'#294a3b',rock:'#747670',snow:'#d9ddd8',haze:'#afbfbd'}),
  lighting:Object.freeze({sunColor:'#fff0d5',sunIntensity:2.25,skyColor:'#b8ced0',groundColor:'#465445'}),
  vegetation:Object.freeze({density:28000,minHeightM:9,maxHeightM:24,treelineM:650})
});
