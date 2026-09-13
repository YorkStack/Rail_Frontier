import type { Terrain } from '../world/terrain.js';
import type { TrackGeometry } from './geometry.js';
export interface EngineeringInterval { startM: number; endM: number; kind: 'ground' | 'bridge' | 'tunnel'; grade: number; cost: number }
export interface EngineeringQuote { valid: boolean; reasons: string[]; cost: number; maxGrade: number; intervals: EngineeringInterval[] }
/** Prototype rates in minor currency units per metre. Alignments own elevation; never drape rail onto hills. */
export function quoteTrack(geometry: TrackGeometry, terrain: Terrain): EngineeringQuote {
  const intervals: EngineeringInterval[]=[]; const reasons = new Set<string>(); let cost=0,maxGrade=0;
  for(let i=1;i<geometry.samples.length;i++) {
    const a=geometry.samples[i-1]!,b=geometry.samples[i]!;
    const horizontal=Math.hypot(b.position.x-a.position.x,b.position.z-a.position.z);
    const grade=horizontal>0?Math.abs(b.position.y-a.position.y)/horizontal:Infinity;
    maxGrade=Math.max(maxGrade,grade);
    if(grade>0.04) reasons.add('Grade exceeds 4%');
    const x=(a.position.x+b.position.x)/2,z=(a.position.z+b.position.z)/2;
    if(x<0||z<0||x>terrain.widthM||z>terrain.depthM) {reasons.add('Alignment leaves terrain');continue;}
    const sample=terrain.sample(x,z);
    const height=(a.position.y+b.position.y)/2, clearance=height-sample.elevationM;
    const wet=sample.waterLevelM!==null && sample.elevationM<sample.waterLevelM;
    const submerged=wet && height<sample.waterLevelM!+2;
    if(submerged) reasons.add('Rail lacks 2 m water clearance');
    const kind=clearance < -4?'tunnel':(wet || clearance>6)?'bridge':'ground';
    const rate=kind==='tunnel'?180000:kind==='bridge'?120000:12000;
    const amount=Math.round((b.distanceM-a.distanceM)*(rate+Math.abs(clearance)*1500+sample.forest*4000+sample.rock*8000+sample.urban*20000));
    intervals.push({startM:a.distanceM,endM:b.distanceM,kind,grade,cost:amount}); cost+=amount;
  }
  if(!Number.isSafeInteger(cost)) reasons.add('Quote exceeds finance range');
  return {valid:reasons.size===0,reasons:[...reasons],cost,maxGrade,intervals};
}
