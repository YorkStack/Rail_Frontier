export interface FjordSection {z:number;centerX:number;halfWidthM:number}
export interface ValleyAnchor {x:number;z:number;floorM:number}

export const norwayV2Landforms=Object.freeze({
  fjord:Object.freeze([
    Object.freeze({z:0,centerX:1500,halfWidthM:850}),Object.freeze({z:3200,centerX:1200,halfWidthM:800}),Object.freeze({z:6500,centerX:1750,halfWidthM:950}),Object.freeze({z:11000,centerX:2600,halfWidthM:1200}),Object.freeze({z:16000,centerX:3000,halfWidthM:900})
  ] satisfies FjordSection[]),
  valley:Object.freeze([
    Object.freeze({x:2200,z:3200,floorM:28}),Object.freeze({x:4700,z:4900,floorM:72}),Object.freeze({x:8500,z:7800,floorM:132}),Object.freeze({x:11800,z:10800,floorM:260})
  ] satisfies ValleyAnchor[]),
  waterfall:Object.freeze({z:6350,offsetFromEastShoreM:680})
});

export function norwayV2FjordAtZ(z:number):{centerX:number;halfWidthM:number} {
  const sections=norwayV2Landforms.fjord,clamped=Math.max(sections[0]!.z,Math.min(sections.at(-1)!.z,z));
  for(let i=1;i<sections.length;i++)if(clamped<=sections[i]!.z){const a=sections[i-1]!,b=sections[i]!,t=(clamped-a.z)/(b.z-a.z);return {centerX:a.centerX+(b.centerX-a.centerX)*t,halfWidthM:a.halfWidthM+(b.halfWidthM-a.halfWidthM)*t};}
  const last=sections.at(-1)!;return {centerX:last.centerX,halfWidthM:last.halfWidthM};
}

export function norwayV2ValleyX(z:number):number {
  const anchors=norwayV2Landforms.valley;if(z<=anchors[0]!.z)return anchors[0]!.x-(anchors[0]!.z-z)*.08;
  for(let i=1;i<anchors.length;i++)if(z<=anchors[i]!.z){const a=anchors[i-1]!,b=anchors[i]!,t=(z-a.z)/(b.z-a.z);return a.x+(b.x-a.x)*t;}
  const last=anchors.at(-1)!;return last.x+(z-last.z)*.08;
}
