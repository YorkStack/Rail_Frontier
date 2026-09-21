import {languages,language,translate,translateSource} from './index.js';
const sources=new WeakMap<Node,{source:string;rendered:string}>();
const attributes=new WeakMap<Element,Map<string,{source:string;rendered:string}>>();
const excluded='script,style,code,pre,textarea,[data-no-translate]';
function translateNode(node:Text):void {
  if(node.parentElement?.closest(excluded))return;
  const current=node.textContent??'',previous=sources.get(node),source=previous?.rendered===current?previous.source:current,rendered=translateSource(source);
  if(current!==rendered)node.textContent=rendered;sources.set(node,{source,rendered});
}
export function localizeTree(root:ParentNode):void {
  const owner=root instanceof Document?root:root.ownerDocument??document,walker=owner.createTreeWalker(root as Node,NodeFilter.SHOW_TEXT);let node:Node|null;
  while((node=walker.nextNode()))translateNode(node as Text);
  for(const element of root.querySelectorAll<HTMLElement>('[aria-label],[title],[placeholder],[data-i18n]')){
    if(element.closest(excluded))continue;
    if(element.dataset.i18n){element.textContent=translate(element.dataset.i18n);continue;}
    let known=attributes.get(element);if(!known){known=new Map();attributes.set(element,known);}
    for(const name of ['aria-label','title','placeholder']){const value=element.getAttribute(name);if(value===null)continue;const previous=known.get(name),source=previous?.rendered===value?previous.source:value,rendered=translateSource(source);element.setAttribute(name,rendered);known.set(name,{source,rendered});}
  }
}
export function setText(node:Node,source:string|null):string|null {node.textContent=source;if(node.nodeType===Node.TEXT_NODE){translateNode(node as Text);return source;}for(const child of node.childNodes)if(child.nodeType===Node.TEXT_NODE)translateNode(child as Text);return source;}
export function setHtml(node:Element,source:string):string {node.innerHTML=source;localizeTree(node);return source;}
export function refreshLanguage(root:HTMLElement):void {root.lang=language();root.dir=languages[language()].direction;localizeTree(root);}

export function setAttribute(node:Element,name:string,source:string):void {
  const rendered=translateSource(source);node.setAttribute(name,rendered);
  let known=attributes.get(node);if(!known){known=new Map();attributes.set(node,known);}known.set(name,{source,rendered});
}
