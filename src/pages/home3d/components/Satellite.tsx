import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SatelliteConfig } from '@/consts/home3d';

interface SatelliteProps {
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle: number;
  config: SatelliteConfig;
}

export default function Satellite({ color, orbitRadius, orbitSpeed, initialAngle, config }: SatelliteProps) {
  const meshRef = useRef<THREE.Group>(null);
  const angleRef = useRef(initialAngle);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Update orbital position
      angleRef.current += orbitSpeed * delta;
      
      const x = Math.cos(angleRef.current) * orbitRadius;
      const z = Math.sin(angleRef.current) * orbitRadius;
      const y = Math.sin(angleRef.current * 2) * config.VERTICAL_WAVE_AMPLITUDE; // Add vertical wave motion
      
      meshRef.current.position.set(x, y, z);
      
      // Rotate the satellite itself
      meshRef.current.rotation.x += delta * config.SELF_ROTATION_SPEED;
      meshRef.current.rotation.y += delta * config.SELF_ROTATION_SPEED;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main transparent sphere */}
      <mesh>
        <sphereGeometry args={[config.SIZE, 16, 16]} />
        <meshPhysicalMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={config.OPACITY_MAIN}
          metalness={0.2}
          roughness={0.1}
          transmission={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[config.SIZE, 8, 8]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={config.OPACITY_GLOW}
        />
      </mesh>
    </group>
  );
}
