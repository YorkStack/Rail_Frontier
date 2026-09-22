import type {Station} from '../domain/model.js';
import {stationDefinition} from '../content/stations.js';

/** Shared preview/command eligibility; catalogue capacity cannot resize a built pad. */
export function stationUpgradeReason(station:Station,classId:string):string|null {
 const current=stationDefinition(station.classId),next=stationDefinition(classId);
 if(!current)return `Unknown current station class: ${station.classId}`;
 if(!next)return `Unknown station class: ${classId}`;
 if(next.id===current.id)return 'Station already has this class';
 if(next.purchaseCost<=current.purchaseCost||next.coverageRadiusM<current.coverageRadiusM||next.storageCapacity<current.storageCapacity||next.platformLengthM<current.platformLengthM)return 'Station upgrades cannot reduce capability';
 if(station.layout.kind==='single-platform'&&Math.abs(next.platformLengthM-station.layout.pad.lengthM)>.001)return 'A longer platform requires rebuilding the station. Expansion is not available yet; build a larger station at another site.';
 return null;
}
