import type { CubicCurve, Vec3 } from '../domain/model.js';
export const distance = (a: Vec3, b: Vec3) => Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
export function pointAt(c: CubicCurve, t: number): Vec3 {
  if (!Number.isFinite(t) || t < 0 || t > 1) throw new Error('Curve parameter outside [0,1]');
  const u = 1 - t;
  const component = (key: keyof Vec3) => u*u*u*c.p0[key] + 3*u*u*t*c.p1[key] + 3*u*t*t*c.p2[key] + t*t*t*c.p3[key];
  return { x: component('x'), y: component('y'), z: component('z') };
}
export interface ArcSample { t: number; distanceM: number; position: Vec3 }
export interface TrackGeometry { lengthM: number; samples: ArcSample[]; curve: CubicCurve }
/** Subdivide by control-polygon flatness AND maximum span; deterministic left-first traversal. */
export function compileCurve(curve: CubicCurve, maxSpanM = 5, toleranceM = 0.005): TrackGeometry {
  if (![curve.p0,curve.p1,curve.p2,curve.p3].every(p => Object.values(p).every(Number.isFinite)) || maxSpanM <= 0 || !Number.isFinite(maxSpanM) || toleranceM <= 0 || !Number.isFinite(toleranceM)) throw new Error('Invalid curve');
  const samples: ArcSample[] = [{ t: 0, distanceM: 0, position: curve.p0 }];
  const mid = (a: Vec3,b: Vec3): Vec3 => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2});
  function split(c: CubicCurve, lo: number, hi: number, depth: number): void {
    const polygon = distance(c.p0,c.p1)+distance(c.p1,c.p2)+distance(c.p2,c.p3);
    if (polygon <= maxSpanM && polygon-distance(c.p0,c.p3) <= toleranceM) {
      const previous = samples[samples.length-1]!;
      samples.push({t:hi,position:c.p3,distanceM:previous.distanceM+distance(previous.position,c.p3)});
      return;
    }
    if (depth >= 24 || samples.length > 250_000) throw new Error('Curve exceeds compilation budget');
    const a=mid(c.p0,c.p1),b=mid(c.p1,c.p2),d=mid(c.p2,c.p3),e=mid(a,b),f=mid(b,d),g=mid(e,f), t=(lo+hi)/2;
    split({p0:c.p0,p1:a,p2:e,p3:g},lo,t,depth+1);
    split({p0:g,p1:f,p2:d,p3:c.p3},t,hi,depth+1);
  }
  split(curve,0,1,0);
  const lengthM=samples[samples.length-1]!.distanceM;
  if (lengthM < 0.001) throw new Error('Degenerate track');
  return {curve, lengthM,samples};
}
export function sampleDistance(geometry: TrackGeometry, distanceM: number): Vec3 {
  if (!Number.isFinite(distanceM)) throw new Error('Invalid distance');
  const s=Math.max(0,Math.min(geometry.lengthM,distanceM));
  let lo=0,hi=geometry.samples.length-1;
  while(hi-lo>1) { const m=(lo+hi)>>1; if(geometry.samples[m]!.distanceM<s) lo=m; else hi=m; }
  const a=geometry.samples[lo]!,b=geometry.samples[hi]!;
  const fraction=b.distanceM===a.distanceM?0:(s-a.distanceM)/(b.distanceM-a.distanceM);
  return pointAt(geometry.curve,a.t+(b.t-a.t)*fraction);
}
