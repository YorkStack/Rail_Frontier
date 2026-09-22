import rhineDem from '../content/geodata/rhine-dem.json' with {type:'json'};
import tyneDem from '../content/geodata/tyne-dem.json' with {type:'json'};
import {Heightfield} from './terrain.js';
import type {WorldGenerator} from './generator.js';
import type {WorldDefinition} from '../domain/model.js';
export type EuropeRegion='rhine'|'tyne';
export const europeDem={rhine:rhineDem,tyne:tyneDem};
export const geoPoint=(region:EuropeRegion,latitude:number,longitude:number)=>{const d=europeDem[region];return {x:(longitude-d.westLongitude)*d.metresPerLongitudeDegree,z:(d.northLatitude-latitude)*d.metresPerLatitudeDegree};};
export const europeSites={
 rhine:[{name:'Boppard',latitude:50.2309,longitude:7.5874,population:3400},{name:'St. Goar',latitude:50.1510,longitude:7.7126,population:2100},{name:'Bacharach',latitude:50.0586,longitude:7.7662,population:2400}],
 tyne:[{name:'Newcastle',latitude:54.9768,longitude:-1.6086,population:6200},{name:'North Shields',latitude:55.0073,longitude:-1.4497,population:4100},{name:'Sunderland',latitude:54.9081,longitude:-1.3848,population:5500}]
};
/** Water stages are gameplay approximations, not surveyed historic bathymetry.
 * The sloping Rhine surface intersects the original DEM valley; the coast uses sea level.
 */
export const regionalWaterLevel=(region:EuropeRegion,z:number)=>region==='rhine'?68.5+z*.00038:.65;
class RegionalHeightfield extends Heightfield {
 constructor(readonly region:EuropeRegion,heights:Float64Array,layers:{forest:Float32Array;rock:Float32Array;urban:Float32Array}){const d=europeDem[region];super(d.columns,d.rows,d.cellM,heights,regionalWaterLevel(region,0),layers);}
 override sample(x:number,z:number){return {...super.sample(x,z),waterLevelM:regionalWaterLevel(this.region,z)};}
}
const cache=new Map<EuropeRegion,Heightfield>();
function rhineCentreline(d:typeof rhineDem,heights:Float64Array,sites:{x:number;z:number}[]):number[] {
 const ordered=[...sites].sort((a,b)=>a.z-b.z),expected=(z:number)=>{let a=ordered[0]!,b=ordered[1]!;if(z>=ordered.at(-1)!.z){a=ordered.at(-2)!;b=ordered.at(-1)!;}else for(let i=1;i<ordered.length;i++)if(z<=ordered[i]!.z){a=ordered[i-1]!;b=ordered[i]!;break;}const t=(z-a.z)/(b.z-a.z);return a.x+(b.x-a.x)*t;},raw:number[]=[];
 for(let iz=0;iz<d.rows;iz++){const target=Math.round(expected(iz*d.cellM)/d.cellM),start=Math.max(0,target-18),end=Math.min(d.columns-1,target+18);let best=start;for(let ix=start+1;ix<=end;ix++)if(heights[iz*d.columns+ix]!<heights[iz*d.columns+best]!)best=ix;raw.push(best*d.cellM);}
 return raw.map((_,index)=>{let sum=0,weight=0;for(let offset=-4;offset<=4;offset++){const sample=raw[Math.max(0,Math.min(raw.length-1,index+offset))]!,w=5-Math.abs(offset);sum+=sample*w;weight+=w;}return sum/weight;});
}
export function europeHeightfield(region:EuropeRegion):Heightfield {
 const existing=cache.get(region);if(existing)return existing;
 const d=europeDem[region],size=d.heights.length,heights=Float64Array.from(d.heights),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size),sites=europeSites[region].map(s=>geoPoint(region,s.latitude,s.longitude));
 for(let i=0;i<size;i++){const x=i%d.columns*d.cellM,z=Math.floor(i/d.columns)*d.cellM,y=heights[i]!,left=heights[i%d.columns?i-1:i]!,up=heights[i>=d.columns?i-d.columns:i]!,slope=Math.hypot(y-left,y-up)/d.cellM,patch=.5+.5*Math.sin(x*.0013+Math.cos(z*.0011)*2)*Math.cos(z*.0017);
  urban[i]=Math.max(0,...sites.map(s=>1-Math.hypot(x-s.x,z-s.z)/480));
  forest[i]=y>regionalWaterLevel(region,z)+2?(1-urban[i]!)*(region==='rhine'?.25+patch*.7:patch*.52):0;rock[i]=Math.min(1,slope*1.8);
 }
 // Skadi measures the river surface, not its bed. Reconstruct shallow bathymetry
 // in the DEM's low valley band and a narrow continuous thalweg following the
 // locally lowest samples near the real settlement corridor.
 if(region==='rhine'){
  for(let i=0;i<size;i++){const z=Math.floor(i/d.columns)*d.cellM,water=regionalWaterLevel(region,z),delta=heights[i]!-water;if(delta<7){const edge=Math.max(0,Math.min(1,delta/7));heights[i]=water-4+Math.pow(edge,3)*11;}}
  const centres=rhineCentreline(d,heights,sites);for(let iz=0;iz<d.rows;iz++)for(let ix=0;ix<d.columns;ix++){const distance=Math.abs(ix*d.cellM-centres[iz]!),edge=Math.min(1,distance/230),target=regionalWaterLevel(region,iz*d.cellM)-4+edge*edge*7;if(distance<230)heights[iz*d.columns+ix]=Math.min(heights[iz*d.columns+ix]!,target);}
 }
 const result=new RegionalHeightfield(region,heights,{forest,rock,urban});cache.set(region,result);return result;
}
export function europeGenerator(region:EuropeRegion):WorldGenerator {
 const d=europeDem[region],sites=europeSites[region].map(s=>geoPoint(region,s.latitude,s.longitude));
 return {id:`${region}-dem-v1`,biomeId:region,version:1,landforms:{anchors:{entry:sites[0]!,settlement:sites[1]!,industry:sites[2]!},corridorX:z=>sites.reduce((best,p)=>Math.abs(p.z-z)<Math.abs(best.z-z)?p:best,sites[0]!).x,waterCrossSection:()=>({westBankX:null,eastBankX:null}),waterfall:null},validate(w:WorldDefinition){if(w.biomeId!==region||w.generatorVersion!==1||w.widthM!==(d.columns-1)*d.cellM||w.depthM!==(d.rows-1)*d.cellM||w.cellM!==d.cellM||w.seed!==(region==='rhine'?500722:550922))throw new Error(`Unsupported ${region} terrain definition`);},elevation:(x,z)=>europeHeightfield(region).sample(x,z).elevationM,generate(w){this.validate(w);return europeHeightfield(region);}};
}
