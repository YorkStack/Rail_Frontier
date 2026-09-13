import type { CubicCurve,Vec3 } from './model.js';
export function cubicValue(values:readonly number[],t:number):number {const u=1-t;return values[0]!*u*u*u+3*values[1]!*u*u*t+3*values[2]!*u*t*t+values[3]!*t*t*t;}
/** All cubic roots in [0,1], including tangencies, isolated on derivative-monotone intervals. */
export function cubicRoots(values:readonly number[],level:number):number[] {
  const a=-values[0]!+3*values[1]!-3*values[2]!+values[3]!,b=3*values[0]!-6*values[1]!+3*values[2]!,c=-3*values[0]!+3*values[1]!;
  const boundaries=[0,1],roots:number[]=[],epsilon=1e-9;
  if(Math.abs(a)<epsilon){if(Math.abs(b)>epsilon)boundaries.push(-c/(2*b));}
  else {const discriminant=4*b*b-12*a*c;if(discriminant>=0){boundaries.push((-2*b+Math.sqrt(discriminant))/(6*a),(-2*b-Math.sqrt(discriminant))/(6*a));}}
  const sorted=boundaries.filter(t=>t>=0&&t<=1).sort((x,y)=>x-y),value=(t:number)=>cubicValue(values,t)-level;
  for(const t of sorted)if(Math.abs(value(t))<epsilon)roots.push(t);
  for(let i=1;i<sorted.length;i++){let lo=sorted[i-1]!,hi=sorted[i]!;const sign=value(lo);if(sign*value(hi)>=0)continue;for(let k=0;k<45;k++){const mid=(lo+hi)/2;if(value(mid)*sign>0)lo=mid;else hi=mid;}roots.push((lo+hi)/2);}
  return [...new Set(roots)].sort((x,y)=>x-y);
}
export function splitCurve(curve:CubicCurve,t:number):[CubicCurve,CubicCurve] {
  const mix=(a:Vec3,b:Vec3):Vec3=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  const a=mix(curve.p0,curve.p1),b=mix(curve.p1,curve.p2),c=mix(curve.p2,curve.p3),d=mix(a,b),e=mix(b,c),p=mix(d,e);
  return [{p0:curve.p0,p1:a,p2:d,p3:p},{p0:p,p1:e,p2:c,p3:curve.p3}];
}
export function curveInterval(curve:CubicCurve,start:number,end:number):CubicCurve {
  const prefix=splitCurve(curve,end)[0];return start===0?prefix:splitCurve(prefix,start/end)[1];
}
