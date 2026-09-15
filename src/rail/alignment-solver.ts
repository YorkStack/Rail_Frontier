import type {CubicCurve,Vec3} from '../domain/model.js';

export interface AlignmentTangents {
  start?:{x:number;z:number};
  end?:{x:number;z:number};
}

const horizontalDistance=(a:Vec3,b:Vec3)=>Math.hypot(b.x-a.x,b.z-a.z);
const unit=(x:number,z:number)=>{const length=Math.hypot(x,z);if(length<1e-9)throw new Error('Alignment points must be separated');return {x:x/length,z:z/length};};

/** Builds a C1-continuous horizontal cubic chain through fixed route anchors. */
export function solveHorizontalAlignment(points:readonly Vec3[],tangents:AlignmentTangents={}):CubicCurve[] {
  if(points.length<2)throw new Error('An alignment needs a start and destination');
  if(points.length>128)throw new Error('An alignment cannot exceed 128 points');
  for(const point of points)if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(point.z))throw new Error('Alignment points must be finite');
  const directions=points.map((point,index)=>{
    if(index===0&&tangents.start)return unit(tangents.start.x,tangents.start.z);
    if(index===points.length-1&&tangents.end)return unit(tangents.end.x,tangents.end.z);
    if(index===0)return unit(points[1]!.x-point.x,points[1]!.z-point.z);
    if(index===points.length-1)return unit(point.x-points[index-1]!.x,point.z-points[index-1]!.z);
    return unit(points[index+1]!.x-points[index-1]!.x,points[index+1]!.z-points[index-1]!.z);
  });
  return points.slice(0,-1).map((start,index)=>{
    const end=points[index+1]!,length=horizontalDistance(start,end);
    if(length<10)throw new Error('Alignment points must be at least 10 m apart');
    const handle=length/3,dy=end.y-start.y,startDirection=directions[index]!,endDirection=directions[index+1]!;
    return {
      p0:{...start},
      p1:{x:start.x+startDirection.x*handle,y:start.y+dy/3,z:start.z+startDirection.z*handle},
      p2:{x:end.x-endDirection.x*handle,y:start.y+dy*2/3,z:end.z-endDirection.z*handle},
      p3:{...end}
    };
  });
}
