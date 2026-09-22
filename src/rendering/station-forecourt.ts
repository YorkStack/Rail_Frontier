import * as THREE from 'three';
import type {Terrain} from '../world/terrain.js';
import type {StationForecourt} from '../world/station-forecourt.js';
import {roadMaterial} from './settlement-roads.js';

/** World-space paving and closed supporting edges, from the same checked survey. */
export function createStationForecourt(court:StationForecourt,terrain:Terrain,preview=false):THREE.Group {
 const group=new THREE.Group();group.name='station-forecourt';if(!court.valid)return group;
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 court.rows.forEach((row,i)=>{row.forEach((p,side)=>{positions.push(p.x,p.y,p.z);uv.push(side*3.4,i/8*5.3);});if(i){const a=(i-1)*2,b=i*2;indices.push(a,a+1,b,a+1,b+1,b);}});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const material=preview?new THREE.MeshBasicMaterial({color:'#edc879',transparent:true,opacity:.55,depthTest:false}):roadMaterial('cobbles');material.userData.width=3.4;const surface=new THREE.Mesh(geo,material);surface.name='forecourt-paving';surface.receiveShadow=true;group.add(surface);
 if(!preview){const sides:number[]=[],index:number[]=[];const perimeter=[...court.rows.map(r=>r[0]),...court.rows.map(r=>r[1]).reverse()];for(let i=0;i<perimeter.length;i++){const a=perimeter[i]!,b=perimeter[(i+1)%perimeter.length]!,n=sides.length/3;for(const p of [a,b]){sides.push(p.x,p.y,p.z,p.x,Math.min(p.y-.08,terrain.sample(p.x,p.z).elevationM-.12),p.z);}index.push(n,n+1,n+2,n+1,n+3,n+2);}const skirt=new THREE.BufferGeometry();skirt.setAttribute('position',new THREE.Float32BufferAttribute(sides,3));skirt.setIndex(index);skirt.computeVertexNormals();const support=new THREE.Mesh(skirt,new THREE.MeshStandardMaterial({color:'#79796c',roughness:1,side:THREE.DoubleSide}));support.name='forecourt-support';support.castShadow=true;support.receiveShadow=true;group.add(support);}
 return group;
}
