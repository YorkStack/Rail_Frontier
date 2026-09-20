import type {Vec3} from '../domain/model.js';
import {horizontalDistance,simplifyWishPath} from '../rail/wish-path.js';

export interface RouteDraft {points:Vec3[];complete:boolean}
interface Adapter {
  canvas:HTMLCanvasElement;overlay:HTMLElement;enabled:()=>boolean;
  pick:(x:number,y:number)=>Vec3|null;surface:(x:number,z:number)=>number;project:(p:Vec3)=>{x:number;y:number;visible:boolean};
  ports:()=>Vec3[];proposal:()=>{points:Vec3[];kind:string}[];pan:(active:boolean)=>void;lock:(value:boolean)=>void;
  changed:(draft:RouteDraft,busy:boolean)=>void;notice:(de:string,en:string)=>void;
}
/** One owner for drawing gestures; camera events never also add track points. */
export class RoutePlannerController {
  draft:RouteDraft={points:[],complete:false};mode:'draw'|'points'='draw';
  private history:RouteDraft[]=[];private future:RouteDraft[]=[];
  private gesture:{id:number;before:RouteDraft;index:number|null;lastX:number;lastY:number}|null=null;
  private frame=0;private space=false;private selected=-1;
  constructor(private readonly a:Adapter){
    window.addEventListener('pointerdown',this.down,true);window.addEventListener('pointermove',this.move,true);window.addEventListener('pointerup',this.up,true);window.addEventListener('pointercancel',this.cancelEvent,true);window.addEventListener('blur',this.blur);window.addEventListener('keydown',this.key,true);window.addEventListener('keyup',this.keyUp,true);
    a.canvas.addEventListener('click',this.click,true);a.canvas.addEventListener('wheel',this.wheel,{capture:true,passive:false});this.frame=requestAnimationFrame(this.paint);
  }
  get canUndo(){return this.history.length>0;}get canRedo(){return this.future.length>0;}get busy(){return this.gesture!==null;}
  private emit(busy=false){this.a.changed(structuredClone(this.draft),busy);}
  private save(before:RouteDraft){this.history.push(before);if(this.history.length>30)this.history.shift();this.future=[];}
  clear(){this.cancel();if(this.draft.points.length)this.save(structuredClone(this.draft));this.draft={points:[],complete:false};this.emit();}
  reset(){this.cancel();this.history=[];this.future=[];this.draft={points:[],complete:false};this.selected=-1;}
  undo(){this.cancel();const previous=this.history.pop();if(previous){this.future.push(structuredClone(this.draft));this.draft=previous;this.emit();}}
  redo(){this.cancel();const next=this.future.pop();if(next){this.history.push(structuredClone(this.draft));this.draft=next;this.emit();}}
  private editableMidpoint(){if(this.draft.complete&&this.draft.points.length===2){const [a,b]=this.draft.points as [Vec3,Vec3],x=(a.x+b.x)/2,z=(a.z+b.z)/2;this.draft.points.splice(1,0,{x,z,y:this.a.surface(x,z)});}}
  connect(point:Vec3){if(this.draft.complete)return;const before=structuredClone(this.draft);if(!this.draft.points.length)this.draft.points.push({...point});else if(horizontalDistance(point,this.draft.points[0]!)>10){this.draft.points.push({...point});this.draft.complete=true;}else return;this.editableMidpoint();this.save(before);this.emit();}
  private snap(x:number,y:number):Vec3|null {let best:Vec3|null=null,distance=26;for(const point of this.a.ports()){const screen=this.a.project(point),d=Math.hypot(screen.x-x,screen.y-y);if(screen.visible&&d<distance){best=point;distance=d;}}return best?{...best}:null;}
  private stop(e:Event){e.preventDefault();e.stopImmediatePropagation();}
  private down=(e:PointerEvent)=>{
    if(!this.a.enabled()||e.button!==0||(!(e.target instanceof Element))||(e.target!==this.a.canvas&&!e.target.closest('[data-route-handle], [data-route-port]')))return;
    if(e.altKey||this.space){this.a.pan(this.space);return;}
    this.stop(e);if(this.gesture){this.cancel();return;}
    const index=e.target.closest<HTMLElement>('[data-route-handle]')?.dataset.routeHandle;
    if(this.draft.complete&&index===undefined)return;
    this.a.lock(true);const point=this.a.pick(e.clientX,e.clientY),port=this.snap(e.clientX,e.clientY),before=structuredClone(this.draft);
    if(index!==undefined){this.selected=Number(index);this.gesture={id:e.pointerId,before,index:this.selected,lastX:e.clientX,lastY:e.clientY};}
    else if(!this.draft.points.length){if(!port){this.a.lock(false);this.a.notice('Beginne an einem hellen Bahnanschluss.','Start at a highlighted rail connection.');return;}this.draft.points.push(port);this.gesture={id:e.pointerId,before,index:null,lastX:e.clientX,lastY:e.clientY};}
    else if(port&&horizontalDistance(port,this.draft.points[0]!)>10){this.draft.points.push(port);this.draft.complete=true;this.editableMidpoint();this.save(before);this.a.lock(false);this.emit();return;}
    else if(this.mode==='points'&&point){this.draft.points.push(point);this.save(before);this.a.lock(false);this.emit();return;}
    else {const tip=this.a.project(this.draft.points.at(-1)!);if(Math.hypot(tip.x-e.clientX,tip.y-e.clientY)>40){this.a.lock(false);this.a.notice('Zeichne an der hellen Spitze weiter. Zum Verschieben rechts ziehen.','Continue drawing at the highlighted tip. Right-drag to pan.');return;}this.gesture={id:e.pointerId,before,index:null,lastX:e.clientX,lastY:e.clientY};}
    this.a.canvas.setPointerCapture(e.pointerId);this.emit(true);
  };
  private move=(e:PointerEvent)=>{
    const g=this.gesture;if(!g||e.pointerId!==g.id)return;this.stop(e);
    if(Math.hypot(e.clientX-g.lastX,e.clientY-g.lastY)<4)return;
    const p=this.a.pick(e.clientX,e.clientY);if(!p){this.cancel();this.a.notice('Strich abgebrochen: außerhalb des Geländes.','Stroke cancelled: outside the terrain.');return;}
    g.lastX=e.clientX;g.lastY=e.clientY;
    if(g.index!==null)this.draft.points[g.index]=p;
    else if(this.mode==='draw'&&this.draft.points.length<2048&&horizontalDistance(p,this.draft.points.at(-1)!)>3)this.draft.points.push(p);
    this.emit(true);
  };
  private up=(e:PointerEvent)=>{const g=this.gesture;if(!g||e.pointerId!==g.id)return;this.stop(e);const port=this.snap(e.clientX,e.clientY);
    if(g.index===null&&port&&horizontalDistance(port,this.draft.points[0]!)>10){if(this.draft.points.length>1&&horizontalDistance(this.draft.points.at(-1)!,port)<35)this.draft.points.pop();this.draft.points.push(port);this.draft.complete=true;}
    this.draft.points=simplifyWishPath(this.draft.points,8);this.editableMidpoint();
    if(this.draft.points.length>64){this.draft=g.before;this.a.notice('Zu viele Kurven. Zeichne einen einfacheren Verlauf.','Too many bends. Draw a simpler route.');}else this.save(g.before);
    this.release();this.emit();
  };
  private release(){if(this.gesture&&this.a.canvas.hasPointerCapture(this.gesture.id))this.a.canvas.releasePointerCapture(this.gesture.id);this.gesture=null;this.a.lock(false);}
  cancel(){if(!this.gesture)return;this.draft=this.gesture.before;this.release();this.emit();}
  private cancelEvent=()=>this.cancel();private blur=()=>{this.space=false;this.a.pan(false);this.cancel();};
  private click=(e:MouseEvent)=>{if(this.a.enabled())this.stop(e);};
  private wheel=(e:WheelEvent)=>{if(this.gesture)this.stop(e);};
  private key=(e:KeyboardEvent)=>{if(!this.a.enabled()||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement)return;
    if(e.code==='Space'&&e.target===this.a.canvas){this.space=true;this.stop(e);return;}
    if(e.code==='Escape'&&this.gesture){this.stop(e);this.cancel();return;}
    if((e.metaKey||e.ctrlKey)&&e.code==='KeyZ'){this.stop(e);e.shiftKey?this.redo():this.undo();return;}
    const target=e.target instanceof HTMLElement?e.target.closest<HTMLElement>('[data-route-handle]'):null;if(!target)return;const index=Number(target.dataset.routeHandle),point=this.draft.points[index];if(!point)return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Delete','Backspace'].includes(e.key)){this.stop(e);this.save(structuredClone(this.draft));if(e.key==='Delete'||e.key==='Backspace')this.draft.points.splice(index,1);else{const step=e.shiftKey?25:5;point.x+=(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0);point.z+=(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0);}this.emit();}
  };
  private keyUp=(e:KeyboardEvent)=>{if(e.code==='Space'){this.space=false;this.a.pan(false);}};
  private paint=()=>{
    const root=this.a.overlay;root.hidden=!this.a.enabled();
    if(!root.hidden){const screens=this.draft.points.map(p=>this.a.project(p));let svg=root.querySelector<SVGSVGElement>('svg');if(!svg){root.innerHTML='<svg aria-hidden="true"><path /><g class="route-proposal"></g></svg><div class="route-grips"></div><div class="route-connections"></div>';svg=root.querySelector('svg')!;}
      svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);svg.querySelector('path')!.setAttribute('d',screens.map((p,i)=>`${i&&screens[i-1]!.visible&&p.visible?'L':'M'}${p.x},${p.y}`).join(' '));
      const proposal=svg.querySelector('.route-proposal')!,lines=this.a.proposal();while(proposal.children.length>lines.length)proposal.lastElementChild!.remove();while(proposal.children.length<lines.length)proposal.append(document.createElementNS('http://www.w3.org/2000/svg','path'));[...proposal.children].forEach((path,i)=>{const line=lines[i]!,ps=line.points.map(p=>this.a.project(p));path.setAttribute('d',ps.map((p,j)=>`${j&&ps[j-1]!.visible&&p.visible?'L':'M'}${p.x},${p.y}`).join(' '));path.setAttribute('class',line.kind);});
      const ports=this.a.ports(),connections=root.querySelector<HTMLElement>('.route-connections')!;while(connections.children.length>ports.length)connections.lastElementChild!.remove();while(connections.children.length<ports.length){const button=document.createElement('button');button.type='button';button.className='route-port';connections.append(button);}[...connections.children].forEach((node,i)=>{const button=node as HTMLButtonElement,point=ports[i]!,screen=this.a.project(point);button.dataset.routePort=String(i);button.setAttribute('aria-label',`Rail connection ${i+1}`);button.hidden=!screen.visible||this.draft.complete;button.style.transform=`translate(${screen.x-22}px,${screen.y-22}px)`;button.onclick=e=>{if(e.detail===0)this.connect(point);};});
      const grips=root.querySelector<HTMLElement>('.route-grips')!,count=Math.max(0,screens.length-1-(this.draft.complete?1:0));while(grips.children.length>count)grips.lastElementChild!.remove();while(grips.children.length<count){const button=document.createElement('button');button.type='button';button.className='route-handle';button.textContent='';grips.append(button);}
      [...grips.children].forEach((el,i)=>{const button=el as HTMLButtonElement,p=screens[i+1]!;button.dataset.routeHandle=String(i+1);button.setAttribute('aria-label',`Route point ${i+1}, drag or use arrow keys`);button.hidden=!p.visible;button.style.transform=`translate(${p.x-22}px,${p.y-22}px)`;});
    }this.frame=requestAnimationFrame(this.paint);
  };
  dispose(){this.release();cancelAnimationFrame(this.frame);window.removeEventListener('pointerdown',this.down,true);window.removeEventListener('pointermove',this.move,true);window.removeEventListener('pointerup',this.up,true);window.removeEventListener('pointercancel',this.cancelEvent,true);window.removeEventListener('blur',this.blur);window.removeEventListener('keydown',this.key,true);window.removeEventListener('keyup',this.keyUp,true);this.a.canvas.removeEventListener('click',this.click,true);this.a.canvas.removeEventListener('wheel',this.wheel,true);this.a.overlay.replaceChildren();}
}
