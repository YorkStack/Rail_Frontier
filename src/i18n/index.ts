import en from './locales/en.json' with {type:'json'};
import de from './locales/de.json' with {type:'json'};

export interface LanguagePack {code:string;name:string;locale:string;direction:'ltr'|'rtl';messages:Record<string,string>}
export const languages={en,de} satisfies Record<string,Omit<LanguagePack,'direction'> & {direction:string}>;
export type Language=keyof typeof languages;
export const availableLanguages=Object.values(languages);
let active:Language='en';
export function resolveLanguage(value:unknown):Language {
  if(typeof value!=='string')return 'en';const normalized=value.toLowerCase().replace('_','-');
  return (Object.keys(languages).find(key=>key===normalized)||Object.keys(languages).find(key=>key===normalized.split('-')[0])||'en') as Language;
}
export const language=()=>active;
export const locale=()=>languages[active].locale;
export function setLanguage(value:unknown):Language {active=resolveLanguage(value);return active;}
export function translate(key:string,parameters:Record<string,string|number>={},target:Language=active):string {
  const pack:LanguagePack=languages[target] as LanguagePack,count=parameters.count,plural=typeof count==='number'?new Intl.PluralRules(pack.locale).select(count):null;
  const pick=(messages:Record<string,string>)=>plural?(messages[`${key}.${plural}`]??messages[`${key}.other`]??messages[key]):messages[key];
  const template=pick(pack.messages)??pick(languages.en.messages)??key;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g,(whole,name:string)=>parameters[name]===undefined?whole:typeof parameters[name]==='number'?new Intl.NumberFormat(pack.locale).format(parameters[name] as number):String(parameters[name]));
}
export const number=(value:number,options:Intl.NumberFormatOptions={})=>new Intl.NumberFormat(languages[active].locale,options).format(value);
let moneyUnit='NOK';
export const setMoneyRegion=(campaignId:string,year:number)=>{moneyUnit=campaignId==='middle-rhine'?(year<1948?'Mark':year<2002?'DEM':'EUR'):campaignId==='tyne-wear-coast'?'GBP':'NOK';};
export const currency=(minor:number)=>moneyUnit==='Mark'?number(minor/100,{maximumFractionDigits:0})+' Mark':number(minor/100,{style:'currency',currency:moneyUnit,maximumFractionDigits:0});
export const date=(value:Date|number,options:Intl.DateTimeFormatOptions={dateStyle:'medium',timeStyle:'short'})=>new Intl.DateTimeFormat(languages[active].locale,options).format(value);

// Source-message adapter for the existing vanilla DOM shell. New messages can use
// stable semantic keys and translate(key, params). No game/save identifiers change.
const patterns=Object.entries(languages.en.messages).filter(([,text])=>/\{\w+\}/.test(text)&&text.replace(/\{\w+\}/g,'').trim().length>=4).map(([key,source])=>{
  const names:string[]=[];let expression='^',cursor=0;
  for(const match of source.matchAll(/\{(\w+)\}/g)){expression+=escapeRegex(source.slice(cursor,match.index))+'(.+?)';names.push(match[1]!);cursor=match.index!+match[0].length;}
  expression+=escapeRegex(source.slice(cursor))+'$';return {key,names,expression:new RegExp(expression,'s'),weight:source.replace(/\{\w+\}/g,'').length};
}).sort((a,b)=>b.weight-a.weight);
function escapeRegex(text:string){return text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
const sourceKeys=new Map(Object.entries(languages.en.messages).map(([key,value])=>[value,key]));
const cache=new Map<string,string>();
export function translateSource(source:string):string {
  const cacheKey=active+'|'+source,cached=cache.get(cacheKey);if(cached!==undefined)return cached;
  const trimmed=source.trim();if(!trimmed)return source;
  const key=sourceKeys.get(trimmed)??(Object.hasOwn(languages.en.messages,trimmed)?trimmed:undefined);
  let result=key?translate(key):trimmed;
  if(!key)for(const pattern of patterns){const match=pattern.expression.exec(trimmed);if(match){result=translate(pattern.key,Object.fromEntries(pattern.names.map((name,i)=>[name,match[i+1]!])));break;}}
  if(result===trimmed&&trimmed.includes(' · '))result=trimmed.split(' · ').map(part=>translateSource(part)).join(' · ');
  const rendered=source.slice(0,source.indexOf(trimmed))+result+source.slice(source.indexOf(trimmed)+trimmed.length);if(cache.size>2048)cache.clear();cache.set(cacheKey,rendered);return rendered;
}
