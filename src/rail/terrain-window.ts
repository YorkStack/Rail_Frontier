import type {CubicCurve,Vec3} from '../domain/model.js';
import {Heightfield,type Terrain,type TerrainLayers,type TriangleTerrain} from '../world/terrain.js';

export interface TerrainWindowSnapshot {
  originX:number;
  originZ:number;
  columns:number;
  rows:number;
  cellM:number;
  waterLevelM:number|null;
  heights:Float64Array;
  forest:Float32Array;
  rock:Float32Array;
  urban:Float32Array;
}

export function captureTerrainWindow(terrain:Terrain,anchors:readonly Vec3[],paddingM=850,maxCells=40_000):TerrainWindowSnapshot {
  if(anchors.length<2||!Number.isFinite(paddingM)||paddingM<0||!Number.isInteger(maxCells)||maxCells<4)throw new Error('Invalid planning terrain window');
  const minX=Math.max(0,Math.min(...anchors.map(point=>point.x))-paddingM),maxX=Math.min(terrain.widthM,Math.max(...anchors.map(point=>point.x))+paddingM),minZ=Math.max(0,Math.min(...anchors.map(point=>point.z))-paddingM),maxZ=Math.min(terrain.depthM,Math.max(...anchors.map(point=>point.z))+paddingM),baseCell='cellM' in terrain&&Number.isFinite(terrain.cellM as number)?Math.max(10,terrain.cellM as number):25;
  let cellM=baseCell,columns=Math.ceil((maxX-minX)/cellM)+1,rows=Math.ceil((maxZ-minZ)/cellM)+1;
  if(columns*rows>maxCells){const scale=Math.sqrt(columns*rows/maxCells);cellM=Math.ceil(baseCell*scale/baseCell)*baseCell;columns=Math.ceil((maxX-minX)/cellM)+1;rows=Math.ceil((maxZ-minZ)/cellM)+1;}
  while(columns*rows>maxCells){cellM+=baseCell;columns=Math.ceil((maxX-minX)/cellM)+1;rows=Math.ceil((maxZ-minZ)/cellM)+1;}
  const originX=Math.max(0,Math.min(terrain.widthM-(columns-1)*cellM,Math.floor(minX/cellM)*cellM)),originZ=Math.max(0,Math.min(terrain.depthM-(rows-1)*cellM,Math.floor(minZ/cellM)*cellM)),size=columns*rows,heights=new Float64Array(size),forest=new Float32Array(size),rock=new Float32Array(size),urban=new Float32Array(size);
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){const index=row*columns+column,sample=terrain.sample(Math.min(terrain.widthM,originX+column*cellM),Math.min(terrain.depthM,originZ+row*cellM));heights[index]=sample.elevationM;forest[index]=sample.forest;rock[index]=sample.rock;urban[index]=sample.urban;}
  return {originX,originZ,columns,rows,cellM,waterLevelM:terrain.waterLevelM,heights,forest,rock,urban};
}

export function hydrateTerrainWindow(snapshot:TerrainWindowSnapshot):TriangleTerrain {
  const layers:TerrainLayers={forest:snapshot.forest,rock:snapshot.rock,urban:snapshot.urban},local=new Heightfield(snapshot.columns,snapshot.rows,snapshot.cellM,snapshot.heights,snapshot.waterLevelM,layers),translate=(curve:CubicCurve):CubicCurve=>({p0:localPoint(curve.p0),p1:localPoint(curve.p1),p2:localPoint(curve.p2),p3:localPoint(curve.p3)}),localPoint=(point:Vec3):Vec3=>({x:point.x-snapshot.originX,y:point.y,z:point.z-snapshot.originZ});
  return {
    widthM:snapshot.originX+local.widthM,depthM:snapshot.originZ+local.depthM,waterLevelM:snapshot.waterLevelM,
    sample:(x,z)=>local.sample(x-snapshot.originX,z-snapshot.originZ),
    planeAt:(x,z)=>{const plane=local.planeAt(x-snapshot.originX,z-snapshot.originZ);return {...plane,constant:plane.constant-plane.dx*snapshot.originX-plane.dz*snapshot.originZ};},
    curveBreakpoints:curve=>local.curveBreakpoints(translate(curve))
  };
}
