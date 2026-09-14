import * as THREE from 'three';
import { sampleDistance,type TrackGeometry } from '../rail/geometry.js';
import type { Terrain } from '../world/terrain.js';

export function createTrack(geometry:TrackGeometry,terrain:Terrain):THREE.Group {
  const group=new THREE.Group();group.name='derived-rail-track';
  const railMaterial=new THREE.MeshStandardMaterial({color:'#647474',roughness:.5,metalness:.65});
  const ballastMaterial=new THREE.MeshStandardMaterial({color:'#827c6e',roughness:1});
  function ribbon(offset:number,width:number,height:number,material:THREE.Material):void {
    const positions:number[]=[],indices:number[]=[];
    for(let i=0;i<geometry.samples.length;i++) {
      const sample=geometry.samples[i]!,p=sample.position,next=sampleDistance(geometry,Math.min(geometry.lengthM,sample.distanceM+1)),prev=sampleDistance(geometry,Math.max(0,sample.distanceM-1));
      const dx=next.x-prev.x,dz=next.z-prev.z,norm=Math.hypot(dx,dz),nx=dz/norm,nz=-dx/norm;
      for(const side of [-1,1])positions.push(p.x+nx*(offset+side*width/2),p.y+height,p.z+nz*(offset+side*width/2));
      if(i>0){const a=(i-1)*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const meshGeometry=new THREE.BufferGeometry();meshGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));meshGeometry.setIndex(indices);meshGeometry.computeVertexNormals();group.add(new THREE.Mesh(meshGeometry,material));
  }
  ribbon(0,4.5,-.36,ballastMaterial);ribbon(-.7175,.15,0,railMaterial);ribbon(.7175,.15,0,railMaterial);
  const count=Math.floor(geometry.lengthM/.7),sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(2.6,.16,.23),new THREE.MeshStandardMaterial({color:'#4e5145'}),count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const p=sampleDistance(geometry,i*.7),q=sampleDistance(geometry,i*.7+.1);dummy.position.set(p.x,p.y-.13,p.z);dummy.rotation.set(0,Math.atan2(q.x-p.x,q.z-p.z),0);dummy.updateMatrix();sleepers.setMatrixAt(i,dummy.matrix);}sleepers.computeBoundingSphere();group.add(sleepers);
  const bridgeMaterial=new THREE.MeshStandardMaterial({color:'#3e534f',roughness:.8,metalness:.2});
  const box=new THREE.BoxGeometry(1,1,1);
  const supports:THREE.Matrix4[]=[];
  for(let s=12;s<geometry.lengthM;s+=18){const p=sampleDistance(geometry,s),ground=terrain.sample(p.x,p.z).elevationM;
    if(p.y-ground>7){dummy.position.set(p.x,(p.y+ground)/2,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(2.4,p.y-ground,2.4);dummy.updateMatrix();supports.push(dummy.matrix.clone());}
  }
  const piers=new THREE.InstancedMesh(box,bridgeMaterial,supports.length);supports.forEach((matrix,i)=>piers.setMatrixAt(i,matrix));piers.computeBoundingSphere();group.add(piers);
  return group;
}

/** Lightweight derived catenary for authoritative electrified edges. */
export function createElectrification(geometry:TrackGeometry):THREE.Group {
  const group=new THREE.Group();group.name='derived-route-electrification';
  const steel=new THREE.MeshStandardMaterial({color:'#57645f',roughness:.72,metalness:.45}),wireMaterial=new THREE.LineBasicMaterial({color:'#343d3a'}),mastGeometry=new THREE.BoxGeometry(1,1,1),beamGeometry=new THREE.BoxGeometry(1,1,1),supportDistances:number[]=[];
  for(let distance=18;distance<geometry.lengthM-8;distance+=48)supportDistances.push(distance);
  const masts=new THREE.InstancedMesh(mastGeometry,steel,supportDistances.length*2),beams=new THREE.InstancedMesh(beamGeometry,steel,supportDistances.length),dummy=new THREE.Object3D();
  supportDistances.forEach((distance,index)=>{
    const p=sampleDistance(geometry,distance),q=sampleDistance(geometry,Math.min(geometry.lengthM,distance+1)),heading=Math.atan2(q.x-p.x,q.z-p.z),nx=Math.cos(heading),nz=-Math.sin(heading);
    for(const side of [-1,1]){dummy.position.set(p.x+nx*side*2.35,p.y+3,p.z+nz*side*2.35);dummy.rotation.set(0,heading,0);dummy.scale.set(.16,6,.16);dummy.updateMatrix();masts.setMatrixAt(index*2+(side===1?1:0),dummy.matrix);}
    dummy.position.set(p.x,p.y+5.75,p.z);dummy.rotation.set(0,heading,0);dummy.scale.set(4.86,.13,.13);dummy.updateMatrix();beams.setMatrixAt(index,dummy.matrix);
  });
  masts.computeBoundingSphere();beams.computeBoundingSphere();group.add(masts,beams);
  const points:number[]=[],step=Math.max(4,Math.min(12,geometry.lengthM/16));let previous=sampleDistance(geometry,0);
  for(let distance=step;distance<geometry.lengthM+step;distance+=step){const p=sampleDistance(geometry,Math.min(distance,geometry.lengthM));points.push(previous.x,previous.y+5.35,previous.z,p.x,p.y+5.35,p.z,previous.x,previous.y+5.68,previous.z,p.x,p.y+5.68,p.z);previous=p;}
  for(let distance=18;distance<geometry.lengthM-8;distance+=24){const p=sampleDistance(geometry,distance);points.push(p.x,p.y+5.35,p.z,p.x,p.y+5.68,p.z);}
  const wires=new THREE.BufferGeometry();wires.setAttribute('position',new THREE.Float32BufferAttribute(points,3));group.add(new THREE.LineSegments(wires,wireMaterial));
  return group;
}
