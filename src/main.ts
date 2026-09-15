import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/libre-caslon-display/latin-400.css';
import './ui/study.css';
import { createNorwayPreviewState,straightCurve } from './content/norway-preview.js';
import { createInitialState,norway,norwayV1 } from './content/norway.js';
import {arizonaTerrainStudy} from './content/arizona.js';
import { createNorwayGameState,industryDefinition,industryName } from './content/industries.js';
import { availableVehicles,vehicleDefinition } from './content/vehicles.js';
import { CampaignRenderHost } from './rendering/fjord-renderer.js';
import type { GameState,Id,Speed,Vec3 } from './domain/model.js';
import { IndexedDbSaveStore } from './persistence/indexeddb.js';
import { compileCurve,type TrackGeometry } from './rail/geometry.js';
import { quoteTrack } from './rail/planner.js';
import { certifyCurve } from './rail/constraints.js';
import { surveyStationSite } from './rail/station-layout.js';
import { solveHorizontalAlignment } from './rail/alignment-solver.js';
import { RailFrontierGame } from './application/game.js';
import { GameSaveManager } from './application/saves.js';
import { stationClassName,stationDefinition,stationDefinitions } from './content/stations.js';
import { industryCoverage,townCoverage } from './simulation/coverage.js';
import { connectedTowns } from './simulation/city.js';
import type { MapOverlay,WorldSelection } from './application/ports.js';
import { companyReport } from './simulation/accounting.js';
import { currentYear,dayOfYear } from './simulation/calendar.js';
import {campaignContentRegistry} from './content/registry.js';
import {ActiveSessionHost} from './application/session-host.js';
import {quoteRouteElectrification,routeIsElectrified} from './application/electrification.js';
import {applyPresentationPreferences,readPresentationPreferences,writePresentationPreferences,type PresentationPreferences,type UiLanguage,type UiScale} from './ui/preferences.js';
import {applyInterfaceLanguage} from './ui/interface-language.js';

