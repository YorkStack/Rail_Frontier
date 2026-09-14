import { dailyLumberDemand,dailyMailDemand } from '../domain/operations.js';
import type { GameState,Id } from '../domain/model.js';
import { townCoverage } from './coverage.js';

/** A town is connected only when its covered station appears on an operating route. */
export function connectedTowns(state:Pick<GameState,'towns'|'stations'|'railway'|'routes'|'trains'>):Set<Id<'town'>> {
  const coverage=townCoverage(state),assignedRoutes=new Set(state.trains.flatMap(train=>train.routeId===null?[]:[train.routeId])),servedStations=new Set(state.routes.filter(route=>assignedRoutes.has(route.id)).flatMap(route=>route.stops));
  return new Set([...coverage].filter(([,stationId])=>servedStations.has(stationId)).map(([townId])=>townId));
}

/** Advance local demand and growth once per economic day using integer populations and a saved fractional carry. */
export function advanceTownEconomies(state:GameState):void {
  const connected=connectedTowns(state);
  for(const town of [...state.towns].sort((a,b)=>a.id.localeCompare(b.id))) {
    const economy=state.operations.townEconomy[town.id];if(!economy)throw new Error(`Town economy is missing: ${town.id}`);
    const lumberPerDay=dailyLumberDemand(town.population),supply=Math.min(1,economy.lumberReceivedToday/lumberPerDay),hasService=connected.has(town.id);
    economy.economicActivity=Math.round(35+(hasService?25:0)+supply*30);
    economy.connectedDays=hasService?economy.connectedDays+1:0;
    const exactGrowth=town.population*Math.max(0,economy.economicActivity-45)/100_000+economy.growthRemainder,change=Math.floor(exactGrowth);
    if(!Number.isSafeInteger(town.population+change))throw new Error('Town population exceeds range');
    town.population+=change;economy.lastPopulationChange=change;economy.growthRemainder=exactGrowth-change;
    const nextLumber=dailyLumberDemand(town.population),nextMail=dailyMailDemand(town.population);
    economy.lumberDemand=Math.min(nextLumber*30,economy.lumberDemand+nextLumber);
    economy.mailWaiting=Math.min(nextMail*7,economy.mailWaiting+nextMail);
    economy.lumberReceivedToday=0;
  }
}
