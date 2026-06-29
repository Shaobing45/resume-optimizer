'use client';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';

function ResumeDocument() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += (pointer.x * 0.5 - mesh.current.rotation.y) * 0.03;
    mesh.current.rotation.x += (-pointer.y * 0.2 - mesh.current.rotation.x) * 0.03;
    mesh.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.15;
  });
  return (
    <group ref={mesh} position={[0, 0.3, 0]}>
      {/* 主文档 */}
      <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.2}>
        <RoundedBox args={[2.2, 3, 0.08]} radius={0.06}>
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.5}
            roughness={0.1}
            metalness={0.1}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
            transmission={0.95}
            ior={1.5}
            chromaticAberration={0.1}
            color="#818cf8"
            background={new THREE.Color("#0f172a")}
          />
        </RoundedBox>
        {/* 文档上的横线 */}
        {[0.35, 0.1, -0.15, -0.4].map((y, i) => (
          <mesh key={i} position={[0, y, 0.045]} scale={[0.7 + (i === 0 ? 0.1 : 0), 0.015, 0.01]}>
            <planeGeometry />
            <meshBasicMaterial color={i === 0 ? '#818cf8' : '#475569'} transparent opacity={i === 0 ? 0.7 : 0.35} />
          </mesh>
        ))}
        {/* 照片占位 */}
        <mesh position={[-0.6, 0.55, 0.045]} scale={[0.2, 0.2, 0.01]}>
          <planeGeometry />
          <meshBasicMaterial color="#334155" transparent opacity={0.3} />
        </mesh>
      </Float>
    </group>
  );
}

function Sparkles() {
  const count = 80;
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 3;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      const c = new THREE.Color().setHSL(0.65 + Math.random() * 0.1, 0.8, 0.5 + Math.random() * 0.3);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.05;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.05;
    }
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function GlowRings() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * 0.1;
  });
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.5 + i * 0.5, 0]}>
          <ringGeometry args={[2.2 + i * 0.4, 2.25 + i * 0.4, 64]} />
          <meshBasicMaterial color="#818cf8" transparent opacity={0.12 - i * 0.03} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingIcons() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        child.position.y += Math.sin(clock.getElapsedTime() * 0.5 + i * 1.5) * 0.002;
      });
    }
  });
  const icons = useMemo(() => [
    { color: '#6366f1', pos: [-3.5, 0.5, -2] },
    { color: '#a78bfa', pos: [3.5, -0.3, -2] },
    { color: '#818cf8', pos: [0, 2.5, -3] },
    { color: '#8b5cf6', pos: [-2.5, -1.5, -2.5] },
  ], []);
  return (
    <group ref={ref}>
      {icons.map((ic, i) => (
        <mesh key={i} position={ic.pos as [number, number, number]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={ic.color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, width: '100%', height: '100%', minHeight: '75vh' }}>
      {/* 渐变背景层 — 深色到紫色 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" style={{ zIndex: -1 }} />
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 2]} style={{ width: '100%', height: '100%', background: 'transparent' }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} color="#818cf8" />
        <directionalLight position={[-5, -5, -5]} intensity={0.2} color="#a78bfa" />
        <pointLight position={[0, 0, 4]} intensity={0.5} color="#818cf8" />
        <pointLight position={[4, 3, 2]} intensity={0.3} color="#a78bfa" />
        <ResumeDocument />
        <Sparkles />
        <GlowRings />
        <FloatingIcons />
      </Canvas>
    </div>
  );
}
