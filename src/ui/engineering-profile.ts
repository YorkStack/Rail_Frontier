import type {Terrain} from '../world/terrain.js';
import {engineeringSpans,type EngineeringQuote} from '../rail/planner.js';
import {sampleDistance,type TrackGeometry} from '../rail/geometry.js';

export type ProfileSpanKind='ground'|'bridge'|'tunnel';
export interface EngineeringProfilePoint {distanceM:number;railElevationM:number;terrainElevationM:number}
export interface EngineeringProfileSpan {startM:number;endM:number;kind:ProfileSpanKind;cost:number}
export interface EngineeringProfile {
  lengthM:number;
  totalCost:number;
  maxGrade:number;
  minimumRadiusM:number;
  elevationMinM:number;
  elevationMaxM:number;
  points:EngineeringProfilePoint[];
  spans:EngineeringProfileSpan[];
  lengthByKind:Record<ProfileSpanKind,number>;
  costByKind:Record<ProfileSpanKind,number>;
}

function minimumHorizontalRadius(geometries:readonly TrackGeometry[]):number {
  let minimum=Infinity;
  for(const {curve} of geometries)for(let index=0;index<=128;index++) {
    const t=index/128,u=1-t,dx=3*(u*u*(curve.p1.x-curve.p0.x)+2*u*t*(curve.p2.x-curve.p1.x)+t*t*(curve.p3.x-curve.p2.x)),dz=3*(u*u*(curve.p1.z-curve.p0.z)+2*u*t*(curve.p2.z-curve.p1.z)+t*t*(curve.p3.z-curve.p2.z)),ddx=6*(u*(curve.p2.x-2*curve.p1.x+curve.p0.x)+t*(curve.p3.x-2*curve.p2.x+curve.p1.x)),ddz=6*(u*(curve.p2.z-2*curve.p1.z+curve.p0.z)+t*(curve.p3.z-2*curve.p2.z+curve.p1.z)),speed2=dx*dx+dz*dz,cross=Math.abs(dx*ddz-dz*ddx);
    if(speed2>1e-9&&cross>1e-9)minimum=Math.min(minimum,Math.pow(speed2,1.5)/cross);
  }
  return minimum;
}

export function buildEngineeringProfile(geometries:readonly TrackGeometry[],quotes:readonly EngineeringQuote[],terrain:Terrain,sampleStepM=25):EngineeringProfile {
  if(geometries.length===0||geometries.length!==quotes.length||!Number.isFinite(sampleStepM)||sampleStepM<=0)throw new Error('Invalid engineering profile input');
  const points:EngineeringProfilePoint[]=[],rawSpans:EngineeringProfileSpan[]=[],lengthByKind={ground:0,bridge:0,tunnel:0},costByKind={ground:0,bridge:0,tunnel:0};let offset=0,totalCost=0,maxGrade=0,elevationMinM=Infinity,elevationMaxM=-Infinity;
  for(let index=0;index<geometries.length;index++) {
    const geometry=geometries[index]!,quote=quotes[index]!,steps=Math.max(1,Math.ceil(geometry.lengthM/sampleStepM));
    for(let step=0;step<=steps;step++){if(index>0&&step===0)continue;const distanceM=geometry.lengthM*step/steps,position=sampleDistance(geometry,distanceM),terrainElevationM=terrain.sample(position.x,position.z).elevationM;points.push({distanceM:offset+distanceM,railElevationM:position.y,terrainElevationM});elevationMinM=Math.min(elevationMinM,position.y,terrainElevationM);elevationMaxM=Math.max(elevationMaxM,position.y,terrainElevationM);}
    for(const span of engineeringSpans(quote)){const length=span.endM-span.startM;rawSpans.push({startM:offset+span.startM,endM:offset+span.endM,kind:span.kind,cost:span.cost});lengthByKind[span.kind]+=length;costByKind[span.kind]+=span.cost;}
    offset+=geometry.lengthM;totalCost+=quote.cost;maxGrade=Math.max(maxGrade,quote.maxGrade);
  }
  const spans:EngineeringProfileSpan[]=[];for(const span of rawSpans){const previous=spans.at(-1);if(previous&&previous.kind===span.kind&&Math.abs(previous.endM-span.startM)<.001){previous.endM=span.endM;previous.cost+=span.cost;}else spans.push({...span});}
  const padding=Math.max(2,(elevationMaxM-elevationMinM)*.08);return {lengthM:offset,totalCost,maxGrade,minimumRadiusM:minimumHorizontalRadius(geometries),elevationMinM:elevationMinM-padding,elevationMaxM:elevationMaxM+padding,points,spans,lengthByKind,costByKind};
}
