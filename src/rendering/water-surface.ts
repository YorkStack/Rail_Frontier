import type {GridTerrain,TerrainSample} from '../world/terrain.js';

interface ShoreVertex {x:number;z:number;water:number;depth:number}

const vertex=(terrain:GridTerrain,x:number,z:number):ShoreVertex=>{
  const sample:TerrainSample=terrain.sample(x,z),water=sample.waterLevelM;
  if(water===null)throw new Error('Cannot build a water surface without a water level');
  return{x,z,water,depth:water+.25-sample.elevationM};
};

const crossing=(a:ShoreVertex,b:ShoreVertex):ShoreVertex=>{
  const t=a.depth/(a.depth-b.depth);
  return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,water:a.water+(b.water-a.water)*t,depth:0};
};

/** Clips each authoritative terrain triangle at its interpolated waterline.
 * Shared triangle edges use the same scalar crossing, producing continuous
 * river/coast silhouettes without the former whole-cell staircase.
 */
export function waterSurfacePositions(terrain:GridTerrain):Float32Array {
  if(terrain.waterLevelM===null)return new Float32Array();
  const positions:number[]=[],step=terrain.cellM;
  const append=(triangle:readonly ShoreVertex[])=>{
    const polygon:ShoreVertex[]=[];
    for(let i=0;i<triangle.length;i++){
      const a=triangle[i]!,b=triangle[(i+1)%triangle.length]!,aWet=a.depth>=0,bWet=b.depth>=0;
      if(aWet&&bWet)polygon.push(b);
      else if(aWet&&!bWet)polygon.push(crossing(a,b));
      else if(!aWet&&bWet)polygon.push(crossing(a,b),b);
    }
    for(let i=1;i+1<polygon.length;i++)for(const point of [polygon[0]!,polygon[i]!,polygon[i+1]!])positions.push(point.x,point.water+.12,point.z);
  };
  for(let z=0;z<terrain.depthM;z+=step)for(let x=0;x<terrain.widthM;x+=step){
    const nw=vertex(terrain,x,z),ne=vertex(terrain,x+step,z),se=vertex(terrain,x+step,z+step),sw=vertex(terrain,x,z+step);
    append([nw,se,ne]);append([nw,sw,se]);
  }
  return new Float32Array(positions);
}
