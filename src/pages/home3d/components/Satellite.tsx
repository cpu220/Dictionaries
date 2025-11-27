import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SATELLITE_CONFIG } from '@/consts/home3d';

interface SatelliteProps {
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle: number;
}

export default function Satellite({ color, orbitRadius, orbitSpeed, initialAngle }: SatelliteProps) {
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
      meshRef.current.rotation.x += delta * SATELLITE_CONFIG.SELF_ROTATION_SPEED;
      meshRef.current.rotation.y += delta * SATELLITE_CONFIG.SELF_ROTATION_SPEED;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main transparent sphere */}
      <mesh>
        <sphereGeometry args={[SATELLITE_CONFIG.SIZE, 16, 16]} />
        <meshPhysicalMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={SATELLITE_CONFIG.OPACITY_MAIN}
          metalness={0.2}
          roughness={0.1}
          transmission={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[SATELLITE_CONFIG.SIZE, 8, 8]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={SATELLITE_CONFIG.OPACITY_GLOW}
        />
      </mesh>
    </group>
  );
}
