import {RAIL_TO_FORMATION_M} from './station-layout.js';
import type {CubicCurve} from '../domain/model.js';
import type {EarthworkKind,EarthworkSection,TerrainOperation} from '../domain/operations.js';
import type {Terrain} from '../world/terrain.js';
import {compileCurve,sampleDistance,type TrackGeometry} from './geometry.js';
import type {EngineeringInterval} from './planner.js';

export const TERRAIN_PATCH_GENERATOR_VERSION=1 as const;
export const FORMATION_WIDTH_M=6;
export const EARTHWORK_SHOULDER_M=9;
export const STATION_PAD_LEVEL_MARGIN_M=6;
export const STATION_PAD_BLEND_M=8;


const boundsForCurve=(curve:CubicCurve,margin:number)=>({
  minX:Math.min(curve.p0.x,curve.p1.x,curve.p2.x,curve.p3.x)-margin,
  minZ:Math.min(curve.p0.z,curve.p1.z,curve.p2.z,curve.p3.z)-margin,
  maxX:Math.max(curve.p0.x,curve.p1.x,curve.p2.x,curve.p3.x)+margin,
  maxZ:Math.max(curve.p0.z,curve.p1.z,curve.p2.z,curve.p3.z)+margin
});
const kindFor=(depth:number):EarthworkKind=>depth>.3?'fill':depth<-.3?'cut':'formation';

export function deriveEarthworkSections(geometry:TrackGeometry,terrain:Terrain,intervals:readonly EngineeringInterval[]):EarthworkSection[] {
  const sections:EarthworkSection[]=[];
  for(const interval of intervals) {
    if(interval.kind!=='ground')continue;
    const length=interval.endM-interval.startM,steps=Math.max(1,Math.ceil(length/4));
    let runStart=interval.startM,runKind:EarthworkKind|null=null,runMax=0,runArea=0,runVolume=0;
    for(let index=0;index<steps;index++) {
      const start=interval.startM+length*index/steps,end=interval.startM+length*(index+1)/steps,mid=(start+end)/2,point=sampleDistance(geometry,mid),ground=terrain.sample(point.x,point.z).elevationM,depth=point.y-RAIL_TO_FORMATION_M-ground,nextKind=kindFor(depth),area=FORMATION_WIDTH_M*Math.abs(depth)+Math.abs(depth)*Math.abs(depth)*1.5,volume=area*(end-start);
      if(runKind!==null&&nextKind!==runKind){sections.push({startM:runStart,endM:start,kind:runKind,maxDepthM:runMax,crossSectionAreaM2:runArea,volumeM3:runVolume});runStart=start;runMax=0;runArea=0;runVolume=0;}
      runKind=nextKind;runMax=Math.max(runMax,Math.abs(depth));runArea=Math.max(runArea,area);runVolume+=volume;
    }
    if(runKind!==null)sections.push({startM:runStart,endM:interval.endM,kind:runKind,maxDepthM:runMax,crossSectionAreaM2:runArea,volumeM3:runVolume});
  }
  return sections.filter(section=>section.endM-section.startM>1e-6);
}

export function alignmentTerrainOperation(sourceId:string,curve:CubicCurve,terrain:Terrain,intervals:readonly EngineeringInterval[],sequence:number):TerrainOperation {
  const geometry=compileCurve(curve),sections=deriveEarthworkSections(geometry,terrain,intervals),margin=FORMATION_WIDTH_M/2+EARTHWORK_SHOULDER_M+Math.max(0,...sections.map(section=>section.maxDepthM*1.5));
  return {id:`terrain:${sequence}:${sourceId}`,kind:'alignment',version:1,sequence,sourceId,curve:structuredClone(curve),formationWidthM:FORMATION_WIDTH_M,shoulderWidthM:EARTHWORK_SHOULDER_M,sections,bounds:boundsForCurve(curve,margin)};
}

export function stationPadTerrainOperation(stationId:`station:${number}`,center:{x:number;y:number;z:number},orientationRad:number,lengthM:number,widthM:number,sequence:number):TerrainOperation {
  const margin=STATION_PAD_LEVEL_MARGIN_M+STATION_PAD_BLEND_M,half=Math.hypot(lengthM/2,widthM/2)+margin;
  return {id:`terrain:${sequence}:${stationId}`,kind:'station-pad',version:1,sequence,stationId,center:structuredClone(center),orientationRad,lengthM,widthM,targetElevationM:center.y-RAIL_TO_FORMATION_M,bounds:{minX:center.x-half,minZ:center.z-half,maxX:center.x+half,maxZ:center.z+half}};
}
