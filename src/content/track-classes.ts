import type {RailConstraints} from '../rail/constraints.js';

export type TrackClassId='local'|'regional'|'mainline';
export interface TrackClassDefinition {
  id:TrackClassId;name:string;description:string;speedLimitMps:number;costMultiplier:number;constraints:RailConstraints;
}

export const trackClasses:Readonly<Record<TrackClassId,TrackClassDefinition>>=Object.freeze({
  local:Object.freeze({id:'local',name:'Local railway',description:'Flexible alignment for the first rural line',speedLimitMps:22.22,costMultiplier:1,constraints:{maxGrade:.04,minRadiusM:100,minVerticalRadiusM:500,minHorizontalDerivative:.01}}),
  regional:Object.freeze({id:'regional',name:'Regional railway',description:'Smoother formation for faster mixed traffic',speedLimitMps:30.56,costMultiplier:1.2,constraints:{maxGrade:.03,minRadiusM:180,minVerticalRadiusM:900,minHorizontalDerivative:.01}}),
  mainline:Object.freeze({id:'mainline',name:'Main line',description:'Wide curves and gentle grades for express traffic',speedLimitMps:38.89,costMultiplier:1.45,constraints:{maxGrade:.0225,minRadiusM:320,minVerticalRadiusM:1600,minHorizontalDerivative:.01}})
});

export const trackClass=(id:string|undefined):TrackClassDefinition=>{
  const definition=trackClasses[(id??'local') as TrackClassId];
  if(!definition)throw new Error(`Unknown track class: ${id}`);
  return definition;
};
