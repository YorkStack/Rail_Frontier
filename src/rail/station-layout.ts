import type { CubicCurve,GameState,Id,Station,Vec3 } from '../domain/model.js';
import type { Terrain } from '../world/terrain.js';

export const STATION_PAD_WIDTH_M=18;
export const STATION_MAX_RELIEF_M=12;
export const STATION_CUT_COST_PER_M3=18_000;
export const STATION_FILL_COST_PER_M3=14_000;

export interface StationSite {
  center:Vec3;portA:Vec3;portB:Vec3;direction:{x:number;z:number};orientationRad:number;lengthM:number;widthM:number;maxReliefM:number;cutVolumeM3:number;fillVolumeM3:number;earthworkCost:number;
}

const normalizeAngle=(angle:number):number=>{
  const wrapped=angle%(Math.PI*2);
  return wrapped<0?wrapped+Math.PI*2:wrapped;
};

export function surveyStationSite(terrain:Terrain,position:{x:number;z:number},orientationRad:number,lengthM:number):StationSite {
  if(!Number.isFinite(position.x)||!Number.isFinite(position.z)||!Number.isFinite(orientationRad)||!Number.isFinite(lengthM)||lengthM<=0)throw new Error('Invalid station placement');
  const angle=normalizeAngle(orientationRad),direction={x:Math.sin(angle),z:Math.cos(angle)},side={x:direction.z,z:-direction.x},half=lengthM/2,halfWidth=STATION_PAD_WIDTH_M/2;
  const planar=[
    position,
    {x:position.x-direction.x*half,z:position.z-direction.z*half},
    {x:position.x+direction.x*half,z:position.z+direction.z*half},
    {x:position.x-direction.x*half+side.x*halfWidth,z:position.z-direction.z*half+side.z*halfWidth},
    {x:position.x-direction.x*half-side.x*halfWidth,z:position.z-direction.z*half-side.z*halfWidth},
    {x:position.x+direction.x*half+side.x*halfWidth,z:position.z+direction.z*half+side.z*halfWidth},
    {x:position.x+direction.x*half-side.x*halfWidth,z:position.z+direction.z*half-side.z*halfWidth}
  ];
  if(planar.some(point=>point.x<0||point.z<0||point.x>terrain.widthM||point.z>terrain.depthM))throw new Error('Station footprint lies outside the map');
  const alongSteps=Math.max(1,Math.ceil(lengthM/10)),acrossSteps=Math.max(1,Math.ceil(STATION_PAD_WIDTH_M/6)),cellArea=lengthM/alongSteps*STATION_PAD_WIDTH_M/acrossSteps,samples:number[]=[];
  for(let alongIndex=0;alongIndex<alongSteps;alongIndex++)for(let acrossIndex=0;acrossIndex<acrossSteps;acrossIndex++){const along=-half+(alongIndex+.5)*lengthM/alongSteps,across=-halfWidth+(acrossIndex+.5)*STATION_PAD_WIDTH_M/acrossSteps,x=position.x+direction.x*along+side.x*across,z=position.z+direction.z*along+side.z*across;samples.push(terrain.sample(x,z).elevationM);}
  const elevations=[...planar.map(point=>terrain.sample(point.x,point.z).elevationM),...samples],maxReliefM=Math.max(...elevations)-Math.min(...elevations);
  if(maxReliefM>STATION_MAX_RELIEF_M)throw new Error(`Station site is too steep (${maxReliefM.toFixed(1)} m relief; maximum ${STATION_MAX_RELIEF_M.toFixed(1)} m)`);
  const sorted=[...samples].sort((a,b)=>a-b),y=sorted[Math.floor(sorted.length/2)]!,cutVolumeM3=samples.reduce((sum,elevation)=>sum+Math.max(0,elevation-y)*cellArea,0),fillVolumeM3=samples.reduce((sum,elevation)=>sum+Math.max(0,y-elevation)*cellArea,0),earthworkCost=Math.ceil(cutVolumeM3*STATION_CUT_COST_PER_M3+fillVolumeM3*STATION_FILL_COST_PER_M3);
  return {center:{...position,y},portA:{x:planar[1]!.x,y,z:planar[1]!.z},portB:{x:planar[2]!.x,y,z:planar[2]!.z},direction,orientationRad:angle,lengthM,widthM:STATION_PAD_WIDTH_M,maxReliefM,cutVolumeM3,fillVolumeM3,earthworkCost};
}

export function straightCurve(from:Vec3,to:Vec3):CubicCurve {
  return {p0:from,p1:{x:(2*from.x+to.x)/3,y:(2*from.y+to.y)/3,z:(2*from.z+to.z)/3},p2:{x:(from.x+2*to.x)/3,y:(from.y+2*to.y)/3,z:(from.z+2*to.z)/3},p3:to};
}

export function stationInternalEdges(station:Station):Set<Id<'edge'>> {
  return new Set(station.layout.kind==='single-platform'?station.layout.internalEdgeIds:[]);
}

export function stationHasExternalConnection(state:Pick<GameState,'railway'>,station:Station):boolean {
  if(station.layout.kind==='legacy-node')return true;
  const internal=stationInternalEdges(station),ports=new Set(station.layout.ports.map(port=>port.nodeId));
  return state.railway.edges.some(edge=>!internal.has(edge.id)&&(ports.has(edge.from)||ports.has(edge.to)));
}
