import type {SketchIssue} from '../rail/sketch-diagnostics.js';
export const sketchHelp:Record<SketchIssue['kind'],{title:string;help:string;marker:string}>={
  crossing:{title:'Your sketch crosses itself',help:'Move or remove a point so the two sections no longer cross. A crossing in the sketch does not create a junction.',marker:'Crossing · edit sketch'},
  overlap:{title:'Your sketch doubles back',help:'Move or remove a point so the route does not run back over itself. Use a wider loop to change direction.',marker:'Overlap · edit sketch'},
  outside:{title:'Part of your sketch is outside the map',help:'Move the marked point back onto the landscape. No track has been built or charged.',marker:'Map edge · edit sketch'},
  'tight-bend':{title:'This bend may need more room',help:'No buildable route was found. Try widening the marked bend: drag its point outward, use the arrow keys, or press Delete to remove it.',marker:'Tight bend · edit sketch'}
};
