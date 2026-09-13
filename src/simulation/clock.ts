import type { Speed } from '../domain/model.js';
export const FIXED_DT = 0.05;
export const ECONOMY_INTERVAL_TICKS = 1200; // 60 simulated seconds = one economic day.
export class SimulationClock {
  private accumulator = 0;
  constructor(private readonly step: () => void) {}
  /** Backlog is preserved, never discarded. Caller auto-pauses on visibility loss. */
  advance(realSeconds: number, speed: Speed, maxSteps = 240): { steps: number; alpha: number; backlogSeconds: number } {
    if(!Number.isFinite(realSeconds)||realSeconds<0||![0,1,2,4,8].includes(speed)||!Number.isInteger(maxSteps)||maxSteps<1) throw new Error('Invalid clock input');
    if(speed===0) return {steps:0,alpha:Math.min(1,this.accumulator/FIXED_DT),backlogSeconds:this.accumulator};
    this.accumulator+=realSeconds*speed; let steps=0;
    while(this.accumulator+1e-10>=FIXED_DT && steps<maxSteps) {this.step();this.accumulator=Math.max(0,this.accumulator-FIXED_DT);steps++;}
    return {steps,alpha:Math.min(1,this.accumulator/FIXED_DT),backlogSeconds:this.accumulator};
  }
  reset(): void { this.accumulator=0; }
}
