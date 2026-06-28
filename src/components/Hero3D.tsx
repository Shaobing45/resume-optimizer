'use client';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

function ParticleField({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const count = 300;
  const mesh = useRef<THREE.Points>(null);

  const geom = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 16;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) vel[i] = (Math.random() - 0.5) * 0.003;
    return vel;
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    const attr = mesh.current.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx] += velocities[idx];
      arr[idx + 1] += velocities[idx + 1];
      arr[idx + 2] += velocities[idx + 2];
      if (Math.abs(arr[idx]) > 8) velocities[idx] *= -1;
      if (Math.abs(arr[idx + 1]) > 5) velocities[idx + 1] *= -1;
      if (Math.abs(arr[idx + 2]) > 4) velocities[idx + 2] *= -1;
    }
    attr.needsUpdate = true;
    if (mouse.current) {
      mesh.current.rotation.y += (mouse.current.x * 0.1 - mesh.current.rotation.y) * 0.02;
      mesh.current.rotation.x += (-mouse.current.y * 0.05 - mesh.current.rotation.x) * 0.02;
    }
  });

  return (
    <points ref={mesh} geometry={geom}>
      <pointsMaterial size={0.03} color="#6366f1" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function TorusKnotModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} scale={0.9}>
        <torusKnotGeometry args={[0.7, 0.15, 128, 16]} />
        <MeshDistortMaterial color="#818cf8" roughness={0.1} metalness={0.8} distort={0.3} speed={0.8} />
      </mesh>
    </Float>
  );
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
      <planeGeometry args={[20, 20, 30, 30]} />
      <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.15} />
    </mesh>
  );
}

function GlowOrbs() {
  const positions = useMemo(() => {
    return Array.from({ length: 5 }, () => ({
      pos: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6],
    }));
  }, []);
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((r, i) => {
      if (!r) return;
      r.position.y += Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.003;
      r.position.x += Math.cos(clock.getElapsedTime() * 0.3 + i) * 0.003;
    });
  });
  return (
    <>
      {positions.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el! }} position={p.pos as [number, number, number]}>
          <sphereGeometry args={[0.3 + i * 0.05, 16, 16]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#818cf8' : '#a78bfa'} transparent opacity={0.2} />
        </mesh>
      ))}
    </>
  );
}

export default function Hero3D() {
  const mouse = useRef({ x: 0, y: 0 });
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, width: '100%', height: '100%', minHeight: '70vh' }}
      onMouseMove={(e) => {
        const rect = (e.target as HTMLElement).closest('.hero3d-wrapper')?.getBoundingClientRect();
        if (rect) { mouse.current.x = (e.clientX - rect.left) / rect.width * 2 - 1; mouse.current.y = (e.clientY - rect.top) / rect.height * 2 - 1; }
      }}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.4} color="#818cf8" />
        <pointLight position={[-10, -5, -10]} intensity={0.3} color="#a78bfa" />
        <pointLight position={[0, 0, 5]} intensity={0.2} color="#6366f1" />
        <GridFloor />
        <TorusKnotModel />
        <ParticleField mouse={mouse} />
        <GlowOrbs />
      </Canvas>
    </div>
  );
}
