import { Heightfield } from './terrain.js';
import { fjordProfile } from './profiles.js';
import type { BiomeDefinition } from './profiles.js';
export const shorelineX=(z:number)=>2160 + 95*Math.sin((z-750)/720);
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
/** Authored analytic terrain profile sampled into a versioned triangle heightfield. */
export function generateFjordStudy(seed=140919, profile:BiomeDefinition=fjordProfile):Heightfield {
  const {widthM,depthM,cellM,peakM,seaLevelM}=profile.terrain;
  const columns=Math.round(widthM/cellM)+1,rows=Math.round(depthM/cellM)+1;
  const values=new Float64Array(columns*rows),phase=(seed%1000)/1000;
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++) {
    const x=ix*cellM,z=iz*cellM,east=shorelineX(z),west=1270+160*Math.sin(z/830);
    const landDistance=Math.max(x-east,west-x);
    const base=landDistance<0?-60*Math.min(1,-landDistance/200):8+landDistance*.055;
    const mountain=smooth(130,950,landDistance)*peakM*(.66+.2*Math.sin(z/490+phase)+.14*Math.cos(x/360+z/620));
    const detail=(Math.sin(x/47+Math.sin(z/81))*Math.cos(z/63)*9+Math.sin(x/137+z/170)*22)*smooth(100,500,landDistance);
    let height=base+mountain+detail;
    // Inlet for a real water bridge; land spur for a real occluded tunnel.
    if(x>east-100&&x<east+230) height-=95*Math.exp(-Math.pow((z-1630)/75,2))*Math.max(0,1-(x-east)/230);
    if(x>east-40) height+=95*Math.exp(-Math.pow((z-2460)/80,2))*Math.exp(-Math.pow((x-east-80)/180,2));
    values[iz*columns+ix]=height+seaLevelM;
  }
  return new Heightfield(columns,rows,cellM,values,seaLevelM);
}
