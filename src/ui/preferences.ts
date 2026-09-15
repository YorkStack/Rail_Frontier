export const uiScales=[1,1.25,1.5] as const;
export type UiScale=typeof uiScales[number];
export type UiLanguage='de'|'en';
export interface PresentationPreferences {uiScale:UiScale;language:UiLanguage}
export interface PreferenceStorage {getItem(key:string):string|null;setItem(key:string,value:string):void}

const key='rail-frontier:presentation:v1';
const languageFrom=(value:string):UiLanguage=>value.toLowerCase().startsWith('de')?'de':'en';
const scaleFrom=(value:unknown):UiScale=>uiScales.includes(value as UiScale)?value as UiScale:1;

export function readPresentationPreferences(storage:PreferenceStorage|null,browserLanguage:string):PresentationPreferences {
  const defaults:PresentationPreferences={uiScale:1,language:languageFrom(browserLanguage)};
  if(!storage)return defaults;
  try {
    const raw=storage.getItem(key);if(!raw)return defaults;const parsed=JSON.parse(raw) as {uiScale?:unknown;language?:unknown};
    return {uiScale:scaleFrom(parsed.uiScale),language:parsed.language==='de'||parsed.language==='en'?parsed.language:defaults.language};
  } catch{return defaults;}
}

export function writePresentationPreferences(storage:PreferenceStorage|null,preferences:PresentationPreferences):boolean {
  if(!storage)return false;try{storage.setItem(key,JSON.stringify(preferences));return true;}catch{return false;}
}

export function applyPresentationPreferences(root:HTMLElement,preferences:PresentationPreferences):void {
  root.style.setProperty('--ui-scale',String(preferences.uiScale));root.lang=preferences.language;root.dataset.uiScale=String(preferences.uiScale);
}
