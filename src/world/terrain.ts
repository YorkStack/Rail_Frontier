export interface TerrainSample { elevationM: number; waterLevelM: number | null; forest: number; rock: number; urban: number }
export interface Terrain {
  readonly widthM: number; readonly depthM: number;
  sample(x: number, z: number): TerrainSample;
}
/** The same bilinear surface is authoritative for planning and terrain mesh vertices. */
export class Heightfield implements Terrain {
  readonly widthM: number;
  readonly depthM: number;
  private readonly heights: Float64Array;
  constructor(readonly columns: number, readonly rows: number, readonly cellM: number, heights: Float64Array, readonly waterLevelM: number | null = null) {
    if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2 || !Number.isFinite(cellM) || cellM <= 0 || heights.length !== columns * rows || heights.some(v => !Number.isFinite(v)) || (waterLevelM !== null && !Number.isFinite(waterLevelM))) throw new Error('Invalid heightfield');
    this.heights = heights.slice();
    this.widthM = (columns - 1) * cellM;
    this.depthM = (rows - 1) * cellM;
  }
  sample(x: number, z: number): TerrainSample {
    if (!Number.isFinite(x) || !Number.isFinite(z) || x < 0 || z < 0 || x > this.widthM || z > this.depthM) throw new Error('Terrain query outside world');
    const gx = x / this.cellM, gz = z / this.cellM;
    const ix = Math.min(Math.floor(gx), this.columns - 2), iz = Math.min(Math.floor(gz), this.rows - 2);
    const u = gx - ix, v = gz - iz;
    const at = (dx: number, dz: number) => this.heights[(iz + dz) * this.columns + ix + dx]!;
    const elevationM = (at(0, 0) * (1 - u) + at(1, 0) * u) * (1 - v) + (at(0, 1) * (1 - u) + at(1, 1) * u) * v;
    return { elevationM, waterLevelM: this.waterLevelM, forest: 0, rock: 0, urban: 0 };
  }
}
