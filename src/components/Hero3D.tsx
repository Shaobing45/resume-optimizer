'use client';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

function ResumeModel() {
  const meshRef = useRef<any>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.2;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={1.8}>
        <boxGeometry args={[2, 2.8, 0.15]} />
        <MeshDistortMaterial color="#2563eb" roughness={0.2} metalness={0.6} distort={0.05} speed={1.5} />
      </mesh>
      {/* Document lines */}
      <mesh position={[-0.5, 0.3, 0.1]}>
        <planeGeometry args={[1.2, 0.05]} />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>
      <mesh position={[-0.5, 0, 0.1]}>
        <planeGeometry args={[0.9, 0.05]} />
        <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
      </mesh>
      <mesh position={[-0.5, -0.3, 0.1]}>
        <planeGeometry args={[0.7, 0.05]} />
        <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 40;
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) p[i] = (Math.random() - 0.5) * 10;
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
  }, [count]);
  return (
    <points>
      <primitive object={points} />
      <pointsMaterial size={0.04} color="#6366f1" transparent opacity={0.6} />
    </points>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#6366f1" />
        <ResumeModel />
        <Particles />
      </Canvas>
    </div>
  );
}
