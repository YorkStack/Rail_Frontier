import type {GameState} from '../domain/model.js';
import type {GridTerrain} from '../world/terrain.js';
import {SeededRandom} from '../world/random.js';

export type ArizonaSettlementComposition='rail-outpost'|'commercial-grid'|'mining-town';
export interface ArizonaBuildingPlacement {id:string;assetId:string;townId:string;composition:ArizonaSettlementComposition;x:number;y:number;z:number;rotationY:number;scale:number;footprintRadiusM:number}

export const arizonaBuildingAssets=Object.freeze([
  'arizona-timber-house-gable','arizona-timber-house-hipped','arizona-adobe-house','arizona-brick-house',
  'arizona-shop-false-front','arizona-shop-awning','arizona-depot','arizona-water-tower',
  'arizona-freight-shed','arizona-mine-headframe'
] as const);

const townAssets=[
  ['arizona-depot','arizona-freight-shed','arizona-water-tower','arizona-timber-house-gable','arizona-timber-house-hipped','arizona-adobe-house'],
  ['arizona-shop-false-front','arizona-shop-awning','arizona-brick-house','arizona-adobe-house','arizona-timber-house-hipped','arizona-timber-house-gable'],
  ['arizona-mine-headframe','arizona-freight-shed','arizona-shop-false-front','arizona-timber-house-gable','arizona-adobe-house','arizona-brick-house']
] as const satisfies ReadonlyArray<ReadonlyArray<(typeof arizonaBuildingAssets)[number]>>;

/** Deterministic visual plots arranged around a main street and four cross streets. */
export function generateArizonaSettlements(terrain:GridTerrain,state:Pick<GameState,'world'|'towns'>):ReadonlyArray<ArizonaBuildingPlacement> {
  const records:ArizonaBuildingPlacement[]=[],random=new SeededRandom((state.world.seed^0xa21d1900)>>>0),compositions:ArizonaSettlementComposition[]=['rail-outpost','commercial-grid','mining-town'];
  for(let townIndex=0;townIndex<state.towns.length;townIndex++){
    const town=state.towns[townIndex]!,composition=compositions[townIndex]!,assets=townAssets[townIndex]!;
    for(let index=0;index<60;index++){
      const row=Math.floor(index/12),column=index%12,rowX=[-176,-108,-54,54,108][row]!,zOffset=(column-5.5)*47+(random.next()-.5)*7,xOffset=rowX+(random.next()-.5)*6;
      let assetId=assets[(index+row*2+townIndex)%assets.length]!;
      if(index===0)assetId=townIndex===0?'arizona-depot':townIndex===2?'arizona-mine-headframe':'arizona-shop-false-front';
      else if(index===1)assetId=townIndex===0?'arizona-water-tower':townIndex===2?'arizona-freight-shed':'arizona-shop-awning';
      const x=town.position.x+xOffset,z=town.position.z+zOffset,sample=terrain.sample(x,z),facingMain=row<3?(rowX<0?Math.PI/2:-Math.PI/2):(rowX<0?-Math.PI/2:Math.PI/2),rotationY=facingMain+(random.next()-.5)*.035,scale=.88+random.next()*.18;
      records.push({id:`building:${town.id}:${index}`,assetId,townId:town.id,composition,x,y:sample.elevationM,z,rotationY,scale,footprintRadiusM:assetId==='arizona-mine-headframe'?13:assetId==='arizona-depot'?12:8});
    }
  }
  return records;
}
