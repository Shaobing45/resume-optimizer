'use client';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

function TorusKnot() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += (pointer.y * 0.15 - mesh.current.rotation.x) * 0.02;
    mesh.current.rotation.y += (pointer.x * 0.25 - mesh.current.rotation.y) * 0.02;
    mesh.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.12;
  });
  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={mesh} scale={1.8}>
        <torusKnotGeometry args={[0.6, 0.25, 128, 16]} />
        <MeshDistortMaterial
          color="#818cf8"
          emissive="#6366f1"
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.15}
          distort={0.15}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 200;
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 2.5;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.6;
      pos[i * 3 + 2] = Math.cos(phi) * r;
      const hue = 0.65 + Math.random() * 0.15;
      const c = new THREE.Color().setHSL(hue, 0.7, 0.5 + Math.random() * 0.3);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.03;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.02;
    }
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function GlowRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * 0.08;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <ringGeometry args={[2.4, 2.6, 64]} />
      <meshBasicMaterial color="#818cf8" transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, width: '100%', height: '100%', minHeight: '75vh' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" style={{ zIndex: -1 }} />
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]} style={{ width: '100%', height: '100%', background: 'transparent' }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#a78bfa" />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} color="#6366f1" />
        <pointLight position={[0, 2, 3]} intensity={0.6} color="#818cf8" />
        <TorusKnot />
        <Particles />
        <GlowRing />
      </Canvas>
    </div>
  );
}
