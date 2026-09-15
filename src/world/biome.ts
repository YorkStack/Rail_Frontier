import type { BiomeDefinition } from './profiles.js';
import {norwayV1SettlementSites,norwayV1WorldProfile} from './norway-v1.js';
import {arizonaV1WorldProfile} from './arizona-v1.js';

export const norwaySettlementSites=norwayV1SettlementSites;

export const norwayBiome:Readonly<BiomeDefinition>=Object.freeze({
  id:'fjord',
  terrain:Object.freeze({widthM:norwayV1WorldProfile.widthM,depthM:norwayV1WorldProfile.depthM,cellM:norwayV1WorldProfile.cellM,peakM:norwayV1WorldProfile.peakM,seaLevelM:norwayV1WorldProfile.seaLevelM}),
  palette:Object.freeze({water:'#234f59',lowland:'#66795b',forest:'#294a3b',rock:'#747670',snow:'#d9ddd8',haze:'#afbfbd'}),
  lighting:Object.freeze({sunColor:'#fff0d5',sunIntensity:2.25,skyColor:'#b8ced0',groundColor:'#465445'}),
  vegetation:Object.freeze({density:28000,minHeightM:9,maxHeightM:24,treelineM:650})
});

export const arizonaBiome:Readonly<BiomeDefinition>=Object.freeze({
  id:'southwest',
  terrain:Object.freeze({widthM:arizonaV1WorldProfile.widthM,depthM:arizonaV1WorldProfile.depthM,cellM:arizonaV1WorldProfile.cellM,peakM:arizonaV1WorldProfile.peakM,seaLevelM:0}),
  palette:Object.freeze({water:'#45686f',lowland:'#aa7048',forest:'#46563a',rock:'#914c34',snow:'#e4d8bf',haze:'#d8b080'}),
  lighting:Object.freeze({sunColor:'#ffe1ad',sunIntensity:2.8,skyColor:'#c9d9df',groundColor:'#72513d'}),
  vegetation:Object.freeze({density:10500,minHeightM:.45,maxHeightM:7.5,treelineM:1450}),
  surface:Object.freeze({scree:'#a86745',sand:'#c28b5e',soil:'#8d4e36',snowLineM:99999,strata:Object.freeze({colors:Object.freeze(['#a95538','#c36f45','#d69462','#8c4736','#e0ad78']),bandHeightM:46,strength:.72})})
});
