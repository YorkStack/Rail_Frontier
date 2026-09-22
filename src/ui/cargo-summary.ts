import type {CargoKind, CargoLot} from '../domain/model.js';
import {translate, translateSource} from '../i18n/index.js';

// Lots remain separate in the simulation for destinations and fares. Players
// need one total per cargo kind when inspecting a train.
export function cargoSummary(lots: readonly Pick<CargoLot, 'kind' | 'quantity'>[]): string {
  const totals = new Map<CargoKind, number>();
  for (const lot of lots) totals.set(lot.kind, (totals.get(lot.kind) ?? 0) + lot.quantity);
  return [...totals].filter(([,count]) => count > 0)
    .map(([kind,count]) => translate(`cargo.${kind}`, {count})).join(' · ') || translateSource('empty');
}
