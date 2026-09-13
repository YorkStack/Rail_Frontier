export interface BiomeDefinition {
  id: string;
  terrain: { widthM: number; depthM: number; cellM: number; peakM: number; seaLevelM: number };
  palette: { water: string; lowland: string; forest: string; rock: string; snow: string; haze: string };
  lighting: { sunColor: string; sunIntensity: number; skyColor: string; groundColor: string };
  vegetation: { density: number; minHeightM: number; maxHeightM: number; treelineM: number };
}
export const fjordProfile: BiomeDefinition = {
  id:'fjord-study',terrain:{widthM:4000,depthM:4000,cellM:20,peakM:780,seaLevelM:0},
  palette:{water:'#235864',lowland:'#74855c',forest:'#254c39',rock:'#7f8578',snow:'#dedfd4',haze:'#c5d3cd'},
  lighting:{sunColor:'#ffedcb',sunIntensity:3.0,skyColor:'#c1d8e0',groundColor:'#566446'},
  vegetation:{density:6500,minHeightM:9,maxHeightM:24,treelineM:530}
};