const preferenceStorage=(()=>{try{return window.localStorage;}catch{return null;}})(),initialPreferences=readPresentationPreferences(preferenceStorage,navigator.language);applyPresentationPreferences(document.documentElement,initialPreferences);
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
  <canvas id="world" aria-label="Norwegian fjord landscape. Drag to orbit, right drag to pan, scroll to zoom." tabindex="0"></canvas>
  <div class="vignette" aria-hidden="true"></div>
  <section id="main-menu" class="main-menu" aria-label="Main menu">
    <div class="menu-sidebar">
      <div class="menu-brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 4v32M27 4v32M9 11h22M9 20h22M9 29h22"/></svg><span>RAIL <b>FRONTIER</b><small>THE NORTHERN LINE</small></span></div>
      <p class="menu-edition">NORWAY · 1900</p>
      <nav aria-label="Main menu sections">
        <button data-menu-view="campaign" aria-current="page"><span>01</span><b data-ui-copy="campaign">Campaign</b></button>
        <button data-menu-view="saves"><span>02</span><b data-ui-copy="loadGame">Load game</b></button>
        <button data-menu-view="settings"><span>03</span><b data-ui-copy="settings">Settings</b></button>
        <button data-menu-view="credits"><span>04</span><b data-ui-copy="credits">Credits</b></button>
      </nav>
      <p class="menu-version">EARLY OPERATIONS · BUILD 0.7</p>
    </div>
    <div class="menu-stage">
      <button id="close-menu" class="menu-close" aria-label="Return to railway">×</button>
      <article id="menu-campaign" class="menu-view">
        <p class="eyebrow">CAMPAIGN 01 · PASSENGER OPERATIONS</p>
        <h2>The Northern Line</h2>
        <p class="menu-lede">Thread a railway between cold water and rising stone. Connect the fjord settlements, carry their first passengers, and make the line pay.</p>
        <div class="campaign-facts"><span>REGION<strong>Norwegian Fjords</strong></span><span>ERA<strong>1900</strong></span><span>DIFFICULTY<strong>Surveyor</strong></span></div>
        <div class="campaign-objectives" aria-label="Campaign objectives">
          <p>FIRST CHARTER</p>
          <span><i>01</i>Connect two settlements</span><span><i>02</i>Carry 200 passengers</span><span><i>03</i>Earn NOK 10,000 operating profit</span>
        </div>
        <div class="menu-actions"><button id="new-game" class="primary-action"><span data-ui-copy="startCompany">Start new company</span><b>→</b></button><button id="continue-game" data-ui-copy="continueLatest">Continue latest</button></div>
      </article>
      <article id="menu-saves" class="menu-view" hidden>
        <p class="eyebrow">COMPANY ARCHIVE</p><h2>Saved companies</h2><p class="menu-lede">Resume a railway exactly where its operations stopped.</p>
        <form id="new-save-slot" class="new-save-slot"><label for="save-name">New manual save</label><div><input id="save-name" maxlength="48" required><button>Save current company</button></div></form>
        <div class="archive-tools"><label class="import-save">Import save<input id="import-save" type="file" accept=".json,.railfrontier,application/json"></label><output id="storage-usage">Checking browser storage…</output></div>
        <div id="save-slots" class="save-slots" aria-live="polite"></div><p id="save-error" class="menu-error" role="status"></p>
      </article>
      <article id="menu-settings" class="menu-view" hidden>
        <p class="eyebrow">FIELD SETTINGS</p><h2>Landscape & motion</h2><p class="menu-lede">Tune the survey view for this device.</p>
        <label class="setting-row"><span><b data-ui-copy="interfaceSize">Interface size</b><small data-ui-copy="interfaceSizeHelp">Enlarges controls and text without changing the landscape zoom.</small></span><select id="ui-scale-setting"><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label>
        <label class="setting-row"><span><b data-ui-copy="language">Language</b><small data-ui-copy="languageHelp">Used for controls and first-service guidance.</small></span><select id="language-setting"><option value="en">English</option><option value="de">Deutsch</option></select></label>
        <label class="setting-row"><span><b data-ui-copy="woodland">Woodland</b><small data-ui-copy="woodlandHelp">Show trees across the landscape.</small></span><input id="trees-setting" type="checkbox" checked></label>
        <div class="setting-row"><span><b data-ui-copy="reducedMotion">Reduced motion</b><small data-ui-copy="reducedMotionHelp">Follows your operating-system preference.</small></span><output id="motion-setting">Off</output></div>
        <div class="setting-row"><span><b data-ui-copy="cameraControls">Camera controls</b><small data-ui-copy="cameraControlsHelp">Drag to orbit · right drag to pan · scroll to zoom.</small></span><output>Active</output></div>
      </article>
      <article id="menu-credits" class="menu-view" hidden>
        <p class="eyebrow">CREDITS & LICENSES</p><h2>Built for the rails.</h2><p class="menu-lede">Rail Frontier is an original browser strategy prototype created in TypeScript and rendered with Three.js.</p>
        <dl class="credits-list"><div><dt>Direction & engineering</dt><dd>YorkStack with Codex</dd></div><div><dt>3D runtime</dt><dd>Three.js r186 · MIT</dd></div><div><dt>Typography</dt><dd>DM Sans · Libre Caslon Display</dd></div><div><dt>Rolling stock</dt><dd>Original Blender models</dd></div></dl>
      </article>
    </div>
  </section>
  <header class="masthead">
    <button id="open-menu" class="brand" aria-label="Open main menu"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 4v32M27 4v32M9 11h22M9 20h22M9 29h22"/></svg><span>RAIL <b>FRONTIER</b><small>THE NORTHERN LINE</small></span></button>
    <div class="chapter"><span class="live-dot"></span> ACTIVE COMPANY <span class="chapter-number">01 / NORWAY</span></div>
    <div class="session-tools"><button id="save" aria-label="Save study" data-ui-copy="saveGame">Save game</button><button id="load" aria-label="Load study" data-ui-copy="loadGame">Load game</button><button id="details" class="square" aria-label="Toggle technical diagnostics" aria-expanded="false">⌘</button></div>
  </header>
  <aside class="field-notes">
    <p class="eyebrow">60° NORTH · A NEW BEGINNING</p>
    <h1>Between the<br>mountains<br><em>and the sea.</em></h1>
    <p class="intro">A railway along the edge of the fjord.<br>Survey the land. Follow the first train.</p>
    <div class="rule"></div>
    <p class="eyebrow route-heading">THE FJORD CORRIDOR <span>9.2 KM</span></p>
    <nav class="settlements" aria-label="Focus a settlement">
      <button data-town="0"><i></i><span>Sundvik<small>Harbour settlement</small></span><b>↗</b></button>
      <button data-town="1"><i></i><span>Granli<small>Forest & timber country</small></span><b>↗</b></button>
      <button data-town="2"><i></i><span>Fjellhavn<small>The mountain gateway</small></span><b>↗</b></button>
    </nav>
    <div class="study-note"><span>FIRST SERVICE</span><p id="service-summary">Preparing passenger operations.</p></div>
  </aside>
  <aside class="objective-card" aria-label="Campaign objectives">
    <p class="eyebrow">FIRST CHARTER <span id="objective-count">0 / 3</span></p>
    <div class="objective-row" data-objective="first-connection"><i></i><span>Connect settlements<small id="objective-connection">0 / 2</small></span></div>
    <div class="objective-row" data-objective="first-passengers"><i></i><span>Carry passengers<small id="objective-passengers">0 / 200</small></span></div>
    <div class="objective-row" data-objective="profitable-railway"><i></i><span>Operating profit<small id="objective-profit">NOK 0 / 10,000</small></span></div>
  </aside>
  <div id="map-labels" class="interactive" aria-label="Map locations"></div>
  <section id="planner" class="floating-panel" hidden aria-label="Alignment study">
    <div class="panel-title"><span class="eyebrow">ALIGNMENT STUDY</span><button id="close-planner" class="square" aria-label="Close alignment study">×</button></div>
    <h2>Read the landscape.</h2><p id="planner-copy">Compare an elevated crossing with a cut through the mountain.</p>
    <label for="alignment">Corridor<select id="alignment"><option value="bridge">Fjord inlet crossing</option><option value="tunnel">Mountain spur</option><option value="coast">Coastal shelf</option><option value="free">Plan between rail connections</option></select></label>
    <div id="elevation-controls"><label for="elevation">Track elevation <output id="elevation-value">15 m</output></label><input id="elevation" type="range" min="-5" max="115" step="1" value="15"></div>
    <div id="alignment-steps" class="alignment-steps" hidden><strong>Choose a glowing rail connection.</strong><span>Click open land to add waypoints. Click another connection to finish.</span></div>
    <div class="quote-grid"><span>Length<strong id="quote-length"></strong></span><span>Estimated cost<strong id="quote-cost"></strong></span></div>
    <p id="quote-kind"></p><p id="quote-valid" role="status"></p>
    <div id="alignment-actions" class="planner-actions" hidden><button id="undo-waypoint" type="button">Undo point</button><button id="clear-alignment" type="button">Cancel draft</button></div>
    <button id="commit-track" class="commit-button">Build this alignment</button><small class="disclosure">The live quote is recalculated before funds are committed.</small>
  </section>
  <section id="station-planner" class="floating-panel" hidden aria-label="Station placement">
    <div class="panel-title"><span class="eyebrow">STATION SURVEY</span><button id="close-station" class="square" aria-label="Close station placement">×</button></div>
    <h2>Begin with a station.</h2><p>Choose open ground near a settlement. The station creates its own platform track and two connection points.</p>
    <ol class="station-flow"><li>Click open ground near the town you want to serve.</li><li>Rotate the platform to face the future route.</li><li>Build the station, then connect one of its highlighted rail ends.</li></ol>
    <label for="station-class">Station class<select id="station-class"></select></label>
    <label for="station-orientation">Platform direction <output id="station-orientation-value">0°</output></label><input id="station-orientation" type="range" min="0" max="355" step="5" value="0">
    <div id="station-selection" class="station-selection"><strong>Choose a station site</strong><span>Click the landscape to move the live platform preview.</span></div>
    <p id="station-valid" role="status">Choose a station site on the map.</p><button id="commit-station" class="commit-button" disabled>Build station</button>
  </section>
  <section id="operations-panel" class="floating-panel operations-panel" hidden aria-label="Railway operations">
    <div class="panel-title"><span class="eyebrow">RAILWAY OFFICE</span><button id="close-operations" class="square" aria-label="Close railway operations">×</button></div>
    <h2>Run the service.</h2>
    <div class="office-section"><p class="office-heading">ROLLING STOCK</p><div id="train-roster" class="office-list"></div>
      <form id="purchase-train"><label for="purchase-station">Purchase at<select id="purchase-station"></select></label><label for="locomotive-id">Locomotive<select id="locomotive-id"></select></label><label for="consist-kind">Service<select id="consist-kind"><option value="passenger">Passenger</option><option value="freight">Timber freight</option></select></label><label for="coach-count">Cars<select id="coach-count"><option value="1">1 car</option><option value="2">2 cars</option><option value="3">3 cars</option></select></label><button class="office-action">Buy consist</button></form>
    </div>
    <div class="office-section"><p class="office-heading">ROUTES</p><div id="route-roster" class="office-list"></div>
      <form id="create-route" class="route-builder"><label for="route-next-stop">Next ordered stop<select id="route-next-stop"></select></label><button id="route-add-stop" type="button">Add stop</button><ol id="route-draft" aria-label="Ordered route stops"></ol><label for="route-mode">Service pattern<select id="route-mode"><option value="shuttle">Shuttle · reverse at ends</option><option value="loop">Loop · continue to first stop</option></select></label><button id="route-clear" type="button">Clear</button><button id="create-route-action" class="office-action" disabled>Create route</button></form>
      <form id="assign-route"><label for="assign-train">Train<select id="assign-train"></select></label><label for="assign-route-select">Route<select id="assign-route-select"></select></label><button class="office-action">Assign service</button></form>
      <form id="electrify-route"><label for="electrify-route-id">Electrify<select id="electrify-route-id"></select></label><button id="electrify-route-action" class="office-action">Build overhead line</button></form>
    </div>
    <div class="office-section"><p class="office-heading">STATIONS</p><div id="station-roster" class="office-list"></div>
      <form id="upgrade-station"><label for="upgrade-station-id">Station<select id="upgrade-station-id"></select></label><label for="upgrade-class-id">Upgrade to<select id="upgrade-class-id"></select></label><button id="upgrade-station-action" class="office-action">Upgrade station</button></form>
    </div>
    <div class="office-section"><p class="office-heading">WAITING PASSENGERS</p><div id="demand-list" class="office-list"></div></div>
    <div class="office-section"><p class="office-heading">TIMBER INDUSTRIES</p><div id="industry-list" class="office-list"></div></div>
    <div class="office-section"><p class="office-heading">COMPANY REPORT</p><div id="company-report" class="office-metrics company-report"></div></div>
    <div class="office-section"><p id="month-heading" class="office-heading">CURRENT MONTH</p><div id="ledger-summary" class="office-metrics month-report"></div><div id="ledger-list" class="office-list ledger-list"></div></div>
    <p id="operations-valid" role="status"></p>
  </section>
  <section id="context-panel" class="floating-panel context-panel" hidden aria-label="Selected map object">
    <div class="panel-title"><span id="context-kind" class="eyebrow">SELECTION</span><button id="close-context" class="square" aria-label="Close selection">×</button></div>
    <h2 id="context-title">Map object</h2><p id="context-copy"></p><div id="context-metrics" class="context-metrics"></div>
    <button id="context-focus" class="commit-button">Focus on map</button>
  </section>
  <section id="overlay-panel" class="floating-panel overlay-panel" hidden aria-label="Map overlays">
    <div class="panel-title"><span class="eyebrow">MAP OVERLAYS</span><button id="close-overlays" class="square" aria-label="Close map overlays">×</button></div>
    <h2>Read the network.</h2><p>Compare coverage, freight production and live use of the railway.</p>
    <div class="overlay-options" role="group" aria-label="Select map overlay">
      <button data-overlay="none" aria-pressed="true"><i></i><span>Clear map<small>Standard landscape view</small></span></button>
      <button data-overlay="catchment" aria-pressed="false"><i></i><span>Station catchments<small>Passenger and freight coverage</small></span></button>
      <button data-overlay="industry" aria-pressed="false"><i></i><span>Industry production<small>Forest and sawmill sites</small></span></button>
      <button data-overlay="traffic" aria-pressed="false"><i></i><span>Rail traffic<small>Reserved and idle track</small></span></button>
    </div>
    <p id="overlay-legend" class="overlay-legend">No overlay selected.</p>
  </section>
  <section id="diagnostics" class="floating-panel diagnostics" hidden aria-label="Technical diagnostics">
    <p class="eyebrow">TECHNICAL OBSERVATIONS</p><h2>Behind the landscape.</h2><pre id="stats"></pre>
    <label class="check"><input id="stress" type="checkbox"> Scale test: 20,000 trees / 100 proxies</label>
    <label class="check"><input id="trees" type="checkbox" checked> Show woodland</label>
    <p class="disclosure">The scale test includes 2,000 buildings and 5,000 strategic rail segments. It measures rendering, not a complete economy.</p>
  </section>
  <footer class="control-deck">
    <div class="camera-tools"><button id="regional" class="icon-button" title="Regional view (R)"><span>⌖</span><b data-ui-copy="overview">Overview</b></button><button id="follow" class="icon-button" title="Follow train (F)"><span>▰</span><b data-ui-copy="followTrain">Follow train</b></button><button id="plan" class="icon-button" aria-expanded="false"><span>⌁</span><b data-ui-copy="buildTracks">Build tracks</b></button><button id="place-station" class="icon-button" aria-expanded="false"><span>⌑</span><b data-ui-copy="buildStation">Build station</b></button><button id="operations" class="icon-button" aria-expanded="false"><span>▤</span><b data-ui-copy="trainsLines">Trains & lines</b></button><button id="overlays" class="icon-button" aria-expanded="false"><span>◉</span><b data-ui-copy="overlays">Overlays</b></button></div>
    <div class="time-control"><span id="run-state">RUNNING</span><div class="speeds" role="group" aria-label="Simulation speed"><button data-speed="0" aria-label="Pause" aria-pressed="false">Ⅱ</button><button data-speed="1" aria-pressed="true">1×</button><button data-speed="2" aria-pressed="false">2×</button><button data-speed="4" aria-pressed="false">4×</button><button data-speed="8" aria-pressed="false">8×</button></div></div>
  </footer>
  <aside class="company-strip" aria-label="Company status"><span>Cash<strong id="cash">—</strong></span><span>Date<strong id="date">—</strong></span><span>Passengers<strong id="passengers">0 delivered</strong></span><span>Mail<strong id="mail">0 delivered</strong></span><span>Operating result<strong id="profit">No result yet</strong></span></aside>
  <div class="world-caption"><span>NORWEGIAN FJORDS</span><span>Drag to orbit · Right drag to pan · Scroll to explore</span><span id="fps">Preparing landscape…</span></div>
  <aside class="terrain-study-caption" aria-label="Arizona terrain study controls">
    <p>ARIZONA BASIN · LANDSCAPE STUDY</p>
    <h1>Red rock country.</h1>
    <span>This is a scenery preview. Railway construction and company play are currently available in Norway.</span>
    <nav aria-label="Arizona camera views"><button data-study-camera="entry" aria-pressed="true">Town</button><button data-study-camera="canyon" aria-pressed="false">Canyon</button><button data-study-camera="regional" aria-pressed="false">Overview</button></nav>
    <a href="./?skip-menu=1">Return to the Norway campaign</a>
  </aside>
  <div id="toast" role="status" aria-live="polite">Preparing the northern line…</div>
