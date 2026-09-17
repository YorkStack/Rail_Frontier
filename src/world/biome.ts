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
  palette:Object.freeze({water:'#45686f',lowland:'#a97850',forest:'#4d5940',rock:'#8b5a47',snow:'#e2d3b7',haze:'#d7b78f'}),
  lighting:Object.freeze({sunColor:'#ffe1ad',sunIntensity:2.8,skyColor:'#c9d9df',groundColor:'#72513d'}),
  vegetation:Object.freeze({density:10500,minHeightM:.45,maxHeightM:7.5,treelineM:1450}),
  surface:Object.freeze({scree:'#9d7458',sand:'#c49a70',soil:'#845640',snowLineM:99999,strata:Object.freeze({colors:Object.freeze(['#8f5948','#b87555','#d0a06f','#765044','#d8b782']),bandHeightM:46,strength:.68})})
});
