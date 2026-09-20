import type {CubicCurve,Vec3} from '../domain/model.js';
import {straightCurve} from './norway-preview.js';

export type NorwayStudyCorridorId='bridge'|'tunnel'|'coast';

export interface NorwayStudyCorridor {
  minElevationM:number;
  maxElevationM:number;
  defaultElevationM:number;
  copy:string;
}

export const norwayStudyCorridors:Readonly<Record<NorwayStudyCorridorId,NorwayStudyCorridor>>=Object.freeze({
  bridge:Object.freeze({minElevationM:-5,maxElevationM:115,defaultElevationM:30,copy:'A direct crossing from open water into the Sundvik shore.'}),
  tunnel:Object.freeze({minElevationM:600,maxElevationM:650,defaultElevationM:620,copy:'A level bore through the Granli mountain spur, with both portals close to natural ground.'}),
  coast:Object.freeze({minElevationM:-5,maxElevationM:115,defaultElevationM:15,copy:'A long shelf following the inhabited side of the fjord.'})
});

/** Fixed comparison corridors are authored against Norway V3 and remain adjustable in elevation. */
export function norwayStudyCurve(id:NorwayStudyCorridorId,elevationM:number,eastBankX:number,towns:ReadonlyArray<{position:Vec3}>):CubicCurve {
  if(id==='bridge')return straightCurve({x:eastBankX-350,y:elevationM,z:3200},{x:eastBankX+350,y:elevationM,z:3200});
  if(id==='tunnel')return straightCurve({x:3550,y:elevationM,z:6000},{x:4425,y:elevationM,z:6000});
  const a=towns[0]!.position,b=towns[1]!.position;
  return straightCurve({x:a.x+180,y:elevationM,z:a.z+160},{x:b.x+180,y:elevationM,z:b.z-160});
}
