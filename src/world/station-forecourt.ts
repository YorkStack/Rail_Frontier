import type {Terrain} from './terrain.js';
import type {Vec3} from '../domain/model.js';
import {localToWorld,pathValidator,type PathObstacle,type PathPoint} from './settlement-paths.js';

export interface StationForecourt {stationId:string;rows:[Vec3,Vec3][];entrance:Vec3;exit:Vec3;valid:boolean;reason:'terrain'|'obstacle'|null}
/** A supported entrance landing and short sloping apron; no invisible terrain edits. */
export function surveyStationForecourt(terrain:Terrain,stationId:string,center:Vec3,yaw:number,obstacles:readonly PathObstacle[]=[],rails:readonly PathPoint[][]=[]):StationForecourt {
 const rows:[Vec3,Vec3][]=[],start=14.7,end=20,width=3.4,top=center.y+.08,at=(x:number,z:number)=>localToWorld(center,yaw,x,z),door=at(start,-1.5),exit=at(end,-1.5);
 const within=(p:PathPoint)=>p.x>=0&&p.z>=0&&p.x<=terrain.widthM&&p.z<=terrain.depthM;
 let reason:StationForecourt['reason']=null;
 for(let i=0;i<=8;i++){
  const x=start+(end-start)*i/8,t=Math.max(0,(x-16.2)/(end-16.2)),row:Vec3[]=[];
  for(const side of [-1,1]){const p=at(x,-1.5+width/2*side),target=at(end,-1.5+width/2*side);if(!within(p)||!within(target)){reason='terrain';row.push({...p,y:top});continue;}const ground=terrain.sample(p.x,p.z),endY=terrain.sample(target.x,target.z).elevationM+.16,y=top+(endY-top)*t;
   if(y<ground.elevationM+.025||y-ground.elevationM>2||Math.abs(endY-top)/(end-16.2)>.32||(ground.waterLevelM!==null&&ground.elevationM<=ground.waterLevelM+.25))reason='terrain';row.push({...p,y});}
  rows.push(row as [Vec3,Vec3]);
 }
 if(!reason&&!pathValidator(terrain,obstacles,rails)(door,exit,width,stationId))reason='obstacle';
 // Reject buried centre points too, not just a perimeter with apparently clear edges.
 for(const row of rows){const p={x:(row[0].x+row[1].x)/2,z:(row[0].z+row[1].z)/2,y:(row[0].y+row[1].y)/2};if(!within(p)||terrain.sample(p.x,p.z).elevationM+.025>p.y)reason='terrain';}
 return {stationId,rows,entrance:{...door,y:top},exit:{...exit,y:(rows.at(-1)![0].y+rows.at(-1)![1].y)/2},valid:reason===null,reason};
}
