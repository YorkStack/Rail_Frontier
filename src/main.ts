import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/libre-caslon-display/latin-400.css';
import './ui/study.css';
import { createStudyState,studyCurve } from '../spikes/study-state.js';
import { generateFjordStudy } from './world/fjord-study.js';
import { FjordRenderer } from '../spikes/fjord-renderer.js';
import type { GameState,Speed } from './domain/model.js';
import { IndexedDbSaveStore } from './persistence/indexeddb.js';
import { compileCurve } from './rail/geometry.js';
import { quoteTrack } from './rail/planner.js';
import { certifyCurve } from './rail/constraints.js';
import { RailFrontierGame } from './application/game.js';
import { GameSaveManager } from './application/saves.js';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
  <canvas id="world" aria-label="Norwegian fjord landscape. Drag to orbit, right drag to pan, scroll to zoom." tabindex="0"></canvas>
  <div class="vignette" aria-hidden="true"></div>
  <header class="masthead">
    <a class="brand" href="/" aria-label="Rail Frontier home"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 4v32M27 4v32M9 11h22M9 20h22M9 29h22"/></svg><span>RAIL <b>FRONTIER</b><small>THE NORTHERN LINE</small></span></a>
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
  <div id="map-labels" aria-hidden="true"></div>
  <section id="planner" class="floating-panel" hidden aria-label="Alignment study">
    <div class="panel-title"><span class="eyebrow">ALIGNMENT STUDY</span><button id="close-planner" class="square" aria-label="Close alignment study">×</button></div>
    <h2>Read the landscape.</h2><p>Compare an elevated crossing with a cut through the mountain.</p>
    <label for="alignment">Corridor<select id="alignment"><option value="bridge">Fjord inlet crossing</option><option value="tunnel">Mountain spur</option><option value="coast">Coastal shelf</option></select></label>
    <label for="elevation">Track elevation <output id="elevation-value">15 m</output></label><input id="elevation" type="range" min="-5" max="115" step="1" value="15">
    <div class="quote-grid"><span>Length<strong id="quote-length"></strong></span><span>Estimated cost<strong id="quote-cost"></strong></span></div>
    <p id="quote-kind"></p><p id="quote-valid" role="status"></p>
    <button id="commit-track" class="commit-button">Build this alignment</button><small class="disclosure">The live quote is recalculated before funds are committed.</small>
  </section>
  <section id="diagnostics" class="floating-panel diagnostics" hidden aria-label="Technical diagnostics">
    <p class="eyebrow">TECHNICAL OBSERVATIONS</p><h2>Behind the landscape.</h2><pre id="stats"></pre>
    <label class="check"><input id="stress" type="checkbox"> Scale test: 20,000 trees / 100 proxies</label>
    <label class="check"><input id="trees" type="checkbox" checked> Show woodland</label>
    <p class="disclosure">The scale test includes 2,000 buildings and 5,000 strategic rail segments. It measures rendering, not a complete economy.</p>
  </section>
  <footer class="control-deck">
    <div class="camera-tools"><button id="regional" class="icon-button" title="Regional view (R)"><span>⌖</span>Regional view</button><button id="follow" class="icon-button" title="Follow train (F)"><span>▰</span>Follow train</button><button id="plan" class="icon-button" aria-expanded="false"><span>⌁</span>Survey track</button></div>
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
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button=>button.onclick=()=>setSpeed(Number(button.dataset.speed) as Speed));
  element('#regional').onclick=()=>view.regional();element('#follow').onclick=()=>{view.followTrain();toast('Following the Fjord Corridor passenger service.');};
  document.querySelectorAll<HTMLButtonElement>('[data-town]').forEach(button=>button.onclick=()=>view.focus(state.towns[Number(button.dataset.town)]!.position));
  element('#details').onclick=()=>{const panel=element('#diagnostics');panel.hidden=!panel.hidden;element('#details').setAttribute('aria-expanded',String(!panel.hidden));};
  element<HTMLInputElement>('#stress').onchange=event=>{view.setStress(structuredClone(state) as GameState,(event.target as HTMLInputElement).checked);view.regional();frames.length=0;};
  element<HTMLInputElement>('#trees').onchange=event=>view.setTrees((event.target as HTMLInputElement).checked);
  let preview:{curve:ReturnType<typeof studyCurve>;cost:number;valid:boolean}|null=null;
  const updatePlanner=()=>{
    const mode=element<HTMLSelectElement>('#alignment').value,height=Number(element<HTMLInputElement>('#elevation').value);
    const [start,end]=mode==='bridge'?[1480,1790]:mode==='tunnel'?[2290,2650]:[970,1240];
    const curve=studyCurve(start!,end!),offset=mode==='bridge'?-220:220;for(const p of [curve.p0,curve.p1,curve.p2,curve.p3]){p.x+=offset;p.y=height;}
    const geometry=compileCurve(curve),quote=quoteTrack(geometry,terrain),constraints=certifyCurve(curve),valid=quote.valid&&constraints.valid;
    preview={curve,cost:quote.cost,valid};
    view.setPreview(geometry,valid?'#edc879':'#d7795f');
    element('#elevation-value').textContent=`${height} m`;element('#quote-length').textContent=`${Math.round(geometry.lengthM)} m`;element('#quote-cost').textContent=new Intl.NumberFormat('en',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(quote.cost/100);
    const lengths={ground:0,bridge:0,tunnel:0};for(const span of quote.intervals)lengths[span.kind]+=span.endM-span.startM;
    element('#quote-kind').textContent=Object.entries(lengths).filter(([,length])=>length>1).map(([kind,length])=>`${Math.round(length)} m ${kind}`).join(' · ');
    element('#quote-valid').textContent=valid?'✓ Feasible survey alignment':[...quote.reasons,...constraints.reasons].join(' · ');element('#quote-valid').classList.toggle('invalid',!valid);
  };
  const togglePlanner=(open:boolean)=>{element('#planner').hidden=!open;element('#plan').setAttribute('aria-expanded',String(open));if(open)updatePlanner();else view.setPreview(null);};
  element('#plan').onclick=()=>togglePlanner(element('#planner').hidden!==false);element('#close-planner').onclick=()=>togglePlanner(false);
  element('#alignment').onchange=()=>{updatePlanner();const mode=element<HTMLSelectElement>('#alignment').value;view.focus(studyCurve(mode==='tunnel'?2350:1500,mode==='tunnel'?2600:1750).p1);};
  element('#elevation').oninput=updatePlanner;
  element('#commit-track').onclick=()=>{if(!preview?.valid){toast('This alignment is not buildable.');return;}const result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'buildTrack',curve:preview.curve,from:{position:preview.curve.p0},to:{position:preview.curve.p3},expectedRevision:state.railway.revision,quotedCost:preview.cost}});state=game.snapshot();if(result.ok){toast(`Alignment built for ${money(preview.cost)}.`);togglePlanner(false);}else toast(result.reason);};
  const save=async()=>{state=game.snapshot();await saves.save('study','Norwegian Fjords company');return state.tick;};
  const load=async()=>{state=await saves.load('study');syncSpeed();return state.tick;};
  element('#save').onclick=()=>{void save().then(tick=>toast(`Study saved at tick ${tick.toLocaleString()}.`)).catch(error=>toast(`Could not save: ${message(error)}`));};
  element('#load').onclick=()=>{void load().then(tick=>toast(`Study resumed at tick ${tick.toLocaleString()}.`)).catch(error=>toast(`Could not load: ${message(error)}`));};
  const keydown=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;if(event.code==='Space'){event.preventDefault();setSpeed(game.speed===0?1:0);}if(event.code==='KeyR')view.regional();if(event.code==='KeyF')view.followTrain();if(event.code==='Escape')togglePlanner(false);};
  window.addEventListener('keydown',keydown);
  let last=performance.now(),request=0,frameCount=0,lastAutosaveDay=Math.floor(state.tick/1200);const frames:number[]=[],renderTimes:number[]=[],tickTimes:number[]=[];
  const visibility=()=>{last=performance.now();if(document.hidden){game.pauseForVisibility();syncSpeed();toast('Study paused while this tab is in the background.');}};
  document.addEventListener('visibilitychange',visibility);
  const frame=(now:number)=>{
    const delta=Math.max(0,(now-last)/1000);last=now;
    const begin=performance.now(),result=game.advance(delta),afterTick=performance.now();state=result.current;view.update(result.previous,result.current,game.speed===0?1:result.alpha);const day=Math.floor(state.tick/1200);if(day>lastAutosaveDay){lastAutosaveDay=day;void saves.autosave().catch(error=>toast(`Autosave failed: ${message(error)}`));}
    if(delta>0&&!document.hidden){frames.push(delta*1000);renderTimes.push(performance.now()-afterTick);tickTimes.push(afterTick-begin);if(frames.length>1800){frames.shift();renderTimes.shift();tickTimes.shift();}}
    for(let i=0;i<labels.length;i++){const p=view.project(view.labels[i]!.position),label=labels[i]!;label.style.transform=`translate(${p.x}px,${p.y}px)`;label.hidden=!p.visible;}
    if(++frameCount%15===0){const recent=frames.slice(-60),fps=recent.length?recent.length*1000/recent.reduce((a,b)=>a+b,0):0,stats=view.stats(),service=state.operations.trainServices['train:15'];element('#fps').textContent=`${Math.round(fps)} FPS · LIVE LANDSCAPE`;element('#stats').textContent=`${stats.calls} draw calls · ${Math.round(stats.triangles/1000)}k triangles\n${stats.trees.toLocaleString()} trees · ${stats.buildings} buildings\n${stats.trains} train / proxies · LOD ${stats.lod}\n${stats.geometries} geometries · ${stats.textures} textures\nTerrain error: ${stats.terrainErrorM.toFixed(6)} m\nTick ${state.tick.toLocaleString()} · Three.js r186`;element('#cash').textContent=money(state.company.cash);element('#date').textContent=`Day ${Math.floor(state.tick/1200)+1} · 1900`;element('#passengers').textContent=`${state.operations.delivered.passengers.toLocaleString()} delivered`;const profit=(service?.revenue??0)-(service?.operatingCosts??0);element('#profit').textContent=profit===0?'No result yet':`${profit>=0?'+':''}${money(profit)}`;element('#service-summary').textContent=`${state.trains[0]!.phase} · ${Math.round(state.trains[0]!.speedMps*3.6)} km/h · ${state.trains[0]!.cargo.reduce((sum,lot)=>sum+lot.quantity,0)} aboard`;}request=requestAnimationFrame(frame);
  };
  request=requestAnimationFrame(frame);toast('The fjord is ready. Explore the landscape or follow the train.');
  const dispose=()=>{cancelAnimationFrame(request);window.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',visibility);view.dispose();void store.close();};
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  if(import.meta.env.DEV) {
    const probe={ready:true,assets:view.assets,snapshot:()=>structuredClone(state),save,load,setSpeed,stats:()=>view.stats(),focusTrain:()=>view.followTrain(),regional:()=>view.regional(),setStress:(enabled:boolean)=>{view.setStress(structuredClone(state) as GameState,enabled);frames.length=0;renderTimes.length=0;tickTimes.length=0;},metrics:()=>({frames:[...frames],renderMs:[...renderTimes],tickMs:[...tickTimes],...view.stats(),userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}),pick:(x:number,y:number)=>view.pick(x,y),dispose};
    Object.defineProperty(window,'__railProbe',{value:probe,configurable:true});
  }
}
const money=(amount:number)=>new Intl.NumberFormat('en',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(amount/100);
function message(error:unknown):string {return error instanceof Error?error.message:String(error);}
void start().catch(error=>{console.error(error);element('#toast').classList.add('visible','error');element('#toast').textContent=`The study could not start: ${message(error)}`;element('#fps').textContent='STARTUP FAILED';});
