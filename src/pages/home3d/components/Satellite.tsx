import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SATELLITE_CONFIG } from '@/consts/home3d';

interface SatelliteProps {
  proficiencyLevel: 'low' | 'medium' | 'high';
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle: number;
}

const PROFICIENCY_CONFIG = {
  low: {
    size: 0.05,
    color: '#ff6b6b',
    emissive: '#ff3333',
  },
  medium: {
    size: 0.08,
    color: '#ffd93d',
    emissive: '#ffaa00',
  },
  high: {
    size: 0.12,
    color: '#6bcf7f',
    emissive: '#33aa55',
  },
};

export default function Satellite({ proficiencyLevel, orbitRadius, orbitSpeed, initialAngle }: SatelliteProps) {
  const meshRef = useRef<THREE.Group>(null);
  const angleRef = useRef(initialAngle);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Update orbital position
      angleRef.current += orbitSpeed * delta;
      
      const x = Math.cos(angleRef.current) * orbitRadius;
      const z = Math.sin(angleRef.current) * orbitRadius;
      const y = Math.sin(angleRef.current * 2) * SATELLITE_CONFIG.VERTICAL_WAVE_AMPLITUDE; // Add vertical wave motion
      
      meshRef.current.position.set(x, y, z);
      
      // Rotate the satellite itself
      meshRef.current.rotation.x += delta * 2;
      meshRef.current.rotation.y += delta * 2;
    }
  });

  const config = PROFICIENCY_CONFIG[proficiencyLevel];

  return (
    <group ref={meshRef}>
      {/* Main transparent sphere */}
      <mesh>
        <sphereGeometry args={[config.size, 16, 16]} />
        <meshPhysicalMaterial 
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
          metalness={0.2}
          roughness={0.1}
          transmission={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[config.size, 8, 8]} />
        <meshBasicMaterial 
          color={config.emissive}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
