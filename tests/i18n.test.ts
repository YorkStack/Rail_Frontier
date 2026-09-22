import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languages,resolveLanguage,setLanguage,translate,translateSource,currency,number,date} from '../src/i18n/index.js';

test('every language pack has complete keys and matching interpolation parameters',()=>{
 const parameters=(s:string)=>[...new Set(s.match(/\{\w+\}/g)??[])].sort();
 for(const pack of Object.values(languages)){
  assert.deepEqual(Object.keys(pack.messages).sort(),Object.keys(languages.en.messages).sort());
  for(const [key,value] of Object.entries(pack.messages))assert.deepEqual(parameters(value),parameters(languages.en.messages[key as keyof typeof languages.en.messages]),`${pack.code}: ${key}`);
 }
});
test('locale resolution, interpolation, source messages and formatting support live switching',()=>{
 assert.equal(resolveLanguage('de_CH'),'de');assert.equal(resolveLanguage('en-US'),'en');assert.equal(resolveLanguage('nb-NO'),'en');
 setLanguage('de');assert.equal(translate('Last saved: {time}',{time:'14:30'}),'Zuletzt gespeichert: 14:30');
 assert.equal(translateSource('  Day 12 · 1900  '),'  Tag 12 · 1900  ');assert.equal(translateSource('Build station'),'Bahnhof bauen');
 assert.equal(translate('common.stops',{count:1}),'1 Halt');assert.equal(translate('common.stops',{count:1200}),'1.200 Halte');assert.equal(number(1234.5),'1.234,5');assert.match(currency(123450000),/1\.234\.500/);assert.match(date(new Date('2026-09-21T10:00:00Z')),/21\.09\.2026/);
 assert.equal(translate('Unknown future message'),'Unknown future message');assert.equal(translateSource('Sundvik'),'Sundvik');
 assert.equal(translateSource('44 m platform · Serves Sundvik').split(' · ').at(-1),'Bedient Sundvik');
 assert.equal(translate('To: {station}',{station:'Granli'}),'Nach: Granli');
 assert.equal(translateSource('2 · Terrain variant · Over land').split(' · ')[1],'Geländevariante');
 setLanguage('en');assert.equal(translateSource('Build station'),'Build station');assert.equal(number(1234.5),'1,234.5');
});
