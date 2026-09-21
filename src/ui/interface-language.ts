import type {UiLanguage} from './preferences.js';
import {translate,setLanguage} from '../i18n/index.js';
import {refreshLanguage} from '../i18n/dom.js';

/** Retain stable hooks used by the shell; all copy lives in language packs. */
export function applyInterfaceLanguage(root:ParentNode,language:UiLanguage):void {
  setLanguage(language);
  root.querySelectorAll<HTMLElement>('[data-ui-copy]').forEach(node=>{node.textContent=translate(`ui.${node.dataset.uiCopy}`);});
  refreshLanguage(root instanceof Document?root.documentElement:root as HTMLElement);
}
