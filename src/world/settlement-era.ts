/** Presentation eras, not claims of a universal historical conversion date. */
export const settlementEra=(year:number)=>year<1920?'steam':year<1960?'transition':year<1980?'motor':'modern';
export type SurfaceKind='dirt'|'cobbles'|'asphalt'|'pavers'|'timber'|'stone'|'gravel';
export function streetSurface(year:number,southwest:boolean,farm:boolean,street:boolean):SurfaceKind {
 if(!street||farm)return 'dirt';
 return year>=1960?'asphalt':southwest?(year>=1920?'gravel':'dirt'):'cobbles';
}
export function platformSurface(year:number,southwest:boolean):SurfaceKind {
 return year<1920?(southwest?'timber':'gravel'):year<1960?'pavers':'asphalt';
}

/** The retained construction ledger pins architecture across save/load and later years.
 * Prebuilt/legacy stations without a purchase retain their campaign's starting era. */
export function stationConstructionYear(state:Pick<import('../domain/model.js').GameState,'company'|'startingYear'>,stationId:string):number {
 const purchase=state.company.ledger.find(t=>t.entityId===stationId&&t.category==='construction'&&t.amount<0&&t.description==='Station construction');
 return state.startingYear+Math.floor((purchase?.tick??0)/(360*1200));
}
export function stationAssetFor(base:string,year:number):string {return base+(year<1920?'':year<1960?'-interwar':'-modern');}
