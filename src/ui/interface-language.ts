import type {UiLanguage} from './preferences.js';

const copy={
  en:{campaign:'Campaign',loadGame:'Load game',settings:'Settings',credits:'Credits',startCompany:'Start new company',continueLatest:'Continue latest',saveGame:'Save game',overview:'Overview',followTrain:'Follow train',buildTracks:'Build tracks',buildStation:'Build station',trainsLines:'Trains & lines',overlays:'Overlays',interfaceSize:'Interface size',interfaceSizeHelp:'Enlarges controls and text without changing the landscape zoom.',language:'Language',languageHelp:'Used for controls and first-service guidance.',woodland:'Woodland',woodlandHelp:'Show trees across the landscape.',reducedMotion:'Reduced motion',reducedMotionHelp:'Follows your operating-system preference.',cameraControls:'Camera controls',cameraControlsHelp:'Drag to orbit · right drag to pan · scroll to zoom.'},
  de:{campaign:'Kampagne',loadGame:'Spiel laden',settings:'Einstellungen',credits:'Mitwirkende',startCompany:'Neue Gesellschaft',continueLatest:'Weiterspielen',saveGame:'Spiel speichern',overview:'Übersicht',followTrain:'Zug folgen',buildTracks:'Gleise bauen',buildStation:'Bahnhof bauen',trainsLines:'Züge & Linien',overlays:'Kartenebenen',interfaceSize:'Bedienoberfläche',interfaceSizeHelp:'Vergrößert Text und Bedienelemente, ohne die Landschaft zu zoomen.',language:'Sprache',languageHelp:'Gilt für Bedienelemente und die Einführung.',woodland:'Wald anzeigen',woodlandHelp:'Zeigt Bäume in der Landschaft.',reducedMotion:'Weniger Bewegung',reducedMotionHelp:'Übernimmt die Einstellung des Betriebssystems.',cameraControls:'Kamerasteuerung',cameraControlsHelp:'Ziehen zum Drehen · Rechtsziehen zum Verschieben · Mausrad zum Zoomen.'}
} as const;

export type InterfaceCopyKey=keyof typeof copy.en;

export function applyInterfaceLanguage(root:ParentNode,language:UiLanguage):void {
  root.querySelectorAll<HTMLElement>('[data-ui-copy]').forEach(node=>{const key=node.dataset.uiCopy as InterfaceCopyKey|undefined;if(key&&key in copy[language])node.textContent=copy[language][key];});
  const labels:Record<string,string>=language==='de'?{'#open-menu':'Hauptmenü öffnen','#close-menu':'Zur Bahn zurück','#save':'Spiel speichern','#load':'Spiel laden'}:{'#open-menu':'Open main menu','#close-menu':'Return to railway','#save':'Save study','#load':'Load study'};
  for(const [selector,label] of Object.entries(labels))root.querySelector<HTMLElement>(selector)?.setAttribute('aria-label',label);
}
