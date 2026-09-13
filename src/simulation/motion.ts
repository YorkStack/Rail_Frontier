import type { Id, MotionState, Vec3 } from '../domain/model.js';
import { sampleDistance, type TrackGeometry } from '../rail/geometry.js';
/** Distance-based proof only. Traction, braking, dwell and occupancy are later systems. */
export function advanceMotion(motion: MotionState, distanceM: number, geometry: ReadonlyMap<Id<'edge'>,TrackGeometry>): void {
  if(!Number.isFinite(distanceM)||distanceM<0) throw new Error('Invalid motion distance');
  if(motion.arrived) return;
  while(motion.leg<motion.path.length) {
    const traversal=motion.path[motion.leg]!,edge=geometry.get(traversal.edgeId);
    if(!edge) throw new Error('Missing motion edge');
    const remaining=edge.lengthM-motion.distanceM;
    if(distanceM<remaining) {motion.distanceM+=distanceM;return;}
    distanceM-=remaining;
    if(motion.leg===motion.path.length-1) {motion.distanceM=edge.lengthM;motion.arrived=true;return;}
    motion.leg++;motion.distanceM=0;
  }
  motion.arrived=true;
}
export function motionPosition(motion: MotionState, geometry: ReadonlyMap<Id<'edge'>,TrackGeometry>): Vec3 {
  const traversal=motion.path[motion.leg];
  if(!traversal) throw new Error('Motion has no current leg');
  const edge=geometry.get(traversal.edgeId);
  if(!edge) throw new Error('Missing motion geometry');
  return sampleDistance(edge,traversal.reverse?edge.lengthM-motion.distanceM:motion.distanceM);
}
