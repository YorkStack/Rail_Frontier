import type { CommandHandler,CommandHandlers } from './commands.js';
import type { GameCommand } from './ports.js';
import { postExpense } from '../simulation/finance.js';
import { quoteRouteElectrification } from '../simulation/electrification.js';
export { ELECTRIFICATION_COST_PER_M,ELECTRIFICATION_MAINTENANCE_RATE,pathIsElectrified,quoteRouteElectrification,routeIsElectrified,routeTraversals } from '../simulation/electrification.js';

type ElectrifyRoute=Extract<GameCommand,{type:'electrifyRoute'}>;
export const electrifyRouteHandler:CommandHandler<ElectrifyRoute>=(state,command)=>{
  const quote=quoteRouteElectrification(state,command.routeId);
  if(quote.segments.length===0)throw new Error('Route is already fully electrified');
  if(state.company.cash<quote.cost)throw new Error('Insufficient funds');
  for(const segment of quote.segments) {
    const infrastructure=state.operations.infrastructure[segment.edgeId]!;
    infrastructure.electrified=true;infrastructure.electrificationCost=segment.cost;infrastructure.electrificationMaintenancePerDay=segment.maintenancePerDay;
  }
  postExpense(state,'construction',quote.cost,command.routeId,'Route electrification');
  return {createdIds:[]};
};

export const electrificationCommandHandlers:CommandHandlers={electrifyRoute:electrifyRouteHandler};
