import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cargoSummary} from '../src/ui/cargo-summary.js';
import {setLanguage} from '../src/i18n/index.js';

test('train summary combines separate fare lots without mixing cargo kinds', () => {
  const lots = [{kind:'passengers' as const,quantity:14},{kind:'mail' as const,quantity:3},{kind:'passengers' as const,quantity:28}];
  setLanguage('en');assert.equal(cargoSummary(lots),'42 passengers · 3 mail');
  assert.equal(cargoSummary([{kind:'passengers',quantity:1}]),'1 passenger');
  setLanguage('de');assert.equal(cargoSummary(lots),'42 Fahrgäste · 3 Post');
  assert.equal(cargoSummary([]),'Leer');assert.equal(lots[0]!.quantity,14);
  setLanguage('en');
});
