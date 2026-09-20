import type {Vec3} from '../domain/model.js';

export const horizontalDistance=(a:Vec3,b:Vec3):number=>Math.hypot(a.x-b.x,a.z-b.z);
export function distanceToSegment(p:Vec3,a:Vec3,b:Vec3):number {
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);
}
/** Preserve horizontal intent. Y is carried for drawing only, never an intermediate rail constraint. */
export function simplifyWishPath(input:readonly Vec3[],toleranceM=8):Vec3[] {
  if(input.length>2048||input.some(p=>!Number.isFinite(p.x+p.y+p.z)))throw new Error('Invalid wish path');
  if(input.length<3)return input.map(p=>({...p}));
  const keep=new Set([0,input.length-1]),stack:[[number,number]]=[[0,input.length-1]];
  while(stack.length){const [a,b]=stack.pop()!;let far=toleranceM,index=-1;for(let i=a+1;i<b;i++){const d=distanceToSegment(input[i]!,input[a]!,input[b]!);if(d>far){far=d;index=i;}}if(index>=0){keep.add(index);stack.push([a,index],[index,b]);}}
  return [...keep].sort((a,b)=>a-b).map(i=>({...input[i]!}));
}
/** Sparse fitting points retain bends while avoiding tiny unstable cubic sections. */
export function fitWishPoints(input:readonly Vec3[],toleranceM=12):Vec3[] {
  const points=simplifyWishPath(input,toleranceM),result:Vec3[]=[];
  for(let i=0;i<points.length;i++){const point=points[i]!;if(!result.length||horizontalDistance(result.at(-1)!,point)>=35)result.push(point);else if(i===points.length-1)result[result.length-1]=point;}
  if(result.length<2||result.length>64)throw new Error('Draw a longer, simpler route');
  return result;
}
