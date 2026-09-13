import type { CubicCurve, Vec3 } from '../domain/model.js';
export interface RailConstraints { maxGrade:number; minRadiusM:number; minHorizontalDerivative:number }
export const standardRail:RailConstraints={maxGrade:0.04,minRadiusM:100,minHorizontalDerivative:0.01};
const length=(v:Vec3)=>Math.hypot(v.x,v.y,v.z);
const subtract=(a:Vec3,b:Vec3):Vec3=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
export function derivative(c:CubicCurve,t:number):Vec3 {
  const u=1-t;
  const f=(k:keyof Vec3)=>3*u*u*(c.p1[k]-c.p0[k])+6*u*t*(c.p2[k]-c.p1[k])+3*t*t*(c.p3[k]-c.p2[k]);
  return {x:f('x'),y:f('y'),z:f('z')};
}
/** Conservative interval certificates using derivative Bézier convex hulls.
 * Subdivide uncertainty; never approve a curve by sparse point sampling alone. */
export function certifyCurve(curve:CubicCurve,limits:RailConstraints=standardRail):{valid:boolean;reasons:string[];leaves:number} {
  const reasons=new Set<string>();let leaves=0;
  const mid=(a:Vec3,b:Vec3):Vec3=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2});
  function visit(c:CubicCurve,depth:number):void {
    const d=[subtract(c.p1,c.p0),subtract(c.p2,c.p1),subtract(c.p3,c.p2)].map(p=>({x:p.x*3,y:p.y*3,z:p.z*3}));
    const q=[subtract(d[1]!,d[0]!),subtract(d[2]!,d[1]!)].map(p=>({x:p.x*2,y:p.y*2,z:p.z*2}));
    const bound=(key:keyof Vec3)=>({min:Math.min(...d.map(p=>p[key])),max:Math.max(...d.map(p=>p[key]))});
    const dx=bound('x'),dy=bound('y'),dz=bound('z');
    const near=(v:{min:number;max:number})=>v.min>0?v.min:v.max<0?-v.max:0;
    const horizontalMin=Math.hypot(near(dx),near(dz));
    const maxY=Math.max(Math.abs(dy.min),Math.abs(dy.max));
    const horizontalMax=Math.max(...d.map(p=>Math.hypot(p.x,p.z)));
    const secondMax=Math.max(...q.map(p=>Math.hypot(p.x,p.z)));
    // |cross(d,d2)| <= |d| |d2|, intentionally conservative.
    const curvatureUpper=horizontalMin>0?horizontalMax*secondMax/horizontalMin**3:Infinity;
    const scale=2**depth;
    if(horizontalMin*scale>=limits.minHorizontalDerivative && maxY<=horizontalMin*limits.maxGrade+1e-12 && curvatureUpper<=1/limits.minRadiusM) {leaves++;return;}
    const m=derivative(c,.5),h=Math.hypot(m.x,m.z);
    if(h*scale<limits.minHorizontalDerivative) {reasons.add('Alignment has a cusp or vertical tangent');return;}
    if(Math.abs(m.y)>h*limits.maxGrade+1e-10) {reasons.add('Grade exceeds 4%');return;}
    const acceleration={x:(q[0]!.x+q[1]!.x)/2,z:(q[0]!.z+q[1]!.z)/2};
    if(Math.abs(m.x*acceleration.z-m.z*acceleration.x)/h**3>1/limits.minRadiusM) {reasons.add('Curve radius below minimum');return;}
    if(depth>=16) {reasons.add('Curve cannot certify minimum radius or grade');return;}
    const a=mid(c.p0,c.p1),b=mid(c.p1,c.p2),e=mid(c.p2,c.p3),f=mid(a,b),g=mid(b,e),p=mid(f,g);
    visit({p0:c.p0,p1:a,p2:f,p3:p},depth+1);
    visit({p0:p,p1:g,p2:e,p3:c.p3},depth+1);
  }
  visit(curve,0);
  return {valid:reasons.size===0,reasons:[...reasons],leaves};
}
export function tangentCompatible(incoming:CubicCurve,outgoing:CubicCurve,toleranceRadians=.015):boolean {
  const a=derivative(incoming,1),b=derivative(outgoing,0),norm=length(a)*length(b);
  return norm>1e-10&&(a.x*b.x+a.y*b.y+a.z*b.z)/norm>=Math.cos(toleranceRadians);
}
