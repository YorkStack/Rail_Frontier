import type {CargoKind,Industry} from '../domain/model.js';
import {industryDefinition} from '../content/industries.js';
import {industryBlocker} from '../simulation/industry.js';
import {translate,translateSource} from '../i18n/index.js';
import {cargoSummary} from './cargo-summary.js';

export function industryStatus(industry:Industry,ticks:number):{production:string;recipe:string} {
 const recipe=industryDefinition(industry.definitionId);if(!recipe)return{production:translateSource('Unknown recipe'),recipe:''};
 const cargo=(values:Partial<Record<CargoKind,number>>)=>cargoSummary(Object.entries(values).map(([kind,quantity])=>({kind:kind as CargoKind,quantity:quantity??0})));
 const blocker=industryBlocker(industry,recipe),missing=Object.fromEntries(Object.entries(recipe.inputs).map(([kind,quantity])=>[kind,Math.max(0,(quantity??0)-(industry.inventory[kind as CargoKind]??0))]));
 return {
  production:blocker==='inputs'?translate('Waiting for {cargo}',{cargo:cargo(missing)}):blocker==='storage'?translateSource('Storage full · collect outgoing goods'):translate('Cycle: {progress}%',{progress:Math.min(100,Math.round(ticks/recipe.cycleTicks*100))}),
  recipe:Object.keys(recipe.inputs).length?`${cargo(recipe.inputs)} → ${cargo(recipe.outputs)}`:translate('Produces {cargo} per cycle',{cargo:cargo(recipe.outputs)})
 };
}
