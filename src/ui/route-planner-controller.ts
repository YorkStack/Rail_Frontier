import { setAttribute, setText, setHtml } from '../i18n/dom.js';
import {RouteDraftHistory,emptyRouteDraft,type RouteDraft,type PlanningDraft} from '../rail/planning-draft.js';
import type {CubicCurve} from '../domain/model.js';
import type { Vec3 } from '../domain/model.js';
import { horizontalDistance, simplifyWishPath } from '../rail/wish-path.js';

export type {RouteDraft} from '../rail/planning-draft.js';
export interface RouteConnection {point: Vec3;label: string;}
interface Adapter {
  canvas: HTMLCanvasElement;overlay: HTMLElement;enabled: () => boolean;
  pick: (x: number, y: number) => Vec3 | null;surface: (x: number, z: number) => number;project: (p: Vec3) => {x: number;y: number;visible: boolean;};
  ports: () => RouteConnection[];proposal: () => {points: Vec3[];kind: string;}[];pan: (active: boolean) => void;lock: (value: boolean) => void;
  connectionName: (point: Vec3) => string;changed: (draft: RouteDraft, busy: boolean) => void;notice: (message: string) => void;
}
/** One gesture owner: clicking and drawing extend the same sketch, without camera movement. */
export class RoutePlannerController {
  private readonly history = new RouteDraftHistory();
  get draft(){return this.history.current;}
  set draft(value:RouteDraft){this.history.current=value;}
  private gesture: {id: number;before: RouteDraft;index: number | null;lastX: number;lastY: number;} | null = null;
  private frame = 0;private space = false;
  private cursor: {x: number;y: number;point: Vec3 | null;port: RouteConnection | null;segment: number | null;} | null = null;
  constructor(private readonly a: Adapter) {
    window.addEventListener('pointerdown', this.down, true);window.addEventListener('pointermove', this.move, true);window.addEventListener('pointerup', this.up, true);window.addEventListener('pointercancel', this.cancelEvent, true);window.addEventListener('blur', this.blur);window.addEventListener('keydown', this.key, true);window.addEventListener('keyup', this.keyUp, true);
    a.canvas.addEventListener('click', this.click, true);a.canvas.addEventListener('wheel', this.wheel, { capture: true, passive: false });this.frame = requestAnimationFrame(this.paint);
  }
  get canUndo() {return this.history.past.length > 0;}get canRedo() {return this.history.future.length > 0;}get busy() {return this.gesture !== null;}
  private emit(busy = false) {this.a.changed(structuredClone(this.draft), busy);}
  private save(before:RouteDraft) {
    if(JSON.stringify(before.points)!==JSON.stringify(this.draft.points)||before.complete!==this.draft.complete)this.draft.design=null;
    this.history.record(before);
  }
  snapshot():PlanningDraft|null {const saved=this.history.snapshot();if(saved&&this.gesture)saved.current=structuredClone(this.gesture.before);return saved;}
  restore(saved:PlanningDraft|null) {this.cancel();this.history.restore(saved);this.cursor=null;}
  chooseDesign(curves:CubicCurve[]|null,record=true) {const before=structuredClone(this.draft);this.draft.design=structuredClone(curves);if(record)this.history.record(before);}
  setStandard(trackClassId:string) {this.cancel();const before=structuredClone(this.draft);this.draft.trackClassId=trackClassId;this.draft.design=null;this.history.record(before);this.emit();}
  clear() {this.cancel();const before=structuredClone(this.draft);this.draft={...emptyRouteDraft(),trackClassId:before.trackClassId};this.history.record(before);this.emit();}
  reset() {this.cancel();this.history.restore(null);this.cursor=null;}
  undo() {this.cancel();if(this.history.undo())this.emit();}
  redo() {this.cancel();if(this.history.redo())this.emit();}
  private editableMidpoint() {if (this.draft.complete && this.draft.points.length === 2) {const [a, b] = this.draft.points as [Vec3, Vec3],x = (a.x + b.x) / 2,z = (a.z + b.z) / 2;this.draft.points.splice(1, 0, { x, z, y: this.a.surface(x, z) });}}
  connect(point: Vec3) {if (this.draft.complete) return;const before = structuredClone(this.draft);if (!this.draft.points.length) this.draft.points.push({ ...point });else if (horizontalDistance(point, this.draft.points[0]!) > 10) {this.draft.points.push({ ...point });this.draft.complete = true;} else return;this.editableMidpoint();this.save(before);this.emit();}
  focusPoint(index:number) {
    this.a.overlay.querySelector<HTMLButtonElement>(`[data-route-handle="${index}"]`)?.focus({preventScroll:true});
  }
  private snap(x: number, y: number): RouteConnection | null {
    let best: RouteConnection | null = null,distance = 42;
    for (const port of this.a.ports()) {const screen = this.a.project(port.point),d = Math.hypot(screen.x - x, screen.y - y);if (screen.visible && d < distance) {best = port;distance = d;}}
    return best;
  }
  /** Screen-space tolerance keeps grabbing the line equally easy at every zoom level. */
  private segmentAt(x: number, y: number): number | null {
    let best: number | null = null,distance = 12;
    const screens = this.draft.points.map((p) => this.a.project(p));
    for (let i = 1; i < screens.length; i++) {
      const a = screens[i - 1]!,b = screens[i]!;if (!a.visible || !b.visible) continue;
      const dx = b.x - a.x,dy = b.y - a.y,t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      const d = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
      if (d < distance) {best = i;distance = d;}
    }return best;
  }
  private onMap(target: EventTarget | null) {return target instanceof Element && (target === this.a.canvas || Boolean(target.closest('[data-route-handle], [data-route-port]')));}
  private portTarget(e: PointerEvent): RouteConnection | null {
    const target = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-route-port]') : null;
    return target ? this.a.ports()[Number(target.dataset.routePort)] ?? null : this.snap(e.clientX, e.clientY);
  }
  private stop(e: Event) {e.preventDefault();e.stopImmediatePropagation();}
  private down = (e: PointerEvent) => {
    if (!this.a.enabled() || e.button !== 0 || !this.onMap(e.target)) return;
    if (e.altKey || this.space) {this.a.pan(this.space);return;}
    this.stop(e);if (this.gesture) {this.cancel();return;}
    const target = e.target as Element,handle = target.closest<HTMLElement>('[data-route-handle]')?.dataset.routeHandle;
    const point = this.a.pick(e.clientX, e.clientY),port = this.portTarget(e),before = structuredClone(this.draft);
    // The unfinished tip remains a drawing affordance. Interior handles reshape the sketch.
    let index = handle === undefined ? null : Number(handle);
    if (!this.draft.complete && index === this.draft.points.length - 1) index = null;
    if (this.draft.complete && index === null) {
      const segment = this.segmentAt(e.clientX, e.clientY);if (segment === null || !point) return;
      if (this.draft.points.length >= 64) {this.a.notice('Remove a point first (Delete).');return;}
      this.draft.points.splice(segment, 0, point);index = segment;
    } else if (index === null) {
      if (!this.draft.points.length) {
        if (!port) {this.a.notice('Choose a station marked “Start here”.');return;}
        this.draft.points.push({ ...port.point });
      } else if (port) {this.connect(port.point);return;} else
      if (point && horizontalDistance(point, this.draft.points.at(-1)!) > 3) this.draft.points.push(point);else
      if (!point) return;
    }
    this.a.lock(true);this.gesture = { id: e.pointerId, before, index, lastX: e.clientX, lastY: e.clientY };
    this.a.canvas.setPointerCapture(e.pointerId);this.emit(true);
  };
  private move = (e: PointerEvent) => {
    if (this.a.enabled() && this.onMap(e.target) && !e.altKey && !this.space && (e.buttons === 0 || e.buttons === 1)) {
      this.cursor = { x: e.clientX, y: e.clientY, point: this.a.pick(e.clientX, e.clientY), port: this.portTarget(e), segment: this.draft.complete ? this.segmentAt(e.clientX, e.clientY) : null };
    } else this.cursor = null;
    const g = this.gesture;if (!g || e.pointerId !== g.id) return;this.stop(e);
    if (Math.hypot(e.clientX - g.lastX, e.clientY - g.lastY) < 4) return;
    const p = this.a.pick(e.clientX, e.clientY);if (!p) {this.cancel();this.a.notice('Stroke cancelled: outside the terrain.');return;}
    g.lastX = e.clientX;g.lastY = e.clientY;
    if (g.index !== null) this.draft.points[g.index] = p;else
    if (this.draft.points.length < 2048 && horizontalDistance(p, this.draft.points.at(-1)!) > 3) this.draft.points.push(p);
    this.emit(true);
  };
  private up = (e: PointerEvent) => {const g = this.gesture;if (!g || e.pointerId !== g.id) return;this.stop(e);const port = this.snap(e.clientX, e.clientY);
    if (g.index === null && port && horizontalDistance(port.point, this.draft.points[0]!) > 10) {if (this.draft.points.length > 1 && horizontalDistance(this.draft.points.at(-1)!, port.point) < 35) this.draft.points.pop();this.draft.points.push({ ...port.point });this.draft.complete = true;}
    if (g.index === null) this.draft.points = simplifyWishPath(this.draft.points, 8);this.editableMidpoint();
    if (this.draft.points.length > 64) {this.draft = g.before;this.a.notice('Too many bends. Draw a simpler route.');} else this.save(g.before);
    this.release();this.emit();
  };
  private release() {if (this.gesture && this.a.canvas.hasPointerCapture(this.gesture.id)) this.a.canvas.releasePointerCapture(this.gesture.id);this.gesture = null;this.a.lock(false);}
  cancel() {if (!this.gesture) return;this.draft = this.gesture.before;this.release();this.emit();}
  private cancelEvent = () => this.cancel();private blur = () => {this.space = false;this.cursor = null;this.a.pan(false);this.cancel();};
  private click = (e: MouseEvent) => {if (this.a.enabled()) this.stop(e);};
  private wheel = (e: WheelEvent) => {this.cursor = null;if (this.gesture) this.stop(e);};
  private key = (e: KeyboardEvent) => {if (!this.a.enabled() || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'Space' && e.target === this.a.canvas) {this.space = true;this.stop(e);return;}
    if (e.code === 'Escape' && this.gesture) {this.stop(e);this.cancel();return;}
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {this.stop(e);e.shiftKey ? this.redo() : this.undo();return;}
    const target = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('[data-route-handle]') : null;if (!target) return;const index = Number(target.dataset.routeHandle),point = this.draft.points[index];if (!point) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(e.key)) {
      this.stop(e);const before = structuredClone(this.draft);
      if (e.key === 'Delete' || e.key === 'Backspace') this.draft.points.splice(index, 1);else
      {const step = e.shiftKey ? 25 : 5;point.x += e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;point.z += e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;point.y = this.a.surface(point.x, point.z);}
      this.save(before);this.emit();
    }
  };
  private keyUp = (e: KeyboardEvent) => {if (e.code === 'Space') {this.space = false;this.a.pan(false);}};
  private paint = () => {
    const root = this.a.overlay;root.hidden = !this.a.enabled();
    if (!root.hidden) {
      const screens = this.draft.points.map((p) => this.a.project(p));let svg = root.querySelector<SVGSVGElement>('svg');
      if (!svg) {setHtml(root, '<svg aria-hidden="true"><path /><g class="route-proposal"></g><g class="route-cursor"><path /></g></svg><div class="route-grips"></div><div class="route-connections"></div><div class="route-start-badge"></div><div class="route-end-badge"></div><div class="route-cursor-hint"></div>');svg = root.querySelector('svg')!;}
      const pathData = (ps: typeof screens) => ps.map((p, i) => `${i && ps[i - 1]!.visible && p.visible ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
      svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);svg.querySelector('path')!.setAttribute('d', pathData(screens));
      const proposal = svg.querySelector('.route-proposal')!,lines = this.a.proposal();while (proposal.children.length > lines.length) proposal.lastElementChild!.remove();while (proposal.children.length < lines.length) proposal.append(document.createElementNS('http://www.w3.org/2000/svg', 'path'));[...proposal.children].forEach((path, i) => {const line = lines[i]!;path.setAttribute('d', pathData(line.points.map((p) => this.a.project(p))));path.setAttribute('class', line.kind);});
      const ports = this.a.ports(),connections = root.querySelector<HTMLElement>('.route-connections')!;
      while (connections.children.length > ports.length) connections.lastElementChild!.remove();
      while (connections.children.length < ports.length) {const button = document.createElement('button');button.type = 'button';button.className = 'route-port';setHtml(button, '<span></span>');connections.append(button);}
      [...connections.children].forEach((node, i) => {const button = node as HTMLButtonElement,port = ports[i]!,screen = this.a.project(port.point),label = `${this.draft.points.length ? 'Finish here' : 'Start here'} · ${port.label}`;
        button.dataset.routePort = String(i);setAttribute(button, 'aria-label', label);setText(button.querySelector('span')!, label);button.hidden = !screen.visible || this.draft.complete;button.classList.toggle('snap-ready', Boolean(this.cursor?.port && horizontalDistance(this.cursor.port.point, port.point) < 1));button.style.transform = `translate(${screen.x - 22}px,${screen.y - 22}px)`;button.onclick = (e) => {if (e.detail === 0) this.connect(port.point);};
      });
      const grips = root.querySelector<HTMLElement>('.route-grips')!,count = Math.max(0, screens.length - 1 - (this.draft.complete ? 1 : 0));while (grips.children.length > count) grips.lastElementChild!.remove();while (grips.children.length < count) {const button = document.createElement('button');button.type = 'button';button.className = 'route-handle';grips.append(button);}
      [...grips.children].forEach((el, i) => {const button = el as HTMLButtonElement,p = screens[i + 1]!;button.dataset.routeHandle = String(i + 1);setAttribute(button, 'aria-label', `Route point ${i + 1}, drag or use arrow keys`);button.hidden = !p.visible;button.style.transform = `translate(${p.x - 22}px,${p.y - 22}px)`;});
      const start = root.querySelector<HTMLElement>('.route-start-badge')!;start.hidden = !screens[0]?.visible;setText(start, screens[0] ? `${'Start'} · ${this.a.connectionName(this.draft.points[0]!)}` : '');if (screens[0]) start.style.transform = `translate(${screens[0].x}px,${screens[0].y}px)`;
      const end = root.querySelector<HTMLElement>('.route-end-badge')!,last = screens.at(-1);end.hidden = !this.draft.complete || !last?.visible;if (last && this.draft.complete) {setText(end, `${'To'} · ${this.a.connectionName(this.draft.points.at(-1)!)}`);end.style.transform = `translate(${last.x}px,${last.y}px)`;}
      const c = this.cursor,tip = screens.at(-1),ghost = svg.querySelector('.route-cursor path')!,hint = root.querySelector<HTMLElement>('.route-cursor-hint')!;
      ghost.setAttribute('d', c?.point && tip?.visible && !this.draft.complete && !this.gesture ? pathData([tip, this.a.project(c.port?.point ?? c.point)]) : '');
      const text = c?.port && !this.draft.complete ? this.draft.points.length ? 'Release or click to connect' : 'Click or start drawing' : c?.segment !== null && this.draft.complete ? 'Drag here to reshape' : this.draft.points.length && !this.draft.complete ? 'Click or drag to continue' : '';
      hint.hidden = !c || !text || Boolean(this.gesture?.index !== null && this.gesture);setText(hint, text);
      if (c) hint.style.transform = `translate(${Math.min(c.x + 18, innerWidth - 290)}px,${Math.min(c.y + 26, innerHeight - 55)}px)`;
      this.a.canvas.style.cursor = this.gesture ? 'grabbing' : this.draft.complete ? c?.segment !== null && c ? 'grab' : 'default' : 'crosshair';
    } else {this.a.canvas.style.cursor = '';this.cursor = null;}
    this.frame = requestAnimationFrame(this.paint);
  };
  dispose() {this.release();cancelAnimationFrame(this.frame);window.removeEventListener('pointerdown', this.down, true);window.removeEventListener('pointermove', this.move, true);window.removeEventListener('pointerup', this.up, true);window.removeEventListener('pointercancel', this.cancelEvent, true);window.removeEventListener('blur', this.blur);window.removeEventListener('keydown', this.key, true);window.removeEventListener('keyup', this.keyUp, true);this.a.canvas.removeEventListener('click', this.click, true);this.a.canvas.removeEventListener('wheel', this.wheel, true);this.a.overlay.replaceChildren();this.a.canvas.style.cursor = '';}
}
