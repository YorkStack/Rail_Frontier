import type {TerrainEngineeringState,TerrainOperation} from '../domain/operations.js';
import {compileCurve,sampleDistance} from '../rail/geometry.js';
import type {CubicCurve} from '../domain/model.js';
import {TERRAIN_PATCH_GENERATOR_VERSION} from '../rail/earthworks.js';
import type {GridTerrain,TerrainSample} from './terrain.js';

interface AlignmentCache {operation:Extract<TerrainOperation,{kind:'alignment'}>;points:{x:number;y:number;z:number;distanceM:number;tx:number;tz:number}[]}
export const ENGINEERED_PATCH_CELL_M=6;
const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(value:number)=>{const t=clamp01(value);return t*t*(3-2*t);};

/** Deterministic semantic terrain overlay. The persisted operations are authoritative; cached samples are rebuilt on load. */
export class EngineeredTerrain implements GridTerrain {
  readonly columns:number;readonly rows:number;readonly cellM:number;readonly widthM:number;readonly depthM:number;readonly waterLevelM:number|null;
  private state:TerrainEngineeringState;
  private alignments:AlignmentCache[]=[];
  private affected=new Set<string>();
  constructor(readonly base:GridTerrain,state:TerrainEngineeringState){this.columns=base.columns;this.rows=base.rows;this.cellM=base.cellM;this.widthM=base.widthM;this.depthM=base.depthM;this.waterLevelM=base.waterLevelM;this.state=structuredClone(state);const prepared=this.compile(state.operations);this.alignments=prepared.alignments;this.affected=prepared.affected;}
  get revision():number{return this.state.revision;}
  affectedCellKeys():ReadonlySet<string>{return this.affected;}
  publish(state:TerrainEngineeringState):void {const operations=structuredClone(state.operations),prepared=this.compile(operations);this.state=structuredClone(state);this.state.operations=operations;this.alignments=prepared.alignments;this.affected=prepared.affected;}
  sample(x:number,z:number):TerrainSample {
    const original=this.base.sample(x,z),ix=Math.min(Math.floor(x/this.cellM),this.columns-2),iz=Math.min(Math.floor(z/this.cellM),this.rows-2);
    if(!this.affected.has(`${ix}:${iz}`))return original;
    const divisions=Math.max(1,Math.ceil(this.cellM/ENGINEERED_PATCH_CELL_M)),step=this.cellM/divisions,localX=(x-ix*this.cellM)/step,localZ=(z-iz*this.cellM)/step,sx=Math.min(Math.floor(localX),divisions-1),sz=Math.min(Math.floor(localZ),divisions-1),u=localX-sx,v=localZ-sz,x0=ix*this.cellM+sx*step,z0=iz*this.cellM+sz*step;
    const a=this.rawElevation(x0,z0),b=this.rawElevation(x0+step,z0),c=this.rawElevation(x0,z0+step),d=this.rawElevation(x0+step,z0+step),elevation=u>=v?a*(1-u)+b*(u-v)+d*v:a*(1-v)+c*(v-u)+d*u;
    return {...original,elevationM:elevation};
  }
  private rawElevation(x:number,z:number):number {
    const original=this.base.sample(x,z);let elevation=original.elevationM;
    for(const operation of this.state.operations) {
      if(x<operation.bounds.minX||x>operation.bounds.maxX||z<operation.bounds.minZ||z>operation.bounds.maxZ)continue;
      if(operation.kind==='station-pad') {
        const sin=Math.sin(operation.orientationRad),cos=Math.cos(operation.orientationRad),dx=x-operation.center.x,dz=z-operation.center.z,along=dx*sin+dz*cos,side=dx*cos-dz*sin,outerAlong=operation.lengthM/2+8,outerSide=operation.widthM/2+8;
        if(Math.abs(along)>outerAlong||Math.abs(side)>outerSide)continue;
        const edge=Math.max(0,(Math.abs(along)-operation.lengthM/2)/8,(Math.abs(side)-operation.widthM/2)/8),weight=1-smooth(edge);elevation=elevation+(operation.targetElevationM-elevation)*weight;
      } else {
        const cache=this.alignments.find(item=>item.operation.id===operation.id)!;let best:{distance2:number;point:AlignmentCache['points'][number]}|null=null;
        for(const point of cache.points){const dx=x-point.x,dz=z-point.z,distance2=dx*dx+dz*dz;if(best===null||distance2<best.distance2)best={distance2,point};}
        if(!best)continue;const distance=Math.sqrt(best.distance2),section=operation.sections.find(item=>best!.point.distanceM>=item.startM-1e-6&&best!.point.distanceM<=item.endM+1e-6);if(!section)continue;
        if(original.waterLevelM!==null&&original.elevationM<original.waterLevelM)continue;
        const target=best.point.y-.55,depth=Math.abs(target-elevation),inner=operation.formationWidthM/2,outer=inner+operation.shoulderWidthM+depth*1.5;if(distance>=outer)continue;const weight=distance<=inner?1:1-smooth((distance-inner)/(outer-inner));elevation=elevation+(target-elevation)*weight;
      }
    }
    return elevation;
  }
  planeAt(x:number,z:number):{dx:number;dz:number;constant:number} {this.sample(x,z);const ix=Math.min(Math.floor(x/this.cellM),this.columns-2),iz=Math.min(Math.floor(z/this.cellM),this.rows-2);if(!this.affected.has(`${ix}:${iz}`))return this.base.planeAt(x,z);const divisions=Math.max(1,Math.ceil(this.cellM/ENGINEERED_PATCH_CELL_M)),step=this.cellM/divisions,gx=(x-ix*this.cellM)/step,gz=(z-iz*this.cellM)/step,sx=Math.min(Math.floor(gx),divisions-1),sz=Math.min(Math.floor(gz),divisions-1),x0=ix*this.cellM+sx*step,z0=iz*this.cellM+sz*step,u=gx-sx,v=gz-sz,a=this.rawElevation(x0,z0),b=this.rawElevation(x0+step,z0),c=this.rawElevation(x0,z0+step),d=this.rawElevation(x0+step,z0+step),dx=(u>=v?b-a:d-c)/step,dz=(u>=v?d-b:c-a)/step;return {dx,dz,constant:a-dx*x0-dz*z0};}
  curveBreakpoints(curve:CubicCurve):number[]{return this.base.curveBreakpoints(curve);}
  private compile(operations:readonly TerrainOperation[]):{alignments:AlignmentCache[];affected:Set<string>} {
    if(this.state.patchGeneratorVersion!==TERRAIN_PATCH_GENERATOR_VERSION)throw new Error('Unsupported terrain patch generator');
    const ids=new Set<string>();for(const operation of operations){if(ids.has(operation.id))throw new Error('Duplicate terrain operation');ids.add(operation.id);}
    const alignments=operations.flatMap(operation=>{if(operation.kind!=='alignment')return [];const geometry=compileCurve(operation.curve),count=Math.max(1,Math.ceil(geometry.lengthM/2)),points=Array.from({length:count+1},(_,index)=>{const distanceM=geometry.lengthM*index/count,p=sampleDistance(geometry,distanceM),q=sampleDistance(geometry,Math.min(geometry.lengthM,distanceM+1));return {x:p.x,y:p.y,z:p.z,distanceM,tx:q.x-p.x,tz:q.z-p.z};});return [{operation,points}];}),affected=new Set<string>(),addCell=(ix:number,iz:number)=>{if(ix>=0&&iz>=0&&ix<this.columns-1&&iz<this.rows-1)affected.add(`${ix}:${iz}`);};
    for(const operation of operations)if(operation.kind==='station-pad'){const minX=Math.max(0,Math.floor(operation.bounds.minX/this.cellM)),maxX=Math.min(this.columns-2,Math.floor(operation.bounds.maxX/this.cellM)),minZ=Math.max(0,Math.floor(operation.bounds.minZ/this.cellM)),maxZ=Math.min(this.rows-2,Math.floor(operation.bounds.maxZ/this.cellM));for(let iz=minZ;iz<=maxZ;iz++)for(let ix=minX;ix<=maxX;ix++)addCell(ix,iz);}else{const cache=alignments.find(item=>item.operation.id===operation.id)!;for(const point of cache.points){const section=operation.sections.find(item=>point.distanceM>=item.startM-1e-6&&point.distanceM<=item.endM+1e-6);if(!section)continue;const influence=operation.formationWidthM/2+operation.shoulderWidthM+section.maxDepthM*1.5,range=Math.ceil(influence/this.cellM)+1,cx=Math.floor(point.x/this.cellM),cz=Math.floor(point.z/this.cellM);for(let dz=-range;dz<=range;dz++)for(let dx=-range;dx<=range;dx++){const ix=cx+dx,iz=cz+dz,nearestX=Math.max(ix*this.cellM,Math.min(point.x,(ix+1)*this.cellM)),nearestZ=Math.max(iz*this.cellM,Math.min(point.z,(iz+1)*this.cellM));if(Math.hypot(point.x-nearestX,point.z-nearestZ)<=influence)addCell(ix,iz);}}}
    return {alignments,affected};
  }
}
