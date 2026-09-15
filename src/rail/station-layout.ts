import type { CubicCurve,GameState,Id,Station,Vec3 } from '../domain/model.js';
import type { Terrain } from '../world/terrain.js';

export const STATION_PAD_WIDTH_M=18;
export const STATION_MAX_RELIEF_M=2.5;

export interface StationSite {
  center:Vec3;portA:Vec3;portB:Vec3;direction:{x:number;z:number};orientationRad:number;lengthM:number;widthM:number;maxReliefM:number;
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
  const elevations=planar.map(point=>terrain.sample(point.x,point.z).elevationM),maxReliefM=Math.max(...elevations)-Math.min(...elevations);
  if(maxReliefM>STATION_MAX_RELIEF_M)throw new Error(`Station site is too steep (${maxReliefM.toFixed(1)} m relief; maximum ${STATION_MAX_RELIEF_M.toFixed(1)} m)`);
  const y=elevations[0]!;
  return {center:{...position,y},portA:{x:planar[1]!.x,y,z:planar[1]!.z},portB:{x:planar[2]!.x,y,z:planar[2]!.z},direction,orientationRad:angle,lengthM,widthM:STATION_PAD_WIDTH_M,maxReliefM};
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
