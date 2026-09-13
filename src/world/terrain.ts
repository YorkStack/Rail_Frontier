import type { CubicCurve } from '../domain/model.js';
import { cubicRoots } from '../domain/curve-math.js';
export interface TerrainSample { elevationM: number; waterLevelM: number | null; forest: number; rock: number; urban: number }
export interface Terrain {
  readonly widthM: number; readonly depthM: number;
  sample(x: number, z: number): TerrainSample;
}
export interface TerrainLayers {forest?:Float32Array;rock?:Float32Array;urban?:Float32Array}
/** Samples the same two triangles used by the runtime mesh (diagonal NW to SE). */
export class Heightfield implements Terrain {
  readonly widthM: number;
  readonly depthM: number;
  private readonly heights: Float64Array;
  private readonly forest:Float32Array|null;
  private readonly rock:Float32Array|null;
  private readonly urban:Float32Array|null;
  constructor(readonly columns: number, readonly rows: number, readonly cellM: number, heights: Float64Array, readonly waterLevelM: number | null = null,layers:TerrainLayers={}) {
    const size=columns*rows,validLayer=(layer:Float32Array|undefined)=>layer===undefined||(layer.length===size&&!layer.some(v=>!Number.isFinite(v)||v<0||v>1));
    if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2 || !Number.isFinite(cellM) || cellM <= 0 || heights.length !== size || heights.some(v => !Number.isFinite(v)) || (waterLevelM !== null && !Number.isFinite(waterLevelM))||!validLayer(layers.forest)||!validLayer(layers.rock)||!validLayer(layers.urban)) throw new Error('Invalid heightfield');
    this.heights = heights.slice();
    this.forest=layers.forest?.slice()??null;this.rock=layers.rock?.slice()??null;this.urban=layers.urban?.slice()??null;
    this.widthM = (columns - 1) * cellM;
    this.depthM = (rows - 1) * cellM;
  }
  sample(x: number, z: number): TerrainSample {
    if (!Number.isFinite(x) || !Number.isFinite(z) || x < 0 || z < 0 || x > this.widthM || z > this.depthM) throw new Error('Terrain query outside world');
    const gx = x / this.cellM, gz = z / this.cellM;
    const ix = Math.min(Math.floor(gx), this.columns - 2), iz = Math.min(Math.floor(gz), this.rows - 2);
    const u = gx - ix, v = gz - iz;
    const interpolate=(values:Float64Array|Float32Array|null)=>{
      if(values===null)return 0;
      const at=(dx:number,dz:number)=>values[(iz+dz)*this.columns+ix+dx]!;
      return u>=v?at(0,0)*(1-u)+at(1,0)*(u-v)+at(1,1)*v:at(0,0)*(1-v)+at(0,1)*(v-u)+at(1,1)*u;
    };
    return {elevationM:interpolate(this.heights),waterLevelM:this.waterLevelM,forest:interpolate(this.forest),rock:interpolate(this.rock),urban:interpolate(this.urban)};
  }
  planeAt(x:number,z:number):{dx:number;dz:number;constant:number} {
    this.sample(x,z);
    const ix=Math.min(Math.floor(x/this.cellM),this.columns-2),iz=Math.min(Math.floor(z/this.cellM),this.rows-2);
    const at=(a:number,b:number)=>this.heights[(iz+b)*this.columns+ix+a]!;
    const u=x/this.cellM-ix,v=z/this.cellM-iz;
    const dx=(u>=v?at(1,0)-at(0,0):at(1,1)-at(0,1))/this.cellM;
    const dz=(u>=v?at(1,1)-at(1,0):at(0,1)-at(0,0))/this.cellM;
    return {dx,dz,constant:at(0,0)-dx*ix*this.cellM-dz*iz*this.cellM};
  }
  /** Crossings with X/Z cell boundaries and the NW–SE triangle diagonals. */
  curveBreakpoints(curve:CubicCurve):number[] {
    const points=[curve.p0,curve.p1,curve.p2,curve.p3],result=[0,1];
    for(const values of [points.map(p=>p.x),points.map(p=>p.z),points.map(p=>p.x-p.z)]) {
      const min=Math.ceil(Math.min(...values)/this.cellM),max=Math.floor(Math.max(...values)/this.cellM);
      if(max-min>100000)throw new Error('Alignment exceeds terrain analysis budget');
      for(let grid=min;grid<=max;grid++)result.push(...cubicRoots(values,grid*this.cellM));
    }
    return result.sort((a,b)=>a-b).filter((t,i,all)=>i===0||t-all[i-1]!>1e-9);
  }
}
