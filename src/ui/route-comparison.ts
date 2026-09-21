import type {CubicCurve} from '../domain/model.js';
import type {CorridorAlternative} from '../rail/corridor-alternatives.js';
import type {EngineeringChallenge} from '../rail/engineering-challenges.js';

/** A comparison has a stable reference; selecting an option must not move its price baseline. */
export function comparisonBaseline(alternatives:readonly CorridorAlternative[]):CorridorAlternative|undefined {
  return alternatives.find(item=>item.id==='engineering:current')??alternatives[0];
}
export function routeDifference(candidate:Pick<CorridorAlternative,'cost'|'lengthM'>,baseline:Pick<CorridorAlternative,'cost'|'lengthM'>){
  return {cost:candidate.cost-baseline.cost,lengthM:candidate.lengthM-baseline.lengthM};
}
const sameCurve=(a:CubicCurve,b:CubicCurve)=>[a.p0,a.p1,a.p2,a.p3].every((p,i)=>{const q=[b.p0,b.p1,b.p2,b.p3][i]!;return p.x===q.x&&p.y===q.y&&p.z===q.z;});
/** Splice lengths may change. Only label outside sections as retained when their
 * actual control points match the baseline, not merely because scope says local. */
export function comparisonRange(curves:readonly CubicCurve[],baseline:readonly CubicCurve[],scope:Pick<EngineeringChallenge,'fromCurve'|'toCurve'>){
  const from=scope.fromCurve,suffix=baseline.length-scope.toCurve-1,to=curves.length-suffix;
  const verified=Number.isInteger(from)&&Number.isInteger(scope.toCurve)&&from>=0&&scope.toCurve>=from&&suffix>=0&&to>from&&curves.length>0&&
    curves.slice(0,from).every((curve,i)=>sameCurve(curve,baseline[i]!))&&curves.slice(to).every((curve,i)=>sameCurve(curve,baseline[scope.toCurve+1+i]!));
  return verified?{from,to,retainsOutside:from>0||suffix>0}:{from:0,to:curves.length,retainsOutside:false};
}
