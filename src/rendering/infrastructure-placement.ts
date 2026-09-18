import type {Id,Vec3} from '../domain/model.js';
import type {OperationsState,TerrainEngineeringState} from '../domain/operations.js';
import {compileCurve,sampleDistance,type TrackGeometry} from '../rail/geometry.js';

export const BRIDGE_MODULE_LENGTH_M=24;
export const RETAINING_WALL_MODULE_LENGTH_M=12;
export const RETAINING_WALL_MIN_DEPTH_M=1.5;

export interface OrientedPlacement {
  position:Vec3;
  rotationY:number;
}

export interface BridgeModulePlacement extends OrientedPlacement {
  kind:'bridge-module';
  edgeId:Id<'edge'>;
  lengthM:number;
}

export interface TransitionPlacement extends OrientedPlacement {
  kind:'bridge-abutment'|'tunnel-portal';
  edgeId:Id<'edge'>;
  boundary:'start'|'end';
}

export interface RetainingWallPlacement extends OrientedPlacement {
  kind:'retaining-wall';
  sourceId:string;
  earthwork:'cut'|'fill';
  side:-1|1;
  lengthM:number;
  heightM:number;
}

export interface InfrastructurePlacementSet {
  bridgeModules:BridgeModulePlacement[];
  transitions:TransitionPlacement[];
  retainingWalls:RetainingWallPlacement[];
}

const orientedAt=(geometry:TrackGeometry,distanceM:number):OrientedPlacement=>{
  const half=.5,start=sampleDistance(geometry,Math.max(0,distanceM-half)),end=sampleDistance(geometry,Math.min(geometry.lengthM,distanceM+half));
  return {position:sampleDistance(geometry,distanceM),rotationY:Math.atan2(-(end.x-start.x),-(end.z-start.z))};
};

/** Derive every visible structure from persisted construction results; terrain clearance is deliberately not consulted. */
export function deriveInfrastructurePlacements(
  geometry:ReadonlyMap<Id<'edge'>,TrackGeometry>,
  infrastructure:OperationsState['infrastructure'],
  terrain:TerrainEngineeringState
):InfrastructurePlacementSet {
  const bridgeModules:BridgeModulePlacement[]=[],transitionCandidates:TransitionPlacement[]=[],retainingWalls:RetainingWallPlacement[]=[];
  for(const edgeId of [...geometry.keys()].sort()) {
    const track=geometry.get(edgeId)!,record=infrastructure[edgeId];
    if(!record)continue;
    for(const span of record.spans) {
      const startM=Math.max(0,Math.min(track.lengthM,span.startM)),endM=Math.max(startM,Math.min(track.lengthM,span.endM));
      if(endM-startM<=1e-6)continue;
      if(span.kind==='bridge') {
        for(let moduleStart=startM;moduleStart<endM-1e-6;moduleStart+=BRIDGE_MODULE_LENGTH_M) {
          const moduleEnd=Math.min(endM,moduleStart+BRIDGE_MODULE_LENGTH_M),lengthM=moduleEnd-moduleStart,distanceM=(moduleStart+moduleEnd)/2;
          bridgeModules.push({kind:'bridge-module',edgeId,lengthM,...orientedAt(track,distanceM)});
        }
        transitionCandidates.push({kind:'bridge-abutment',edgeId,boundary:'start',...orientedAt(track,startM)});
        transitionCandidates.push({kind:'bridge-abutment',edgeId,boundary:'end',...orientedAt(track,endM)});
      } else if(span.kind==='tunnel') {
        const start=orientedAt(track,startM),end=orientedAt(track,endM);
        transitionCandidates.push({kind:'tunnel-portal',edgeId,boundary:'start',...start,rotationY:start.rotationY+Math.PI});
        transitionCandidates.push({kind:'tunnel-portal',edgeId,boundary:'end',...end});
      }
    }
  }
  for(const operation of [...terrain.operations].sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id))) {
    if(operation.kind!=='alignment')continue;
    const track=compileCurve(operation.curve),offsetM=operation.formationWidthM/2+.75;
    for(const section of operation.sections) {
      if(section.kind==='formation'||section.maxDepthM<RETAINING_WALL_MIN_DEPTH_M)continue;
      for(let moduleStart=section.startM;moduleStart<section.endM-1e-6;moduleStart+=RETAINING_WALL_MODULE_LENGTH_M) {
        const moduleEnd=Math.min(section.endM,moduleStart+RETAINING_WALL_MODULE_LENGTH_M),lengthM=moduleEnd-moduleStart,distanceM=(moduleStart+moduleEnd)/2,oriented=orientedAt(track,distanceM),ahead=sampleDistance(track,Math.min(track.lengthM,distanceM+.5)),behind=sampleDistance(track,Math.max(0,distanceM-.5)),dx=ahead.x-behind.x,dz=ahead.z-behind.z,magnitude=Math.hypot(dx,dz)||1,nx=-dz/magnitude,nz=dx/magnitude,heightM=Math.min(8,Math.max(RETAINING_WALL_MIN_DEPTH_M,section.maxDepthM));
        for(const side of [-1,1] as const)retainingWalls.push({kind:'retaining-wall',sourceId:operation.sourceId,earthwork:section.kind,side,lengthM,heightM,rotationY:oriented.rotationY,position:{x:oriented.position.x+nx*offsetM*side,y:oriented.position.y,z:oriented.position.z+nz*offsetM*side}});
      }
    }
  }
  const key=(item:TransitionPlacement)=>`${item.kind}:${Math.round(item.position.x*100)}:${Math.round(item.position.y*100)}:${Math.round(item.position.z*100)}`,boundaryCounts=new Map<string,number>();
  for(const item of transitionCandidates)boundaryCounts.set(key(item),(boundaryCounts.get(key(item))??0)+1);
  const transitions=transitionCandidates.filter(item=>boundaryCounts.get(key(item))===1);
  return {bridgeModules,transitions,retainingWalls};
}
