/** Compass-like angle used by station geometry: 0 = +z, 90 = +x.
 * This is a bearing aid, not a terrain or lowest-cost route recommendation. */
export function stationBearingDegrees(from:{x:number;z:number},to:{x:number;z:number}):number|null {
  if(Math.hypot(to.x-from.x,to.z-from.z)<1)return null;
  return (Math.round(Math.atan2(to.x-from.x,to.z-from.z)*180/Math.PI/5)*5+360)%360;
}
