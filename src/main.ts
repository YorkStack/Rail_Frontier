import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/libre-caslon-display/latin-400.css';
import './ui/study.css';
import { createStudyState,studyCurve } from '../spikes/study-state.js';
import { generateFjordStudy } from './world/fjord-study.js';
import { FjordRenderer } from '../spikes/fjord-renderer.js';
import type { GameState,Speed,Vec3 } from './domain/model.js';
import { IndexedDbSaveStore } from './persistence/indexeddb.js';
import { compileCurve } from './rail/geometry.js';
import { quoteTrack } from './rail/planner.js';
import { certifyCurve } from './rail/constraints.js';
import { RailFrontierGame } from './application/game.js';
import { GameSaveManager } from './application/saves.js';
import { stationDefinition } from './content/stations.js';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
  <canvas id="world" aria-label="Norwegian fjord landscape. Drag to orbit, right drag to pan, scroll to zoom." tabindex="0"></canvas>
  <div class="vignette" aria-hidden="true"></div>
  <section id="main-menu" class="main-menu" aria-label="Main menu">
    <div class="menu-sidebar">
      <div class="menu-brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 4v32M27 4v32M9 11h22M9 20h22M9 29h22"/></svg><span>RAIL <b>FRONTIER</b><small>THE NORTHERN LINE</small></span></div>
      <p class="menu-edition">NORWAY · 1900</p>
      <nav aria-label="Main menu sections">
        <button data-menu-view="campaign" aria-current="page"><span>01</span>Campaign</button>
        <button data-menu-view="saves"><span>02</span>Load game</button>
        <button data-menu-view="settings"><span>03</span>Settings</button>
        <button data-menu-view="credits"><span>04</span>Credits</button>
      </nav>
      <p class="menu-version">EARLY OPERATIONS · BUILD 0.2</p>
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
        <div class="menu-actions"><button id="new-game" class="primary-action">Start new company <b>→</b></button><button id="continue-game">Continue latest</button></div>
      </article>
      <article id="menu-saves" class="menu-view" hidden>
        <p class="eyebrow">COMPANY ARCHIVE</p><h2>Saved companies</h2><p class="menu-lede">Resume a railway exactly where its operations stopped.</p>
        <form id="new-save-slot" class="new-save-slot"><label for="save-name">New manual save</label><div><input id="save-name" maxlength="48" required><button>Save current company</button></div></form>
        <div id="save-slots" class="save-slots" aria-live="polite"></div><p id="save-error" class="menu-error" role="status"></p>
      </article>
      <article id="menu-settings" class="menu-view" hidden>
        <p class="eyebrow">FIELD SETTINGS</p><h2>Landscape & motion</h2><p class="menu-lede">Tune the survey view for this device.</p>
        <label class="setting-row"><span>Woodland<small>Show instanced trees across the fjord.</small></span><input id="trees-setting" type="checkbox" checked></label>
        <div class="setting-row"><span>Reduced motion<small>Follows your operating-system preference.</small></span><output id="motion-setting">Off</output></div>
        <div class="setting-row"><span>Camera controls<small>Drag to orbit · right drag to pan · scroll to zoom.</small></span><output>Active</output></div>
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
    <div class="session-tools"><button id="save" aria-label="Save study">Save game</button><button id="load" aria-label="Load study">Load game</button><button id="details" class="square" aria-label="Toggle technical diagnostics" aria-expanded="false">⌘</button></div>
  </header>
  <aside class="field-notes">
    <p class="eyebrow">60° NORTH · A NEW BEGINNING</p>
    <h1>Between the<br>mountains<br><em>and the sea.</em></h1>
    <p class="intro">A railway along the edge of the fjord.<br>Survey the land. Follow the first train.</p>
    <div class="rule"></div>
    <p class="eyebrow route-heading">THE FJORD CORRIDOR <span>2.0 KM</span></p>
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
  <div id="map-labels" aria-hidden="true"></div>
  <section id="planner" class="floating-panel" hidden aria-label="Alignment study">
    <div class="panel-title"><span class="eyebrow">ALIGNMENT STUDY</span><button id="close-planner" class="square" aria-label="Close alignment study">×</button></div>
    <h2>Read the landscape.</h2><p id="planner-copy">Compare an elevated crossing with a cut through the mountain.</p>
    <label for="alignment">Corridor<select id="alignment"><option value="bridge">Fjord inlet crossing</option><option value="tunnel">Mountain spur</option><option value="coast">Coastal shelf</option><option value="free">Choose two points on the map</option></select></label>
    <div id="elevation-controls"><label for="elevation">Track elevation <output id="elevation-value">15 m</output></label><input id="elevation" type="range" min="-5" max="115" step="1" value="15"></div>
    <div class="quote-grid"><span>Length<strong id="quote-length"></strong></span><span>Estimated cost<strong id="quote-cost"></strong></span></div>
    <p id="quote-kind"></p><p id="quote-valid" role="status"></p>
    <button id="commit-track" class="commit-button">Build this alignment</button><small class="disclosure">The live quote is recalculated before funds are committed.</small>
  </section>
  <section id="station-planner" class="floating-panel" hidden aria-label="Station placement">
    <div class="panel-title"><span class="eyebrow">STATION SURVEY</span><button id="close-station" class="square" aria-label="Close station placement">×</button></div>
    <h2>Place a stopping point.</h2><p>Choose a rail node on ground-level track. The closest settlement inside the coverage area will be served.</p>
    <label for="station-class">Station class<select id="station-class"><option value="rural-halt">Rural halt · NOK 25,000</option><option value="town-station">Town station · NOK 75,000</option></select></label>
    <div id="station-selection" class="station-selection"><strong>No rail node selected</strong><span>Click close to a track endpoint on the map.</span></div>
    <p id="station-valid" role="status">Select a rail node to continue.</p><button id="commit-station" class="commit-button" disabled>Build station</button>
  </section>
  <section id="diagnostics" class="floating-panel diagnostics" hidden aria-label="Technical diagnostics">
    <p class="eyebrow">TECHNICAL OBSERVATIONS</p><h2>Behind the landscape.</h2><pre id="stats"></pre>
    <label class="check"><input id="stress" type="checkbox"> Scale test: 20,000 trees / 100 proxies</label>
    <label class="check"><input id="trees" type="checkbox" checked> Show woodland</label>
    <p class="disclosure">The scale test includes 2,000 buildings and 5,000 strategic rail segments. It measures rendering, not a complete economy.</p>
  </section>
  <footer class="control-deck">
    <div class="camera-tools"><button id="regional" class="icon-button" title="Regional view (R)"><span>⌖</span>Regional view</button><button id="follow" class="icon-button" title="Follow train (F)"><span>▰</span>Follow train</button><button id="plan" class="icon-button" aria-expanded="false"><span>⌁</span>Survey track</button><button id="place-station" class="icon-button" aria-expanded="false"><span>⌑</span>Place station</button></div>
    <div class="time-control"><span id="run-state">RUNNING</span><div class="speeds" role="group" aria-label="Simulation speed"><button data-speed="0" aria-label="Pause" aria-pressed="false">Ⅱ</button><button data-speed="1" aria-pressed="true">1×</button><button data-speed="2" aria-pressed="false">2×</button><button data-speed="4" aria-pressed="false">4×</button><button data-speed="8" aria-pressed="false">8×</button></div></div>
  </footer>
  <aside class="company-strip" aria-label="Company status"><span>Cash<strong id="cash">—</strong></span><span>Date<strong id="date">—</strong></span><span>Passengers<strong id="passengers">0 delivered</strong></span><span>Route result<strong id="profit">No result yet</strong></span></aside>
  <div class="world-caption"><span>NORWEGIAN FJORDS</span><span>Drag to orbit · Right drag to pan · Scroll to explore</span><span id="fps">Preparing landscape…</span></div>
  <div id="toast" role="status" aria-live="polite">Preparing the northern line…</div>
