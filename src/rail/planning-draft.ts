import type {CubicCurve,Vec3} from '../domain/model.js';

/** Player intent only. Quotes, worker jobs and infrastructure never belong here. */
export interface RouteDraft {
  points:Vec3[];
  complete:boolean;
  trackClassId:string;
  design:CubicCurve[]|null;
}
export interface PlanningDraft {
  version:1;
  current:RouteDraft;
  past:RouteDraft[];
  future:RouteDraft[];
}
export const emptyRouteDraft=():RouteDraft=>({points:[],complete:false,trackClassId:'local',design:null});
export class RouteDraftHistory {
  current=emptyRouteDraft();
  past:RouteDraft[]=[];
  future:RouteDraft[]=[];
  record(before:RouteDraft):void {
    if(JSON.stringify(before)===JSON.stringify(this.current))return;
    this.past.push(structuredClone(before));if(this.past.length>30)this.past.shift();this.future=[];
  }
  undo():boolean {const previous=this.past.pop();if(!previous)return false;this.future.push(structuredClone(this.current));if(this.future.length>30)this.future.shift();this.current=previous;return true;}
  redo():boolean {const next=this.future.pop();if(!next)return false;this.past.push(structuredClone(this.current));if(this.past.length>30)this.past.shift();this.current=next;return true;}
  restore(saved:PlanningDraft|null):void {const value=saved?structuredClone(saved):null;this.current=value?.current??emptyRouteDraft();this.past=value?.past??[];this.future=value?.future??[];}
  snapshot():PlanningDraft|null {return this.current.points.length||this.past.length||this.future.length?structuredClone({version:1 as const,current:this.current,past:this.past,future:this.future}):null;}
}
