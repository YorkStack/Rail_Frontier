import type {Vec3} from '../domain/model.js';
import {horizontalDistance} from './wish-path.js';

export interface SketchIssue {
  kind:'crossing'|'overlap'|'outside'|'tight-bend';
  position:Vec3;pointIndex:number;blocking:boolean;
}
/** Horizontal sketch facts only. A bend hint is not a railway feasibility verdict:
 * elevation, fitted curvature and terrain are decided by the certified planner. */
export function diagnoseSketch(points:readonly Vec3[],bounds:{widthM:number;depthM:number},minRadiusM:number):SketchIssue|null {
  if(points.length<2||points.length>2048||points.some(p=>!Number.isFinite(p.x+p.y+p.z)))return null;
  const editable=(i:number)=>Math.max(1,Math.min(points.length-2,i));
  for(const [i,p] of points.entries())if(p.x<0||p.z<0||p.x>bounds.widthM||p.z>bounds.depthM)return {kind:'outside',position:{...p,x:Math.max(0,Math.min(bounds.widthM,p.x)),z:Math.max(0,Math.min(bounds.depthM,p.z))},pointIndex:editable(i),blocking:true};
  for(let i=0;i<points.length-1;i++)for(let j=i+1;j<points.length-1;j++){
    const a=points[i]!,b=points[i+1]!,c=points[j]!,d=points[j+1]!,rx=b.x-a.x,rz=b.z-a.z,sx=d.x-c.x,sz=d.z-c.z,qx=c.x-a.x,qz=c.z-a.z,den=rx*sz-rz*sx,r2=rx*rx+rz*rz;
    if(r2<1e-6||sx*sx+sz*sz<1e-6)continue;
    if(Math.abs(den)>1e-8){
      if(j===i+1||(horizontalDistance(b,c)<.001&&points.slice(i+1,j+1).every(p=>horizontalDistance(p,b)<.001)))continue; // Consecutive segments share a normal, editable corner.
      const t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;
      if(t>=0&&t<=1&&u>=0&&u<=1)return {kind:'crossing',position:{x:a.x+t*rx,y:a.y+t*(b.y-a.y),z:a.z+t*rz},pointIndex:editable(j),blocking:true};
    }else if(Math.abs(qx*rz-qz*rx)/Math.sqrt(r2)<.01){
      const t0=(qx*rx+qz*rz)/r2,t1=t0+(sx*rx+sz*rz)/r2,lo=Math.max(0,Math.min(t0,t1)),hi=Math.min(1,Math.max(t0,t1));
      if((hi-lo)*Math.sqrt(r2)>1){const t=(lo+hi)/2;return {kind:'overlap',position:{x:a.x+t*rx,y:a.y+t*(b.y-a.y),z:a.z+t*rz},pointIndex:editable(j),blocking:true};}
    }
  }
  let worst:SketchIssue|null=null,score=1;
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1]!,b=points[i]!,c=points[i+1]!,ab=horizontalDistance(a,b),bc=horizontalDistance(b,c);
    if(ab<3||bc<3)continue;
    const angle=Math.acos(Math.max(-1,Math.min(1,((b.x-a.x)*(c.x-b.x)+(b.z-a.z)*(c.z-b.z))/(ab*bc))));
    // The tangent length needed for a circular bend compared with the shorter
    // adjacent segment is a location hint, not the radius of the eventual cubic.
    const severity=minRadiusM*Math.tan(angle/2)/(Math.min(ab,bc)*.65);
    if(angle>Math.PI/6&&severity>score){score=severity;worst={kind:'tight-bend',position:{...b},pointIndex:i,blocking:false};}
  }
  return worst;
}