`;
const element=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const toast=(message:string)=>{element('#toast').textContent=message;element('#toast').classList.add('visible');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>element('#toast').classList.remove('visible'),4200);};
let toastTimer=0;
async function start():Promise<void> {
  const initial=createStudyState(),terrain=generateFjordStudy(initial.world.seed),game=new RailFrontierGame(initial,terrain),view=new FjordRenderer(element<HTMLCanvasElement>('#world'),terrain,initial),store=new IndexedDbSaveStore(),saves=new GameSaveManager(game,store,{campaignId:initial.campaignId,campaignVersion:initial.campaignVersion,worldGeneratorVersion:initial.world.generatorVersion});let state=game.snapshot();
  try {await view.loadAssets();}catch(error){view.dispose();await store.close();throw error;}
  const labels=view.labels.map(label=>{const node=document.createElement('span');node.className='map-label';node.textContent=label.name;element('#map-labels').append(node);return node;});
  const syncSpeed=()=>{document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.speed)===game.speed)));element('#run-state').textContent=game.speed===0?'PAUSED':'RUNNING';};
  const setSpeed=(value:Speed)=>{const result=game.dispatch({sequence:game.snapshot().operations.lastCommandSequence+1,command:{type:'setSpeed',speed:value}});if(!result.ok){toast(result.reason);return;}state=game.snapshot();syncSpeed();};
  const startsInMenu=!new URLSearchParams(location.search).has('skip-menu');if(startsInMenu)game.pauseForVisibility();element('#main-menu').hidden=!startsInMenu;syncSpeed();
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button=>button.onclick=()=>setSpeed(Number(button.dataset.speed) as Speed));
  element('#regional').onclick=()=>view.regional();element('#follow').onclick=()=>{view.followTrain();toast('Following the Fjord Corridor passenger service.');};
  document.querySelectorAll<HTMLButtonElement>('[data-town]').forEach(button=>button.onclick=()=>view.focus(state.towns[Number(button.dataset.town)]!.position));
  element('#details').onclick=()=>{const panel=element('#diagnostics');panel.hidden=!panel.hidden;element('#details').setAttribute('aria-expanded',String(!panel.hidden));};
  element<HTMLInputElement>('#stress').onchange=event=>{view.setStress(structuredClone(state) as GameState,(event.target as HTMLInputElement).checked);view.regional();frames.length=0;};
  const setTrees=(visible:boolean)=>{view.setTrees(visible);element<HTMLInputElement>('#trees').checked=visible;element<HTMLInputElement>('#trees-setting').checked=visible;};
  element<HTMLInputElement>('#trees').onchange=event=>setTrees((event.target as HTMLInputElement).checked);
  element<HTMLInputElement>('#trees-setting').onchange=event=>setTrees((event.target as HTMLInputElement).checked);
  element('#motion-setting').textContent=matchMedia('(prefers-reduced-motion: reduce)').matches?'On':'Off';
  let preview:{curve:ReturnType<typeof studyCurve>;cost:number;valid:boolean}|null=null,freePoints:Vec3[]=[],stationNodeId:string|null=null,interaction:'none'|'free-track'|'station'='none';
  const updatePlanner=()=>{
    const mode=element<HTMLSelectElement>('#alignment').value,height=Number(element<HTMLInputElement>('#elevation').value);
    element('#elevation-controls').hidden=mode==='free';interaction=mode==='free'?'free-track':'none';
    if(mode==='free'&&freePoints.length<2){preview=null;view.setPreview(null);element('#planner-copy').textContent=freePoints.length===0?'Click the landscape to choose the start of a free alignment.':'Start selected. Click the landscape again to choose its destination.';element('#quote-length').textContent='—';element('#quote-cost').textContent='—';element('#quote-kind').textContent='';element('#quote-valid').textContent='Two map points are required.';element<HTMLButtonElement>('#commit-track').disabled=true;return;}
    let curve:ReturnType<typeof studyCurve>;
    if(mode==='free') {const [a,b]=freePoints,third=(start:number,end:number)=>start+(end-start)/3;curve={p0:{...a!},p1:{x:third(a!.x,b!.x),y:third(a!.y,b!.y),z:third(a!.z,b!.z)},p2:{x:third(b!.x,a!.x),y:third(b!.y,a!.y),z:third(b!.z,a!.z)},p3:{...b!}};element('#planner-copy').textContent='A straight preliminary alignment through the selected terrain.';}
    else {const [start,end]=mode==='bridge'?[1480,1790]:mode==='tunnel'?[2290,2650]:[970,1240];curve=studyCurve(start!,end!);const offset=mode==='bridge'?-220:220;for(const p of [curve.p0,curve.p1,curve.p2,curve.p3]){p.x+=offset;p.y=height;}element('#planner-copy').textContent='Compare an elevated crossing with a cut through the mountain.';}
    const geometry=compileCurve(curve),quote=quoteTrack(geometry,terrain),constraints=certifyCurve(curve),valid=quote.valid&&constraints.valid;
    preview={curve,cost:quote.cost,valid};
    view.setPreview(geometry,valid?'#edc879':'#d7795f');
    element('#elevation-value').textContent=`${height} m`;element('#quote-length').textContent=`${Math.round(geometry.lengthM)} m`;element('#quote-cost').textContent=new Intl.NumberFormat('en',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(quote.cost/100);
    const lengths={ground:0,bridge:0,tunnel:0};for(const span of quote.intervals)lengths[span.kind]+=span.endM-span.startM;
    element('#quote-kind').textContent=Object.entries(lengths).filter(([,length])=>length>1).map(([kind,length])=>`${Math.round(length)} m ${kind}`).join(' · ');
    element('#quote-valid').textContent=valid?'✓ Feasible survey alignment':[...quote.reasons,...constraints.reasons].join(' · ');element('#quote-valid').classList.toggle('invalid',!valid);element<HTMLButtonElement>('#commit-track').disabled=!valid;
  };
  const togglePlanner=(open:boolean)=>{element('#planner').hidden=!open;element('#plan').setAttribute('aria-expanded',String(open));if(open){toggleStation(false);updatePlanner();}else{interaction='none';view.setPreview(null);view.setMarker(null);}};
  element('#plan').onclick=()=>togglePlanner(element('#planner').hidden!==false);element('#close-planner').onclick=()=>togglePlanner(false);
  element('#alignment').onchange=()=>{freePoints=[];view.setMarker(null);updatePlanner();const mode=element<HTMLSelectElement>('#alignment').value;if(mode!=='free')view.focus(studyCurve(mode==='tunnel'?2350:1500,mode==='tunnel'?2600:1750).p1);};
  element('#elevation').oninput=updatePlanner;
  element('#commit-track').onclick=()=>{if(!preview?.valid){toast('This alignment is not buildable.');return;}const result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'buildTrack',curve:preview.curve,from:{position:preview.curve.p0},to:{position:preview.curve.p3},expectedRevision:state.railway.revision,quotedCost:preview.cost}});state=game.snapshot();if(result.ok){toast(`Alignment built for ${money(preview.cost)}.`);togglePlanner(false);}else toast(result.reason);};
  function updateStationSelection():void {
    const status=element('#station-valid'),button=element<HTMLButtonElement>('#commit-station');button.disabled=true;
    if(!stationNodeId){element('#station-selection').innerHTML='<strong>No rail node selected</strong><span>Click close to a track endpoint on the map.</span>';status.textContent='Select a rail node to continue.';return;}
    const node=state.railway.nodes.find(candidate=>candidate.id===stationNodeId);if(!node){stationNodeId=null;updateStationSelection();return;}
    const definition=stationDefinition(element<HTMLSelectElement>('#station-class').value)!,existing=state.stations.some(station=>station.nodeId===node.id),connected=state.railway.edges.some(edge=>edge.from===node.id||edge.to===node.id),ground=terrain.sample(node.position.x,node.position.z).elevationM,town=state.towns.map(item=>({item,distance:Math.hypot(item.position.x-node.position.x,item.position.z-node.position.z)})).sort((a,b)=>a.distance-b.distance)[0];
    element('#station-selection').innerHTML=`<strong>${node.id.replace(':',' ')}</strong><span>${Math.round(node.position.x)} E · ${Math.round(node.position.z)} S${town&&town.distance<=definition.coverageRadiusM?` · Serves ${town.item.name}`:''}</span>`;
    const reason=existing?'A station already occupies this rail node.':!connected?'This rail node is not connected to track.':Math.abs(node.position.y-ground)>6?'The selected track is too far above or below ground.':state.company.cash<definition.purchaseCost?'The company cannot afford this station.':'';status.textContent=reason||`✓ Ready · ${money(definition.purchaseCost)}`;status.classList.toggle('invalid',Boolean(reason));button.disabled=Boolean(reason);
  }
  function toggleStation(open:boolean):void {element('#station-planner').hidden=!open;element('#place-station').setAttribute('aria-expanded',String(open));if(open){element('#planner').hidden=true;element('#plan').setAttribute('aria-expanded','false');view.setPreview(null);interaction='station';updateStationSelection();}else{if(interaction==='station')interaction='none';view.setMarker(null);}}
  element('#place-station').onclick=()=>toggleStation(element('#station-planner').hidden!==false);element('#close-station').onclick=()=>toggleStation(false);element('#station-class').onchange=updateStationSelection;
  element('#commit-station').onclick=()=>{if(!stationNodeId)return;const result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'buildStation',nodeId:stationNodeId as `node:${number}`,classId:element<HTMLSelectElement>('#station-class').value}});state=game.snapshot();if(result.ok){toast(`Station built for ${money(stationDefinition(element<HTMLSelectElement>('#station-class').value)!.purchaseCost)}.`);toggleStation(false);}else{toast(result.reason);updateStationSelection();}};
  const canvas=element<HTMLCanvasElement>('#world'),mapClick=(event:MouseEvent)=>{if(interaction==='none')return;const picked=view.pick(event.clientX,event.clientY);if(!picked){toast('Choose a point on land.');return;}const nearest=state.railway.nodes.map(node=>({node,distance:Math.hypot(node.position.x-picked.x,node.position.z-picked.z)})).sort((a,b)=>a.distance-b.distance)[0];if(interaction==='free-track'){if(freePoints.length>=2)freePoints=[];const selected=nearest&&nearest.distance<=45?nearest.node.position:picked;freePoints.push(structuredClone(selected));view.setMarker(freePoints.length===1?selected:null);updatePlanner();return;}if(!nearest||nearest.distance>90){stationNodeId=null;view.setMarker(picked,'#d7795f');updateStationSelection();element('#station-valid').textContent='No rail node is close enough to that point.';element('#station-valid').classList.add('invalid');return;}stationNodeId=nearest.node.id;view.setMarker(nearest.node.position);updateStationSelection();};canvas.addEventListener('click',mapClick);
  const save=async()=>{state=game.snapshot();await saves.save('study','Norwegian Fjords company');return state.tick;};
  const load=async()=>{state=await saves.load('study');syncSpeed();return state.tick;};
  element('#save').onclick=()=>{void save().then(tick=>toast(`Study saved at tick ${tick.toLocaleString()}.`)).catch(error=>toast(`Could not save: ${message(error)}`));};
  element('#load').onclick=()=>{void load().then(tick=>toast(`Study resumed at tick ${tick.toLocaleString()}.`)).catch(error=>toast(`Could not load: ${message(error)}`));};
  const selectMenuView=(name:string)=>{document.querySelectorAll<HTMLElement>('.menu-view').forEach(view=>view.hidden=view.id!==`menu-${name}`);document.querySelectorAll<HTMLButtonElement>('[data-menu-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.menuView===name?'page':'false'));if(name==='saves')void refreshSaveSlots();};
  const setMenuError=(error:unknown)=>{element('#save-error').textContent=`The archive could not be opened. ${message(error)} Your running company has not been changed.`;};
  const closeMenu=()=>{element('#main-menu').hidden=true;element<HTMLCanvasElement>('#world').focus();};
  const openMenu=()=>{game.pauseForVisibility();syncSpeed();togglePlanner(false);toggleStation(false);element('#main-menu').hidden=false;selectMenuView('campaign');};
  const loadSlot=async(id:string)=>{state=await saves.load(id);syncSpeed();view.regional();closeMenu();toast(`Company resumed at Day ${Math.floor(state.tick/1200)+1}.`);};
  const refreshSaveSlots=async()=>{
    const host=element('#save-slots');host.replaceChildren();element('#save-error').textContent='';
    try {
      const slots=await saves.list(),continueButton=element<HTMLButtonElement>('#continue-game');continueButton.disabled=slots.length===0;
      if(slots.length===0){const empty=document.createElement('div');empty.className='empty-slots';empty.innerHTML='<strong>No saved companies</strong><span>Start a company, then use Save game from the railway view.</span>';host.append(empty);return;}
      for(const slot of slots) {
        const row=document.createElement('div');row.className='save-slot';
        const copy=document.createElement('span'),name=document.createElement('strong'),date=document.createElement('small');name.textContent=slot.name;date.textContent=slot.id==='autosave'?`AUTOSAVE · ${formatDate(slot.modifiedAt)}`:formatDate(slot.modifiedAt);copy.append(name,date);
        const actions=document.createElement('div'),resume=document.createElement('button'),rename=document.createElement('button'),remove=document.createElement('button');resume.textContent='Resume';rename.textContent='Rename';remove.textContent='Delete';actions.append(resume,rename,remove);row.append(copy,actions);host.append(row);
        resume.onclick=()=>{void loadSlot(slot.id).catch(setMenuError);};
        rename.onclick=()=>{const form=document.createElement('form'),input=document.createElement('input'),confirm=document.createElement('button');input.value=slot.name;input.maxLength=48;input.setAttribute('aria-label',`New name for ${slot.name}`);confirm.textContent='Save name';form.append(input,confirm);actions.replaceWith(form);input.focus();input.select();form.onsubmit=event=>{event.preventDefault();void saves.rename(slot.id,input.value).then(refreshSaveSlots).catch(setMenuError);};};
        remove.onclick=()=>{if(remove.dataset.confirm!=='true'){remove.dataset.confirm='true';remove.textContent='Delete?';return;}void saves.remove(slot.id).then(refreshSaveSlots).catch(setMenuError);};
      }
    } catch(error){setMenuError(error);const empty=document.createElement('div');empty.className='empty-slots';empty.innerHTML='<strong>Browser storage is unavailable</strong><span>Private browsing or storage limits may prevent saving on this device.</span>';host.append(empty);}
  };
  document.querySelectorAll<HTMLButtonElement>('[data-menu-view]').forEach(button=>button.onclick=()=>selectMenuView(button.dataset.menuView!));
  element<HTMLInputElement>('#save-name').value=`Northern Line · Day ${Math.floor(state.tick/1200)+1}`;
  element<HTMLFormElement>('#new-save-slot').onsubmit=event=>{event.preventDefault();const input=element<HTMLInputElement>('#save-name'),id=`manual-${Date.now()}`;void saves.save(id,input.value).then(()=>{input.value=`Northern Line · Day ${Math.floor(state.tick/1200)+1}`;toast('A new manual save was added.');return refreshSaveSlots();}).catch(setMenuError);};
  element('#open-menu').onclick=openMenu;element('#close-menu').onclick=closeMenu;
  element('#new-game').onclick=()=>{game.replaceState(createStudyState());state=game.snapshot();setSpeed(1);view.regional();closeMenu();toast('A new company has taken charge of the Northern Line.');};
  element('#continue-game').onclick=()=>{void saves.continueLatest().then(next=>{state=next;syncSpeed();view.regional();closeMenu();toast(`Company resumed at Day ${Math.floor(state.tick/1200)+1}.`);}).catch(setMenuError);};
  void refreshSaveSlots();
  const keydown=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;if(event.code==='Escape'){if(!element('#main-menu').hidden)closeMenu();else if(!element('#station-planner').hidden)toggleStation(false);else togglePlanner(false);return;}if(!element('#main-menu').hidden)return;if(event.code==='Space'){event.preventDefault();setSpeed(game.speed===0?1:0);}if(event.code==='KeyR')view.regional();if(event.code==='KeyF')view.followTrain();};
  window.addEventListener('keydown',keydown);
  let last=performance.now(),request=0,frameCount=0,lastAutosaveDay=Math.floor(state.tick/1200);const frames:number[]=[],renderTimes:number[]=[],tickTimes:number[]=[];
  const visibility=()=>{last=performance.now();if(document.hidden){game.pauseForVisibility();syncSpeed();toast('Study paused while this tab is in the background.');}};
  document.addEventListener('visibilitychange',visibility);
  const frame=(now:number)=>{
    const delta=Math.max(0,(now-last)/1000);last=now;
    const begin=performance.now(),result=game.advance(delta),afterTick=performance.now();state=result.current;view.update(result.previous,result.current,game.speed===0?1:result.alpha);const day=Math.floor(state.tick/1200);if(day>lastAutosaveDay){lastAutosaveDay=day;void saves.autosave().catch(error=>toast(`Autosave failed: ${message(error)}`));}
    if(delta>0&&!document.hidden){frames.push(delta*1000);renderTimes.push(performance.now()-afterTick);tickTimes.push(afterTick-begin);if(frames.length>1800){frames.shift();renderTimes.shift();tickTimes.shift();}}
    for(let i=0;i<labels.length;i++){const p=view.project(view.labels[i]!.position),label=labels[i]!;label.style.transform=`translate(${p.x}px,${p.y}px)`;label.hidden=!p.visible;}
    if(++frameCount%15===0){const recent=frames.slice(-60),fps=recent.length?recent.length*1000/recent.reduce((a,b)=>a+b,0):0,stats=view.stats(),service=state.operations.trainServices['train:15'];element('#fps').textContent=`${Math.round(fps)} FPS · LIVE LANDSCAPE`;element('#stats').textContent=`${stats.calls} draw calls · ${Math.round(stats.triangles/1000)}k triangles\n${stats.trees.toLocaleString()} trees · ${stats.buildings} buildings\n${stats.trains} train / proxies · LOD ${stats.lod}\n${stats.geometries} geometries · ${stats.textures} textures\nTerrain error: ${stats.terrainErrorM.toFixed(6)} m\nTick ${state.tick.toLocaleString()} · Three.js r186`;element('#cash').textContent=money(state.company.cash);element('#date').textContent=`Day ${Math.floor(state.tick/1200)+1} · 1900`;element('#passengers').textContent=`${state.operations.delivered.passengers.toLocaleString()} delivered`;const profit=(service?.revenue??0)-(service?.operatingCosts??0);element('#profit').textContent=profit===0?'No result yet':`${profit>=0?'+':''}${money(profit)}`;element('#service-summary').textContent=`${state.trains[0]!.phase} · ${Math.round(state.trains[0]!.speedMps*3.6)} km/h · ${state.trains[0]!.cargo.reduce((sum,lot)=>sum+lot.quantity,0)} aboard`;updateObjectives(state);}
    request=requestAnimationFrame(frame);
  };
  request=requestAnimationFrame(frame);toast('The fjord is ready. Explore the landscape or follow the train.');
  const dispose=()=>{cancelAnimationFrame(request);window.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('click',mapClick);view.dispose();void store.close();};
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  if(import.meta.env.DEV) {
    const probe={ready:true,assets:view.assets,snapshot:()=>structuredClone(state),save,load,setSpeed,stats:()=>view.stats(),focusTrain:()=>view.followTrain(),regional:()=>view.regional(),project:(position:Vec3)=>view.project(position),setStress:(enabled:boolean)=>{view.setStress(structuredClone(state) as GameState,enabled);frames.length=0;renderTimes.length=0;tickTimes.length=0;},metrics:()=>({frames:[...frames],renderMs:[...renderTimes],tickMs:[...tickTimes],...view.stats(),userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}),pick:(x:number,y:number)=>view.pick(x,y),dispose};
    Object.defineProperty(window,'__railProbe',{value:probe,configurable:true});
  }
}
const money=(amount:number)=>new Intl.NumberFormat('en',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(amount/100);
const formatDate=(value:string)=>{const date=new Date(value);return Number.isNaN(date.valueOf())?'Unknown date':new Intl.DateTimeFormat('en',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);};
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