`;
app.addEventListener('submit',event=>event.preventDefault());
const element=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
applyInterfaceLanguage(document,initialPreferences.language);
const toast=(message:string)=>{element('#toast').textContent=message;element('#toast').classList.add('visible');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>element('#toast').classList.remove('visible'),4200);};
let toastTimer=0;
async function start():Promise<void> {
  const query=new URLSearchParams(location.search),world=query.get('world'),initialCampaign=world==='v1'?norwayV1:world==='arizona'?arizonaTerrainStudy:norway,initialContent=campaignContentRegistry.resolve({campaignId:initialCampaign.id,campaignVersion:initialCampaign.version,world:initialCampaign.world}),terrain=initialContent.worldGenerator.generate(initialCampaign.world),initial=initialCampaign.id===arizonaTerrainStudy.id?createInitialState(initialCampaign):createNorwayPreviewState(terrain,initialCampaign),store=new IndexedDbSaveStore(),renderHost=new CampaignRenderHost(element<HTMLCanvasElement>('#world')),sessionHost=new ActiveSessionHost(campaignContentRegistry,renderHost);
  document.body.classList.toggle('terrain-study-mode',initialCampaign.id===arizonaTerrainStudy.id);element<HTMLCanvasElement>('#world').ariaLabel=initialCampaign.id===arizonaTerrainStudy.id?'Arizona basin terrain study. Drag to orbit, right drag to pan, scroll to zoom.':'Norwegian fjord landscape. Drag to orbit, right drag to pan, scroll to zoom.';
  await sessionHost.initialize(initial);
  const validateSaveContent=(candidate:GameState)=>{campaignContentRegistry.resolve(candidate);};
  let game=sessionHost.game,view=sessionHost.renderer,saves=new GameSaveManager(game,store,undefined,validateSaveContent),state=game.snapshot(),switchingSession=false;
  let preferences:PresentationPreferences={...initialPreferences};const persistPreferences=()=>{applyPresentationPreferences(document.documentElement,preferences);applyInterfaceLanguage(document,preferences.language);writePresentationPreferences(preferenceStorage,preferences);};
  const scaleSetting=element<HTMLSelectElement>('#ui-scale-setting'),languageSetting=element<HTMLSelectElement>('#language-setting');scaleSetting.value=String(preferences.uiScale);languageSetting.value=preferences.language;scaleSetting.onchange=()=>{preferences={...preferences,uiScale:Number(scaleSetting.value) as UiScale};persistPreferences();};languageSetting.onchange=()=>{preferences={...preferences,language:languageSetting.value as UiLanguage};persistPreferences();};
  element<HTMLSelectElement>('#station-class').replaceChildren(...Object.values(stationDefinitions).map(definition=>{const option=document.createElement('option');option.value=definition.id;option.textContent=`${stationClassName(definition.id)} · ${money(definition.purchaseCost)}`;return option;}));
  let selection:WorldSelection|null=null;
  const labels=view.labels.map(label=>{const node=document.createElement('button');node.className=`map-label ${label.selection.kind}`;node.textContent=label.name;node.onclick=()=>selectWorld(label.selection,true);element('#map-labels').append(node);return node;});
  const syncSpeed=()=>{document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.speed)===game.speed)));element('#run-state').textContent=game.speed===0?'PAUSED':'RUNNING';};
  const setSpeed=(value:Speed)=>{const result=game.dispatch({sequence:game.snapshot().operations.lastCommandSequence+1,command:{type:'setSpeed',speed:value}});if(!result.ok){toast(result.reason);return;}state=game.snapshot();syncSpeed();};
  const startsInMenu=!query.has('skip-menu');if(startsInMenu)game.pauseForVisibility();element('#main-menu').hidden=!startsInMenu;syncSpeed();
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button=>button.onclick=()=>setSpeed(Number(button.dataset.speed) as Speed));
  element('#regional').onclick=()=>view.regional();element('#follow').onclick=()=>{view.followTrain();toast('Following the Fjord Corridor passenger service.');};
  document.querySelectorAll<HTMLButtonElement>('[data-study-camera]').forEach(button=>button.onclick=()=>{view.setCameraPreset(button.dataset.studyCamera!);document.querySelectorAll<HTMLButtonElement>('[data-study-camera]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));});
  document.querySelectorAll<HTMLButtonElement>('[data-town]').forEach(button=>button.onclick=()=>{const town=state.towns[Number(button.dataset.town)];if(town)selectWorld({kind:'town',id:town.id},true);});
  element('#details').onclick=()=>{const panel=element('#diagnostics');panel.hidden=!panel.hidden;element('#details').setAttribute('aria-expanded',String(!panel.hidden));};
  element<HTMLInputElement>('#stress').onchange=event=>{view.setStress(structuredClone(state) as GameState,(event.target as HTMLInputElement).checked);view.regional();frames.length=0;};
  const setTrees=(visible:boolean)=>{view.setTrees(visible);element<HTMLInputElement>('#trees').checked=visible;element<HTMLInputElement>('#trees-setting').checked=visible;};
  element<HTMLInputElement>('#trees').onchange=event=>setTrees((event.target as HTMLInputElement).checked);
  element<HTMLInputElement>('#trees-setting').onchange=event=>setTrees((event.target as HTMLInputElement).checked);
  element('#motion-setting').textContent=matchMedia('(prefers-reduced-motion: reduce)').matches?'On':'Off';
  let preview:{curve:ReturnType<typeof straightCurve>;curves:ReturnType<typeof straightCurve>[];geometries:TrackGeometry[];cost:number;valid:boolean}|null=null,freePoints:Vec3[]=[],freeCursor:Vec3|null=null,freeComplete=false,stationPosition:{x:number;z:number}|null=null,stationOrientation=0,stationPreviewValid=false,interaction:'none'|'free-track'|'station'='none';
  const syncMapLabels=()=>element('#map-labels').classList.toggle('interactive',interaction==='none');
  const stationPorts=()=>state.stations.flatMap(station=>station.layout.kind==='single-platform'?station.layout.ports:[]);
  const portAt=(point:Vec3)=>stationPorts().find(port=>{const node=state.railway.nodes.find(item=>item.id===port.nodeId);return node&&Math.hypot(node.position.x-point.x,node.position.y-point.y,node.position.z-point.z)<=.001;});
  const railSnapNodes=()=>{const stopIds=new Set(state.stations.flatMap(station=>station.layout.kind==='single-platform'?[station.layout.stopNodeId]:[])),ports=new Map(stationPorts().map(port=>[port.nodeId,port]));return state.railway.nodes.filter(node=>!stopIds.has(node.id)&&(!ports.has(node.id)||state.railway.edges.filter(edge=>edge.from===node.id||edge.to===node.id).length<2));};
  const syncRailPortHandles=()=>view.setRailPortHandles(interaction==='free-track'?stationPorts().flatMap(port=>{const node=state.railway.nodes.find(item=>item.id===port.nodeId),connections=state.railway.edges.filter(edge=>edge.from===port.nodeId||edge.to===port.nodeId).length;return node&&connections<2?[node.position]:[];}):[]);
  const stationName=(id:string)=>{const station=state.stations.find(item=>item.id===id),town=state.towns.find(item=>item.id===station?.townId);return town?.name??station?.id.replace(':',' ')??id;};
  const contextMetric=(label:string,value:string)=>{const node=document.createElement('span'),name=document.createElement('small'),amount=document.createElement('strong');name.textContent=label;amount.textContent=value;node.append(name,amount);return node;};
  function renderContext():void {
    if(!selection)return;
    const kind=element('#context-kind'),title=element('#context-title'),copy=element('#context-copy'),metrics=element('#context-metrics');metrics.replaceChildren();
    if(selection.kind==='town') {
      const town=state.towns.find(item=>item.id===selection!.id);if(!town){toggleContext(false);return;}const covered=townCoverage(state).get(town.id),connected=connectedTowns(state).has(town.id),waiting=state.operations.demand.filter(batch=>batch.originTownId===town.id).reduce((sum,batch)=>sum+batch.quantity,0),economy=state.operations.townEconomy[town.id];if(!economy){toggleContext(false);return;}
      kind.textContent='SETTLEMENT';title.textContent=town.name;copy.textContent=connected?`${stationName(covered!)} gives this settlement an active railway connection.`:covered?`${stationName(covered)} is in range, but no route serves it.`:'Build a station inside the catchment to connect this settlement.';metrics.append(contextMetric('Population',town.population.toLocaleString()),contextMetric('Economic activity',`${economy.economicActivity} / 100`),contextMetric('Rail access',connected?'Connected':'Unserved'),contextMetric('Passengers',`${waiting.toLocaleString()} waiting`),contextMetric('Lumber demand',economy.lumberDemand.toLocaleString()),contextMetric('Mail waiting',economy.mailWaiting.toLocaleString()),contextMetric('Lumber supplied',economy.lumberDelivered.toLocaleString()),contextMetric('Connected days',economy.connectedDays.toLocaleString()),contextMetric('Latest growth',economy.lastPopulationChange?`+${economy.lastPopulationChange}`:'No change'));
    } else if(selection.kind==='industry') {
      const industry=state.industries.find(item=>item.id===selection!.id);if(!industry){toggleContext(false);return;}const recipe=industryDefinition(industry.definitionId),covered=industryCoverage(state).get(industry.id),progress=recipe?Math.round((state.operations.industryCycleTicks[industry.id]??0)/recipe.cycleTicks*100):0;
      kind.textContent='INDUSTRY';title.textContent=industryName(industry.definitionId);copy.textContent=covered?`${stationName(covered)} handles this site's freight.`:'This site is outside the catchment of a station.';metrics.append(contextMetric('Timber',String(industry.inventory.timber??0)),contextMetric('Lumber',String(industry.inventory.lumber??0)),contextMetric('Production',`${progress}%`));
    } else if(selection.kind==='station') {
      const station=state.stations.find(item=>item.id===selection!.id);if(!station){toggleContext(false);return;}const definition=stationDefinition(station.classId),town=state.towns.find(item=>item.id===station.townId),stored=station.storage.reduce((sum,lot)=>sum+lot.quantity,0);
      kind.textContent='STATION';title.textContent=town?`${town.name} station`:station.id.replace(':',' ');copy.textContent=town?`Serves ${town.name} and nearby freight producers.`:'This station has no settlement inside its catchment.';metrics.append(contextMetric('Class',stationClassName(station.classId)),contextMetric('Catchment',`${definition?.coverageRadiusM??0} m`),contextMetric('Platform',`${definition?.platformLengthM??0} m`),contextMetric('Storage',`${stored.toLocaleString()} / ${(definition?.storageCapacity??0).toLocaleString()}`),contextMetric('Daily upkeep',money(definition?.maintenancePerDay??0)));
    } else {
      const train=state.trains.find(item=>item.id===selection!.id);if(!train){toggleContext(false);return;}const service=state.operations.trainServices[train.id],route=state.routes.find(item=>item.id===train.routeId),result=(service?.revenue??0)-(service?.operatingCosts??0),cargo=train.cargo.reduce((sum,lot)=>sum+lot.quantity,0);
      kind.textContent='TRAIN';title.textContent=train.id.replace(':',' ');copy.textContent=route?`${route.stops.map(stationName).join(' ↔ ')} · ${route.mode} service`:'Stopped without an assigned route.';metrics.append(contextMetric('State',train.phase),contextMetric('Speed',`${Math.round(train.speedMps*3.6)} km/h`),contextMetric('Cargo',cargo.toLocaleString()),contextMetric('Distance',`${Math.round((service?.distanceM??0)/1000)} km`),contextMetric('Revenue',money(service?.revenue??0)),contextMetric('Result',money(result)));
    }
  }
  function toggleContext(open:boolean):void {element('#context-panel').hidden=!open;if(!open){selection=null;view.setSelection(null,state);}}
  function selectWorld(next:WorldSelection,focus=false):void {togglePlanner(false);toggleStation(false);toggleOperations(false);toggleOverlays(false);selection=next;view.setSelection(next,state);element('#context-panel').hidden=false;renderContext();if(focus)view.focusSelection(next,state);}
  function toggleOverlays(open:boolean):void {element('#overlay-panel').hidden=!open;element('#overlays').setAttribute('aria-expanded',String(open));if(open){togglePlanner(false);toggleStation(false);toggleOperations(false);toggleContext(false);interaction='none';}}
  function selectOverlay(next:MapOverlay):void {view.setOverlay(next,state);document.querySelectorAll<HTMLButtonElement>('[data-overlay]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.overlay===next)));const copy:Record<MapOverlay,string>={none:'No overlay selected.',catchment:'Gold rings show the service radius of each station.',industry:'Green marks the forest; amber marks the sawmill.',traffic:'Coral track is reserved by a train; muted track is currently idle.'};element('#overlay-legend').textContent=copy[next];}
  const updatePlanner=()=>{
    const mode=element<HTMLSelectElement>('#alignment').value,height=Number(element<HTMLInputElement>('#elevation').value),free=mode==='free';
    element('#elevation-controls').hidden=free;element('#alignment-steps').hidden=!free;element('#alignment-actions').hidden=!free;interaction=free?'free-track':'none';syncMapLabels();syncRailPortHandles();element<HTMLButtonElement>('#undo-waypoint').disabled=freePoints.length===0;element<HTMLButtonElement>('#clear-alignment').disabled=freePoints.length===0;
    let curves:ReturnType<typeof straightCurve>[]=[];
    if(free) {
      const draft=freeComplete?freePoints:freeCursor&&freePoints.length?[...freePoints,freeCursor]:freePoints,step=element('#alignment-steps');
      step.innerHTML=freePoints.length===0?'<strong>1 · Choose a glowing rail connection.</strong><span>This becomes the start of the planned railway.</span>':freeComplete?`<strong>3 · Route ready for review.</strong><span>${Math.max(0,freePoints.length-2)} waypoint${freePoints.length===3?'':'s'} · Undo to revise or build the complete alignment.</span>`:`<strong>2 · Shape the route.</strong><span>Click open land for a waypoint; click another glowing rail connection to finish.</span>`;
      if(draft.length<2){preview=null;view.setAlignmentPreview([]);view.setMarker(freePoints.at(-1)??null);element('#planner-copy').textContent='Plan a continuous railway between two available network connections.';element('#quote-length').textContent='—';element('#quote-cost').textContent='—';element('#quote-kind').textContent='';element('#quote-valid').textContent='Choose the first highlighted rail connection.';element('#quote-valid').classList.remove('invalid');element<HTMLButtonElement>('#commit-track').disabled=true;return;}
      try {const startPort=portAt(draft[0]!),endPort=freeComplete?portAt(draft.at(-1)!):undefined;curves=solveHorizontalAlignment(draft,{...(startPort?{start:startPort.outward}:{}),...(endPort?{end:{x:-endPort.outward.x,z:-endPort.outward.z}}:{})});element('#planner-copy').textContent='The live spline passes through every fixed waypoint and leaves station platforms in their saved direction.';}
      catch(error){preview=null;view.setAlignmentPreview([]);element('#quote-length').textContent='—';element('#quote-cost').textContent='—';element('#quote-kind').textContent='';element('#quote-valid').textContent=message(error);element('#quote-valid').classList.add('invalid');element<HTMLButtonElement>('#commit-track').disabled=true;return;}
    } else if(mode==='bridge'){const z=3200,shore=sessionHost.content.worldGenerator.landforms.waterCrossSection(z).eastBankX;if(shore===null)throw new Error('This campaign has no east-bank crossing');curves=[straightCurve({x:shore-350,y:height,z},{x:shore+350,y:height,z})];element('#planner-copy').textContent='A direct crossing from open water into the Sundvik shore.';}
    else if(mode==='tunnel'){curves=[straightCurve({x:3500,y:height,z:6100},{x:5200,y:height,z:6100})];element('#planner-copy').textContent='A level bore beneath the Granli mountain spur.';}
    else {const a=state.towns[0]!.position,b=state.towns[1]!.position;curves=[straightCurve({x:a.x+180,y:height,z:a.z+160},{x:b.x+180,y:height,z:b.z-160})];element('#planner-copy').textContent='A long shelf following the inhabited side of the fjord.';}
    const geometries=curves.map(curve=>compileCurve(curve)),quotes=geometries.map(geometry=>quoteTrack(geometry,sessionHost.terrain)),constraints=curves.map(curve=>certifyCurve(curve)),technicalValid=quotes.every(quote=>quote.valid)&&constraints.every(certificate=>certificate.valid),cost=quotes.reduce((sum,quote)=>sum+quote.cost,0),affordable=state.company.cash>=cost,valid=technicalValid&&affordable&&(!free||freeComplete);
    preview={curve:curves[0]!,curves,geometries,cost,valid};view.setAlignmentPreview(geometries,technicalValid?'#edc879':'#d7795f');view.setMarker(free?freePoints.at(-1)??null:null);
    element('#elevation-value').textContent=`${height} m`;element('#quote-length').textContent=`${Math.round(geometries.reduce((sum,geometry)=>sum+geometry.lengthM,0))} m`;element('#quote-cost').textContent=new Intl.NumberFormat('en',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(cost/100);
    const lengths={ground:0,bridge:0,tunnel:0};for(const quote of quotes)for(const span of quote.intervals)lengths[span.kind]+=span.endM-span.startM;
    element('#quote-kind').textContent=Object.entries(lengths).filter(([,length])=>length>1).map(([kind,length])=>`${Math.round(length)} m ${kind}`).join(' · ');
    const reasons=[...quotes.flatMap(quote=>quote.reasons),...constraints.flatMap(certificate=>certificate.reasons)];element('#quote-valid').textContent=!technicalValid?reasons.join(' · '):!affordable?`Insufficient funds · ${money(cost-state.company.cash)} more required`:free&&!freeComplete?'Planning preview · choose a destination connection to finish.':'✓ Feasible survey alignment';element('#quote-valid').classList.toggle('invalid',!technicalValid||!affordable);element<HTMLButtonElement>('#commit-track').disabled=!valid;
  };
  const resetFreeDraft=()=>{freePoints=[];freeCursor=null;freeComplete=false;};
  const togglePlanner=(open:boolean)=>{element('#planner').hidden=!open;element('#plan').setAttribute('aria-expanded',String(open));if(open){toggleStation(false);toggleOperations(false);toggleOverlays(false);toggleContext(false);updatePlanner();}else{interaction='none';resetFreeDraft();syncMapLabels();view.setAlignmentPreview([]);view.setMarker(null);view.setRailPortHandles([]);}};
  element('#plan').onclick=()=>togglePlanner(element('#planner').hidden!==false);element('#close-planner').onclick=()=>togglePlanner(false);
  element('#alignment').onchange=()=>{resetFreeDraft();view.setMarker(null);updatePlanner();if(element<HTMLSelectElement>('#alignment').value!=='free'&&preview)view.focus(preview.curve.p1);};
  element('#elevation').oninput=updatePlanner;
  const undoWaypoint=()=>{if(freePoints.length===0)return;if(freeComplete){freePoints.pop();freeComplete=false;}else freePoints.pop();freeCursor=null;updatePlanner();};element('#undo-waypoint').onclick=undoWaypoint;element('#clear-alignment').onclick=()=>{resetFreeDraft();updatePlanner();};
  element('#commit-track').onclick=()=>{if(!preview?.valid){toast('This alignment is not buildable.');return;}const command=element<HTMLSelectElement>('#alignment').value==='free'?{type:'buildAlignment' as const,curves:preview.curves,from:{position:preview.curves[0]!.p0},to:{position:preview.curves.at(-1)!.p3},expectedRevision:state.railway.revision,quotedCost:preview.cost}:{type:'buildTrack' as const,curve:preview.curve,from:{position:preview.curve.p0},to:{position:preview.curve.p3},expectedRevision:state.railway.revision,quotedCost:preview.cost},result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command});state=game.snapshot();if(result.ok){toast(`Complete alignment built for ${money(preview.cost)}.`);togglePlanner(false);}else toast(result.reason);};
  function updateStationSelection():void {
    const status=element('#station-valid'),button=element<HTMLButtonElement>('#commit-station'),definition=stationDefinition(element<HTMLSelectElement>('#station-class').value)!;stationPreviewValid=false;button.disabled=true;
    if(!stationPosition){element('#station-selection').innerHTML='<strong>Choose a station site</strong><span>Click the landscape to move the live platform preview.</span>';status.textContent='Choose a station site on the map.';status.classList.add('invalid');view.setPreview(null);view.setMarker(null);return;}
    try {
      const site=surveyStationSite(sessionHost.terrain,stationPosition,stationOrientation,definition.platformLengthM),town=state.towns.map(item=>({item,distance:Math.hypot(item.position.x-site.center.x,item.position.z-site.center.z)})).sort((a,b)=>a.distance-b.distance)[0],overlap=state.stations.some(station=>{const pad=station.layout.kind==='single-platform'?station.layout.pad:undefined,node=state.railway.nodes.find(item=>item.id===station.nodeId),center=pad?.center??node?.position,radius=pad?Math.hypot(pad.lengthM/2,pad.widthM/2):(stationDefinition(station.classId)?.platformLengthM??0)/2;return center!==undefined&&Math.hypot(center.x-site.center.x,center.z-site.center.z)<radius+Math.hypot(site.lengthM/2,site.widthM/2);}),reason=overlap?'This station overlaps an existing station.':state.company.cash<definition.purchaseCost?'The company cannot afford this station.':'';
      element('#station-selection').innerHTML=`<strong>${town&&town.distance<=definition.coverageRadiusM?town.item.name:'Rural'} station</strong><span>${Math.round(site.center.x)} E · ${Math.round(site.center.z)} S · ${Math.round(site.lengthM)} m platform · ${site.maxReliefM.toFixed(1)} m ground relief${town&&town.distance<=definition.coverageRadiusM?` · Serves ${town.item.name}`:' · No settlement in range'}</span>`;
      view.setStationPreview(site,!reason);view.setMarker(null);status.textContent=reason||`✓ Ready · ${money(definition.purchaseCost)} · Build first, connect track next`;status.classList.toggle('invalid',Boolean(reason));stationPreviewValid=!reason;button.disabled=!stationPreviewValid;
    } catch(error) {const message=error instanceof Error?error.message:String(error);element('#station-selection').innerHTML=`<strong>Site unavailable</strong><span>${Math.round(stationPosition.x)} E · ${Math.round(stationPosition.z)} S</span>`;status.textContent=message;status.classList.add('invalid');view.setStationPreview(null);const sample=sessionHost.terrain.sample(stationPosition.x,stationPosition.z);view.setMarker({x:stationPosition.x,y:sample.elevationM,z:stationPosition.z},'#d7795f');}
  }
  function toggleStation(open:boolean):void {element('#station-planner').hidden=!open;element('#place-station').setAttribute('aria-expanded',String(open));if(open){toggleOperations(false);toggleOverlays(false);toggleContext(false);element('#planner').hidden=true;element('#plan').setAttribute('aria-expanded','false');resetFreeDraft();view.setRailPortHandles([]);interaction='station';syncMapLabels();if(!stationPosition){const definition=stationDefinition(element<HTMLSelectElement>('#station-class').value)!,town=state.towns.find(candidate=>!state.stations.some(station=>{const node=state.railway.nodes.find(item=>item.id===station.nodeId);return node&&Math.hypot(node.position.x-candidate.position.x,node.position.z-candidate.position.z)<=definition.coverageRadiusM;}))??state.towns[0];if(town)stationPosition={x:town.position.x,z:town.position.z};}updateStationSelection();if(stationPosition){const sample=sessionHost.terrain.sample(stationPosition.x,stationPosition.z);view.focus({x:stationPosition.x,y:sample.elevationM,z:stationPosition.z});}}else{if(interaction==='station')interaction='none';syncMapLabels();view.setPreview(null);view.setMarker(null);}}
  element('#place-station').onclick=()=>toggleStation(element('#station-planner').hidden!==false);element('#close-station').onclick=()=>toggleStation(false);element('#station-class').onchange=updateStationSelection;element<HTMLInputElement>('#station-orientation').oninput=event=>{const degrees=Number((event.currentTarget as HTMLInputElement).value);stationOrientation=degrees*Math.PI/180;element('#station-orientation-value').textContent=`${degrees}°`;updateStationSelection();};
  element('#commit-station').onclick=()=>{if(!stationPosition||!stationPreviewValid)return;const definition=stationDefinition(element<HTMLSelectElement>('#station-class').value)!;const result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'placeStation',classId:definition.id,position:stationPosition,orientationRad:stationOrientation,expectedRevision:state.railway.revision,quotedCost:definition.purchaseCost}});state=game.snapshot();if(result.ok){toast(`Station built for ${money(definition.purchaseCost)}. Connect track to either highlighted rail end.`);stationPosition=null;toggleStation(false);}else{toast(result.reason);updateStationSelection();}};
  const canvas=element<HTMLCanvasElement>('#world'),mapClick=(event:MouseEvent)=>{if(interaction==='none'){const entity=view.pickEntity(event.clientX,event.clientY);if(entity)selectWorld(entity);return;}const picked=view.pick(event.clientX,event.clientY);if(!picked){toast('Choose a point on land.');return;}if(interaction==='free-track'){const nearest=railSnapNodes().map(node=>({node,distance:Math.hypot(node.position.x-picked.x,node.position.z-picked.z)})).sort((a,b)=>a.distance-b.distance)[0],snapped=nearest&&nearest.distance<=45?nearest.node:null;if(freeComplete)resetFreeDraft();if(freePoints.length===0){if(!snapped){toast('Start at a highlighted station port or railway connection.');return;}freePoints.push(structuredClone(snapped.position));}else if(snapped&&Math.hypot(snapped.position.x-freePoints[0]!.x,snapped.position.z-freePoints[0]!.z)>1){freePoints.push(structuredClone(snapped.position));freeComplete=true;freeCursor=null;}else if(freePoints.length<127){freePoints.push(structuredClone(picked));freeCursor=null;}updatePlanner();return;}stationPosition={x:picked.x,z:picked.z};updateStationSelection();};canvas.addEventListener('click',mapClick);
  let plannerPointerFrame=0,pointerX=0,pointerY=0;const mapMove=(event:MouseEvent)=>{if(interaction!=='free-track'||freePoints.length===0||freeComplete)return;pointerX=event.clientX;pointerY=event.clientY;if(plannerPointerFrame)return;plannerPointerFrame=requestAnimationFrame(()=>{plannerPointerFrame=0;if(interaction!=='free-track'||freeComplete)return;freeCursor=view.pick(pointerX,pointerY);updatePlanner();});};const mapContext=(event:MouseEvent)=>{if(interaction!=='free-track')return;event.preventDefault();if(freePoints.length===0)togglePlanner(false);else undoWaypoint();};canvas.addEventListener('mousemove',mapMove);canvas.addEventListener('contextmenu',mapContext);
  const fillSelect=(selector:string,items:{value:string;label:string}[])=>{const select=element<HTMLSelectElement>(selector),selected=select.value;select.replaceChildren(...items.map(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.label;return option;}));if(items.some(item=>item.value===selected))select.value=selected;};
  const routeDraft:Id<'station'>[]=[];
  const renderRouteDraft=()=>{const list=element<HTMLOListElement>('#route-draft');list.replaceChildren(...routeDraft.map((stationId,index)=>{const item=document.createElement('li'),name=document.createElement('span'),remove=document.createElement('button');name.textContent=`${String(index+1).padStart(2,'0')} · ${stationName(stationId)}`;remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${stationName(stationId)} from route`);remove.onclick=()=>{routeDraft.splice(index,1);renderRouteDraft();};item.append(name,remove);return item;}));const available=state.stations.filter(station=>!routeDraft.includes(station.id));fillSelect('#route-next-stop',available.length?available.map(station=>({value:station.id,label:stationName(station.id)})):[{value:'',label:'All stations added'}]);element<HTMLButtonElement>('#route-add-stop').disabled=available.length===0;element<HTMLButtonElement>('#create-route-action').disabled=routeDraft.length<2;};
  function renderOperations():void {
    const report=companyReport(state),signed=(value:number)=>`${value>=0?'+':''}${money(value)}`;
    fillSelect('#purchase-station',state.stations.map(station=>({value:station.id,label:stationName(station.id)})));
    fillSelect('#locomotive-id',availableVehicles(currentYear(state),'locomotive').map(definition=>({value:definition.id,label:`${definition.name} · ${definition.traction} · ${money(definition.purchaseCost)}`})));
    fillSelect('#upgrade-station-id',state.stations.map(station=>({value:station.id,label:`${stationName(station.id)} · ${stationClassName(station.classId)}`})));
    const fillUpgradeClasses=()=>{const station=state.stations.find(item=>item.id===element<HTMLSelectElement>('#upgrade-station-id').value),current=stationDefinition(station?.classId??''),eligible=current?Object.values(stationDefinitions).filter(definition=>definition.purchaseCost>current.purchaseCost&&definition.coverageRadiusM>=current.coverageRadiusM&&definition.storageCapacity>=current.storageCapacity&&definition.platformLengthM>=current.platformLengthM):[];fillSelect('#upgrade-class-id',eligible.length?eligible.map(definition=>({value:definition.id,label:`${stationClassName(definition.id)} · +${money(definition.purchaseCost-current!.purchaseCost)}`})):[{value:current?.id??'',label:current?`${stationClassName(current.id)} · highest class`:'No station available'}]);element<HTMLButtonElement>('#upgrade-station-action').disabled=eligible.length===0;};fillUpgradeClasses();element<HTMLSelectElement>('#upgrade-station-id').onchange=fillUpgradeClasses;
    renderRouteDraft();
    fillSelect('#assign-train',state.trains.map(train=>({value:train.id,label:`${train.id.replace(':',' ')} · ${train.phase}`})));fillSelect('#assign-route-select',state.routes.map(route=>({value:route.id,label:`${route.id.replace(':',' ')} · ${route.stops.map(stationName).join(route.mode==='loop'?' → ':' ↔ ')}${route.mode==='loop'?' ↻':''}`})));
    fillSelect('#electrify-route-id',state.routes.length?state.routes.map(route=>{const quote=quoteRouteElectrification(state,route.id);return {value:route.id,label:`${route.id.replace(':',' ')} · ${quote.edgeIds.length===0?'fully electrified':`${Math.round(quote.lengthM)} m · ${money(quote.cost)}`}`};}):[{value:'',label:'No route available'}]);const updateElectrificationAction=()=>{const selected=state.routes.find(route=>route.id===element<HTMLSelectElement>('#electrify-route-id').value);element<HTMLButtonElement>('#electrify-route-action').disabled=!selected||routeIsElectrified(state,selected);};updateElectrificationAction();element<HTMLSelectElement>('#electrify-route-id').onchange=updateElectrificationAction;
    const trains=element('#train-roster');trains.replaceChildren(...state.trains.map(train=>{const trainReport=report.trains.find(item=>item.trainId===train.id)!,row=document.createElement('button'),freight=train.vehicleIds.some(id=>(vehicleDefinition(id)?.capacity.timber??0)>0),cargo=train.cargo.map(lot=>`${lot.quantity} ${lot.kind}`).join(' · ')||'empty';row.className='office-row';row.innerHTML=`<strong>${train.id.replace(':',' ')}</strong><span>${train.vehicleIds.length} ${freight?'freight car':'coach'}${train.vehicleIds.length===1?'':'s'} · ${train.phase} · ${Math.round(train.speedMps*3.6)} km/h</span><small>${cargo} · revenue ${money(trainReport.revenue)} · cost ${money(trainReport.operatingCost)} · result ${signed(trainReport.operatingProfit)}</small>`;row.onclick=()=>selectWorld({kind:'train',id:train.id},true);return row;}));
    const routes=element('#route-roster');routes.replaceChildren(...state.routes.map(route=>{const routeReport=report.routes.find(item=>item.routeId===route.id)!,row=document.createElement('div'),electric=routeIsElectrified(state,route),stops=`${route.stops.map(stationName).join(route.mode==='loop'?' → ':' ↔ ')}${route.mode==='loop'?' ↻':''}`;row.innerHTML=`<strong>${route.id.replace(':',' ')}</strong><span>${stops} · ${routeReport.trainIds.length} train${routeReport.trainIds.length===1?'':'s'} · ${electric?'⚡ electrified':'no overhead line'}</span><small>revenue ${money(routeReport.revenue)} · cost ${money(routeReport.operatingCost)} · result ${signed(routeReport.operatingProfit)}</small>`;return row;}));
    const stations=element('#station-roster');stations.replaceChildren(...state.stations.map(station=>{const row=document.createElement('button'),definition=stationDefinition(station.classId);row.className='office-row';row.innerHTML=`<strong>${stationName(station.id)}</strong><span>${stationClassName(station.classId)} · ${definition?.coverageRadiusM??0} m catchment</span><small>${definition?.platformLengthM??0} m platform · ${station.storage.reduce((sum,lot)=>sum+lot.quantity,0)} / ${definition?.storageCapacity??0} stored</small>`;row.onclick=()=>selectWorld({kind:'station',id:station.id},true);return row;}));
    const demand=element('#demand-list');demand.replaceChildren(...state.towns.map(town=>{const waiting=state.operations.demand.filter(batch=>batch.originTownId===town.id).reduce((sum,batch)=>sum+batch.quantity,0),economy=state.operations.townEconomy[town.id],row=document.createElement('button');row.className='office-row';row.innerHTML=`<strong>${town.name}</strong><span>${waiting.toLocaleString()} passengers · ${economy?.mailWaiting??0} mail · ${economy?.lumberDemand??0} lumber needed</span><small>Population ${town.population.toLocaleString()} · activity ${economy?.economicActivity??0}/100</small>`;row.onclick=()=>selectWorld({kind:'town',id:town.id},true);return row;}));
    const industries=element('#industry-list');industries.replaceChildren(...state.industries.map(industry=>{const recipe=industryDefinition(industry.definitionId),progress=state.operations.industryCycleTicks[industry.id]??0,stored=Object.values(industry.inventory).reduce((sum,quantity)=>sum+(quantity??0),0),row=document.createElement('button'),stock=`${industry.inventory.timber??0} timber · ${industry.inventory.lumber??0} lumber`;row.className='office-row';row.innerHTML=`<strong>${industryName(industry.definitionId)}</strong><span>${stock}</span><small>${recipe?`${Math.round(progress/recipe.cycleTicks*100)}% cycle · ${stored} / ${recipe.storageCapacity} stored`:'Unknown recipe'}</small>`;row.onclick=()=>selectWorld({kind:'industry',id:industry.id},true);return row;}));if(state.industries.length===0)industries.innerHTML='<div><span>No industries in this campaign.</span></div>';
    element('#company-report').innerHTML=`<span>Cash<strong>${money(report.cash)}</strong></span><span>Company value<strong>${money(report.companyValue)}</strong></span><span>Owned assets<strong>${money(report.ownedAssetValue)}</strong></span><span>Track cost<strong>${money(report.infrastructureCost)}</strong></span><span>Capital invested<strong>${money(report.capitalCost)}</strong></span><span>Revenue<strong>${money(report.revenue)}</strong></span><span>Operating cost<strong>${money(report.operatingCost)}</strong></span><span>Operating result<strong class="${report.operatingProfit>=0?'income':'expense'}">${signed(report.operatingProfit)}</strong></span>`;
    element('#month-heading').textContent=`MONTH ${report.month+1}`;element('#ledger-summary').innerHTML=`<span>Revenue<strong>${money(report.currentMonth.revenue)}</strong></span><span>Operating cost<strong>${money(report.currentMonth.operatingCost)}</strong></span><span>Capital<strong>${money(report.currentMonth.capitalCost)}</strong></span><span>Result<strong class="${report.currentMonth.operatingProfit>=0?'income':'expense'}">${signed(report.currentMonth.operatingProfit)}</strong></span>`;
    const ledger=element('#ledger-list'),recent=state.company.ledger.slice(-5).reverse();ledger.replaceChildren(...recent.map(entry=>{const row=document.createElement('div');row.innerHTML=`<strong class="${entry.amount>=0?'income':'expense'}">${entry.amount>=0?'+':''}${money(entry.amount)}</strong><span>${entry.description}</span><small>Day ${Math.floor(entry.tick/1200)+1} · ${entry.category}</small>`;return row;}));if(recent.length===0)ledger.innerHTML='<div><span>No transactions posted yet.</span></div>';
  }
  const operationResult=(result:ReturnType<typeof game.dispatch>,success:string)=>{state=game.snapshot();const status=element('#operations-valid');status.textContent=result.ok?`✓ ${success}`:result.reason;status.classList.toggle('invalid',!result.ok);if(result.ok){toast(success);renderOperations();}};
  function toggleOperations(open:boolean):void {element('#operations-panel').hidden=!open;element('#operations').setAttribute('aria-expanded',String(open));if(open){element('#planner').hidden=true;element('#station-planner').hidden=true;element('#overlay-panel').hidden=true;element('#overlays').setAttribute('aria-expanded','false');toggleContext(false);element('#plan').setAttribute('aria-expanded','false');element('#place-station').setAttribute('aria-expanded','false');interaction='none';resetFreeDraft();view.setPreview(null);view.setMarker(null);view.setRailPortHandles([]);renderOperations();}}
  element('#operations').onclick=()=>toggleOperations(element('#operations-panel').hidden!==false);element('#close-operations').onclick=()=>toggleOperations(false);
  element('#close-context').onclick=()=>toggleContext(false);element('#context-focus').onclick=()=>{if(selection)view.focusSelection(selection,state);};
  element('#overlays').onclick=()=>toggleOverlays(element('#overlay-panel').hidden!==false);element('#close-overlays').onclick=()=>toggleOverlays(false);document.querySelectorAll<HTMLButtonElement>('[data-overlay]').forEach(button=>button.onclick=()=>selectOverlay(button.dataset.overlay as MapOverlay));
  element<HTMLFormElement>('#purchase-train').onsubmit=event=>{event.preventDefault();const cars=Number(element<HTMLSelectElement>('#coach-count').value),kind=element<HTMLSelectElement>('#consist-kind').value,vehicleId=kind==='freight'?'fjord-freight-wagon':'fjord-passenger-coach',locomotiveId=element<HTMLSelectElement>('#locomotive-id').value,stationId=element<HTMLSelectElement>('#purchase-station').value as `station:${number}`,locomotive=vehicleDefinition(locomotiveId);operationResult(game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'purchaseTrain',locomotiveId,vehicleIds:Array<string>(cars).fill(vehicleId),stationId}}),`${locomotive?.name??'Rail'} ${kind} consist purchased.`);};
  element<HTMLFormElement>('#upgrade-station').onsubmit=event=>{event.preventDefault();const stationId=element<HTMLSelectElement>('#upgrade-station-id').value as `station:${number}`,classId=element<HTMLSelectElement>('#upgrade-class-id').value;operationResult(game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'upgradeStation',stationId,classId}}),`Station upgraded to ${stationClassName(classId)}.`);};
  element('#route-add-stop').onclick=()=>{const stationId=element<HTMLSelectElement>('#route-next-stop').value as Id<'station'>;if(stationId&&!routeDraft.includes(stationId)){routeDraft.push(stationId);renderRouteDraft();}};element('#route-clear').onclick=()=>{routeDraft.length=0;renderRouteDraft();};
  element<HTMLFormElement>('#create-route').onsubmit=event=>{event.preventDefault();const mode=element<HTMLSelectElement>('#route-mode').value as 'shuttle'|'loop',result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'createRoute',stops:[...routeDraft],mode}});if(result.ok)routeDraft.length=0;operationResult(result,`${mode==='loop'?'Loop':'Shuttle'} route created.`);};
  element<HTMLFormElement>('#assign-route').onsubmit=event=>{event.preventDefault();const trainId=element<HTMLSelectElement>('#assign-train').value as `train:${number}`,routeId=element<HTMLSelectElement>('#assign-route-select').value as `route:${number}`;operationResult(game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'assignRoute',trainId,routeId}}),'Train assigned to service.');};
  element<HTMLFormElement>('#electrify-route').onsubmit=event=>{event.preventDefault();const routeId=element<HTMLSelectElement>('#electrify-route-id').value as `route:${number}`;operationResult(game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'electrifyRoute',routeId}}),'Route electrified.');};
  const activateSession=async(candidate:GameState)=>{switchingSession=true;try{await saves.drain();state=await sessionHost.replace(candidate);game=sessionHost.game;view=sessionHost.renderer;saves=new GameSaveManager(game,store,undefined,validateSaveContent);selection=null;syncSpeed();selectOverlay('none');toggleContext(false);view.entry();return state;}finally{switchingSession=false;last=performance.now();}};
  const save=async()=>{state=game.snapshot();await saves.save('study','Norwegian Fjords company');return state.tick;};
  const load=async()=>{const candidate=await saves.read('study');state=await activateSession(candidate);return state.tick;};
  element('#save').onclick=()=>{void save().then(tick=>toast(`Study saved at tick ${tick.toLocaleString()}.`)).catch(error=>toast(`Could not save: ${message(error)}`));};
  element('#load').onclick=()=>{void load().then(tick=>toast(`Study resumed at tick ${tick.toLocaleString()}.`)).catch(error=>toast(`Could not load: ${message(error)}`));};
  const selectMenuView=(name:string)=>{document.querySelectorAll<HTMLElement>('.menu-view').forEach(view=>view.hidden=view.id!==`menu-${name}`);document.querySelectorAll<HTMLButtonElement>('[data-menu-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.menuView===name?'page':'false'));if(name==='saves')void refreshSaveSlots();};
  const setMenuError=(error:unknown)=>{element('#save-error').textContent=`The archive could not be opened. ${message(error)} Your running company has not been changed.`;};
  const closeMenu=()=>{element('#main-menu').hidden=true;element<HTMLCanvasElement>('#world').focus();};
  const openMenu=()=>{game.pauseForVisibility();syncSpeed();togglePlanner(false);toggleStation(false);toggleOperations(false);toggleOverlays(false);toggleContext(false);element('#main-menu').hidden=false;selectMenuView('campaign');};
  const loadSlot=async(id:string)=>{state=await activateSession(await saves.read(id));closeMenu();toast(`Company resumed at Day ${Math.floor(state.tick/1200)+1}.`);};
  const downloadSave=({filename,json}:{filename:string;json:string})=>{const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);};
  const renderStorageEstimate=async()=>{const output=element<HTMLOutputElement>('#storage-usage');try{const {usageBytes,quotaBytes}=await saves.estimate();output.textContent=usageBytes===null?'Browser storage usage unavailable':quotaBytes===null?`${formatBytes(usageBytes)} stored locally`:`${formatBytes(usageBytes)} of ${formatBytes(quotaBytes)} browser storage used`;}catch{output.textContent='Browser storage usage unavailable';}};
  const refreshSaveSlots=async()=>{
    const host=element('#save-slots');host.replaceChildren();element('#save-error').textContent='';
    try {
      const slots=await saves.list(),continueButton=element<HTMLButtonElement>('#continue-game');continueButton.disabled=slots.length===0;void renderStorageEstimate();
      if(slots.length===0){const empty=document.createElement('div');empty.className='empty-slots';empty.innerHTML='<strong>No saved companies</strong><span>Start a company, then use Save game from the railway view.</span>';host.append(empty);return;}
      for(const slot of slots) {
        const row=document.createElement('div');row.className='save-slot';
        const copy=document.createElement('span'),name=document.createElement('strong'),date=document.createElement('small');name.textContent=slot.name;date.textContent=slot.id==='autosave'?`AUTOSAVE · ${formatDate(slot.modifiedAt)}`:formatDate(slot.modifiedAt);copy.append(name,date);
        const actions=document.createElement('div'),resume=document.createElement('button'),exportButton=document.createElement('button'),rename=document.createElement('button'),remove=document.createElement('button');resume.textContent='Resume';exportButton.textContent='Export';rename.textContent='Rename';remove.textContent='Delete';actions.append(resume,exportButton,rename,remove);row.append(copy,actions);host.append(row);
        resume.onclick=()=>{void loadSlot(slot.id).catch(setMenuError);};
        exportButton.onclick=()=>{void saves.exportSlot(slot.id).then(portable=>{downloadSave(portable);toast(`${slot.name} exported.`);}).catch(setMenuError);};
        rename.onclick=()=>{const form=document.createElement('form'),input=document.createElement('input'),confirm=document.createElement('button');input.value=slot.name;input.maxLength=48;input.setAttribute('aria-label',`New name for ${slot.name}`);confirm.textContent='Save name';form.append(input,confirm);actions.replaceWith(form);input.focus();input.select();form.onsubmit=event=>{event.preventDefault();void saves.rename(slot.id,input.value).then(refreshSaveSlots).catch(setMenuError);};};
        remove.onclick=()=>{if(remove.dataset.confirm!=='true'){remove.dataset.confirm='true';remove.textContent='Delete?';return;}void saves.remove(slot.id).then(refreshSaveSlots).catch(setMenuError);};
      }
    } catch(error){setMenuError(error);const empty=document.createElement('div');empty.className='empty-slots';empty.innerHTML='<strong>Browser storage is unavailable</strong><span>Private browsing or storage limits may prevent saving on this device.</span>';host.append(empty);}
  };
  document.querySelectorAll<HTMLButtonElement>('[data-menu-view]').forEach(button=>button.onclick=()=>selectMenuView(button.dataset.menuView!));
  element<HTMLInputElement>('#save-name').value=`Northern Line · Day ${Math.floor(state.tick/1200)+1}`;
  element<HTMLFormElement>('#new-save-slot').onsubmit=event=>{event.preventDefault();const input=element<HTMLInputElement>('#save-name'),id=`manual-${Date.now()}`;void saves.save(id,input.value).then(()=>{input.value=`Northern Line · Day ${Math.floor(state.tick/1200)+1}`;toast('A new manual save was added.');return refreshSaveSlots();}).catch(setMenuError);};
  element<HTMLInputElement>('#import-save').onchange=event=>{const input=event.currentTarget as HTMLInputElement,file=input.files?.[0];if(!file)return;void file.text().then(json=>saves.importArchive(json,file.name.replace(/(?:\.railfrontier)?\.json$/i,'').slice(0,48))).then(imported=>{toast(`${imported.name} imported.`);return refreshSaveSlots();}).catch(setMenuError).finally(()=>{input.value='';});};
  element('#open-menu').onclick=openMenu;element('#close-menu').onclick=closeMenu;
  element('#new-game').onclick=()=>{void activateSession(createNorwayGameState()).then(()=>{lastAutosaveDay=0;setSpeed(1);closeMenu();toast('New company: build a station near Sundvik, rotate it toward Granli, then connect its rail end.');}).catch(setMenuError);};
  element('#continue-game').onclick=()=>{void saves.readLatest().then(activateSession).then(next=>{state=next;closeMenu();toast(`Company resumed at Day ${Math.floor(state.tick/1200)+1}.`);}).catch(setMenuError);};
  void refreshSaveSlots();
  const keydown=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;if(event.code==='Escape'){if(!element('#main-menu').hidden)closeMenu();else if(!element('#context-panel').hidden)toggleContext(false);else if(!element('#overlay-panel').hidden)toggleOverlays(false);else if(!element('#operations-panel').hidden)toggleOperations(false);else if(!element('#station-planner').hidden)toggleStation(false);else togglePlanner(false);return;}if(!element('#main-menu').hidden)return;if(event.code==='Space'){event.preventDefault();setSpeed(game.speed===0?1:0);}if(event.code==='KeyR')view.regional();if(event.code==='KeyF')view.followTrain();};
  window.addEventListener('keydown',keydown);
  let last=performance.now(),request=0,frameCount=0,lastAutosaveDay=Math.floor(state.tick/1200);const frames:number[]=[],renderTimes:number[]=[],tickTimes:number[]=[];
  const visibility=()=>{last=performance.now();if(document.hidden){game.pauseForVisibility();syncSpeed();toast('Study paused while this tab is in the background.');}};
  document.addEventListener('visibilitychange',visibility);
  const frame=(now:number)=>{
    const delta=Math.max(0,(now-last)/1000);last=now;
    const begin=performance.now(),result=game.advance(delta),afterTick=performance.now();state=result.current;view.update(result.previous,result.current,game.speed===0?1:result.alpha);const day=Math.floor(state.tick/1200);if(!switchingSession&&day>lastAutosaveDay){lastAutosaveDay=day;void saves.autosave().catch(error=>toast(`Autosave failed: ${message(error)}`));}
    if(delta>0&&!document.hidden){frames.push(delta*1000);renderTimes.push(performance.now()-afterTick);tickTimes.push(afterTick-begin);if(frames.length>1800){frames.shift();renderTimes.shift();tickTimes.shift();}}
    for(let i=0;i<labels.length;i++){const p=view.project(view.labels[i]!.position),label=labels[i]!;label.style.transform=`translate(${p.x}px,${p.y}px)`;label.hidden=!p.visible;}
    if(++frameCount%15===0){const recent=frames.slice(-60),fps=recent.length?recent.length*1000/recent.reduce((a,b)=>a+b,0):0,stats=view.stats(),lead=state.trains[0],report=companyReport(state);element('#fps').textContent=`${Math.round(fps)} FPS · LIVE LANDSCAPE`;element('#stats').textContent=`${stats.calls} draw calls · ${Math.round(stats.triangles/1000)}k triangles\n${stats.trees.toLocaleString()} trees · ${stats.buildings} buildings\n${stats.trains} train / proxies · LOD ${stats.lod}\n${stats.geometries} geometries · ${stats.textures} textures\nTerrain error: ${stats.terrainErrorM.toFixed(6)} m\nTick ${state.tick.toLocaleString()} · Three.js r186`;element('#cash').textContent=money(state.company.cash);element('#date').textContent=`Day ${dayOfYear(state)} · ${currentYear(state)}`;element('#passengers').textContent=`${state.operations.delivered.passengers.toLocaleString()} delivered`;element('#mail').textContent=`${state.operations.delivered.mail.toLocaleString()} delivered`;element('#profit').textContent=report.operatingProfit===0?'No result yet':`${report.operatingProfit>=0?'+':''}${money(report.operatingProfit)}`;element('#service-summary').textContent=lead?`${lead.phase} · ${Math.round(lead.speedMps*3.6)} km/h · ${lead.cargo.reduce((sum,lot)=>sum+lot.quantity,0)} aboard`:'No train commissioned';updateObjectives(state);if(!element('#operations-panel').hidden)renderOperations();if(!element('#context-panel').hidden)renderContext();}
    request=requestAnimationFrame(frame);
  };
  request=requestAnimationFrame(frame);toast('The fjord is ready. Explore the landscape or follow the train.');
  const dispose=()=>{cancelAnimationFrame(request);if(plannerPointerFrame)cancelAnimationFrame(plannerPointerFrame);window.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('click',mapClick);canvas.removeEventListener('mousemove',mapMove);canvas.removeEventListener('contextmenu',mapContext);sessionHost.dispose();void store.close();};
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  if(import.meta.env.DEV||import.meta.env.MODE==='test') {
    const resetMetrics=()=>{frames.length=0;renderTimes.length=0;tickTimes.length=0;},probe={ready:true,assets:view.assets,snapshot:()=>structuredClone(state),save,load,setSpeed,stats:()=>view.stats(),focusTrain:()=>view.followTrain(),vehicleInspection:(inspection:'front'|'left'|'right'|'roof',assetId?:string)=>view.setVehicleInspection(inspection,assetId),regional:()=>view.regional(),cameraPreset:(id:string)=>view.setCameraPreset(id),cameraSweep:(progress:number)=>view.setCameraSweep(progress),setTerrainBlockout:(enabled:boolean)=>view.setTerrainBlockout(enabled),project:(position:Vec3)=>view.project(position,0),setStress:(enabled:boolean)=>{view.setStress(structuredClone(state) as GameState,enabled);resetMetrics();},resetMetrics,metrics:()=>({frames:[...frames],renderMs:[...renderTimes],tickMs:[...tickTimes],...view.stats(),userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}),pick:(x:number,y:number)=>view.pick(x,y),dispose};
    Object.defineProperty(window,'__railProbe',{value:probe,configurable:true});
  }
}
const money=(amount:number)=>new Intl.NumberFormat('en',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(amount/100);
const formatDate=(value:string)=>{const date=new Date(value);return Number.isNaN(date.valueOf())?'Unknown date':new Intl.DateTimeFormat('en',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);};
const formatBytes=(value:number)=>value<1_000_000?`${Math.round(value/1000)} KB`:`${(value/1_000_000).toFixed(1)} MB`;
function updateObjectives(state:Readonly<GameState>):void {
  const values:{id:string;value:number;target:number}[]=[
    {id:'first-connection',value:state.objectiveProgress['first-connection']??0,target:2},
    {id:'first-passengers',value:state.objectiveProgress['first-passengers']??0,target:200},
    {id:'profitable-railway',value:state.objectiveProgress['profitable-railway']??0,target:1_000_000}
  ];
  element('#objective-connection').textContent=`${Math.min(values[0]!.value,2)} / 2`;
  element('#objective-passengers').textContent=`${Math.min(values[1]!.value,200).toLocaleString()} / 200`;
  element('#objective-profit').textContent=`${money(Math.min(values[2]!.value,1_000_000))} / ${money(1_000_000)}`;
  const completed=new Set(state.operations.completedObjectives);for(const objective of values)element(`[data-objective="${objective.id}"]`).classList.toggle('complete',completed.has(objective.id));
  element('#objective-count').textContent=`${values.filter(objective=>completed.has(objective.id)).length} / ${values.length}`;
}
function message(error:unknown):string {return error instanceof Error?error.message:String(error);}
void start().catch(error=>{console.error(error);element('#toast').classList.add('visible','error');element('#toast').textContent=`The study could not start: ${message(error)}`;element('#fps').textContent='STARTUP FAILED';});
