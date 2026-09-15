import type {CubicCurve} from '../domain/model.js';
import type {RailConstraints} from './constraints.js';
import {certifyCurve,derivative,tangentCompatible} from './constraints.js';
import {compileCurve,distance} from './geometry.js';

export interface VerticalProfileOptions {startGrade?:number;endGrade?:number}
export interface VerticalProfileCertificate {valid:boolean;reasons:string[];maxGrade:number}

const horizontalLength=(curve:CubicCurve)=>compileCurve({
  p0:{...curve.p0,y:0},p1:{...curve.p1,y:0},p2:{...curve.p2,y:0},p3:{...curve.p3,y:0}
}).lengthM;

const horizontalControlLength=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(b.x-a.x,b.z-a.z);

/** Fits a shape-preserving C1 vertical profile over an existing horizontal cubic chain. */
export function solveVerticalProfile(horizontal:readonly CubicCurve[],elevations:readonly number[],limits:RailConstraints,options:VerticalProfileOptions={}):CubicCurve[] {
  if(horizontal.length===0||elevations.length!==horizontal.length+1)throw new Error('Vertical profile points do not match the alignment');
  if(elevations.some(value=>!Number.isFinite(value)))throw new Error('Vertical profile elevations must be finite');
  for(let index=0;index<horizontal.length-1;index++)if(distance(horizontal[index]!.p3,horizontal[index+1]!.p0)>.001)throw new Error('Vertical profile sections must be contiguous');
  const lengths=horizontal.map(horizontalLength),secants=lengths.map((length,index)=>(elevations[index+1]!-elevations[index]!)/length);
  if(secants.some(grade=>Math.abs(grade)>limits.maxGrade+1e-12))throw new Error(`Required average grade exceeds ${(limits.maxGrade*100).toFixed(2)}%`);
  const grades=new Array<number>(elevations.length);grades[0]=options.startGrade??secants[0]!;grades[grades.length-1]=options.endGrade??secants.at(-1)!;
  for(let index=1;index<grades.length-1;index++) {
    const before=secants[index-1]!,after=secants[index]!;
    if(before===0||after===0||Math.sign(before)!==Math.sign(after))grades[index]=0;
    else {const a=lengths[index-1]!,b=lengths[index]!,w1=2*b+a,w2=b+2*a;grades[index]=(w1+w2)/(w1/before+w2/after);}
  }
  for(let index=0;index<secants.length;index++) {
    const delta=secants[index]!;
    if(delta===0){grades[index]=0;grades[index+1]=0;continue;}
    const a=grades[index]!/delta,b=grades[index+1]!/delta;
    if(a<0||b<0)throw new Error('Requested endpoint grade would reverse the vertical profile');
    const magnitude=Math.hypot(a,b);if(magnitude>3){const scale=3/magnitude;grades[index]=scale*a*delta;grades[index+1]=scale*b*delta;}
  }
  const result=horizontal.map((curve,index)=>{
    const startY=elevations[index]!,endY=elevations[index+1]!,startHandle=horizontalControlLength(curve.p0,curve.p1),endHandle=horizontalControlLength(curve.p2,curve.p3);
    return {p0:{...curve.p0,y:startY},p1:{...curve.p1,y:startY+grades[index]!*startHandle},p2:{...curve.p2,y:endY-grades[index+1]!*endHandle},p3:{...curve.p3,y:endY}};
  });
  const certificate=certifyVerticalProfile(result,limits);if(!certificate.valid)throw new Error(certificate.reasons.join(' · '));return result;
}

export function certifyVerticalProfile(curves:readonly CubicCurve[],limits:RailConstraints):VerticalProfileCertificate {
  const reasons=new Set<string>(),grades:number[]=[];
  curves.forEach((curve,index)=>{
    const certificate=certifyCurve(curve,limits);for(const reason of certificate.reasons)reasons.add(reason);
    for(const t of [0,.25,.5,.75,1]){const value=derivative(curve,t),horizontal=Math.hypot(value.x,value.z);if(horizontal>1e-9)grades.push(Math.abs(value.y)/horizontal);}
    if(index>0){const previous=curves[index-1]!;if(distance(previous.p3,curve.p0)>.001)reasons.add('Vertical profile sections are not contiguous');else if(!tangentCompatible(previous,curve))reasons.add('Vertical profile grade is not continuous');}
  });
  return {valid:reasons.size===0,reasons:[...reasons],maxGrade:grades.length?Math.max(...grades):0};
}
