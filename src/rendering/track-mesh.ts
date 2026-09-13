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
