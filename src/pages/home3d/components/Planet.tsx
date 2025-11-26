import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Satellite from './Satellite';
import { DeckStats } from '../utils/deckProgress';

interface PlanetProps {
  position: [number, number, number];
  deckName: string;
  deckId: string;
  stats: DeckStats;
  color: string;
  onClick: () => void;
}

export default function Planet({ position, deckName, deckId, stats, color, onClick }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  // Generate satellites
  const satellites: JSX.Element[] = [];
  const maxSatellites = 200;
  
  // Helper function to create satellites for a proficiency level
  const addSatellites = (
    count: number, 
    proficiencyLevel: 'low' | 'medium' | 'high',
    baseRadius: number
  ) => {
    for (let i = 0; i < count; i++) {
      const orbitRadius = baseRadius + Math.random() * 0.5;
      const orbitSpeed = 0.3 + Math.random() * 0.4;
      const initialAngle = Math.random() * Math.PI * 2;
      
      satellites.push(
        <Satellite
          key={`${proficiencyLevel}-${i}`}
          proficiencyLevel={proficiencyLevel}
          orbitRadius={orbitRadius}
          orbitSpeed={orbitSpeed}
          initialAngle={initialAngle}
        />
      );
    }
  };

  // Limit total satellites
  const totalWords = stats.totalWords;
  const scaleFactor = totalWords > maxSatellites ? maxSatellites / totalWords : 1;
  
  const lowCount = Math.floor(stats.lowProficiency.length * scaleFactor);
  const mediumCount = Math.floor(stats.mediumProficiency.length * scaleFactor);
  const highCount = Math.floor(stats.highProficiency.length * scaleFactor);

  addSatellites(lowCount, 'low', 1.2);
  addSatellites(mediumCount, 'medium', 1.35);
  addSatellites(highCount, 'high', 1.5);

  return (
    <group position={position}>
      {/* Planet */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.2}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={1.1}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.25 : 0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Deck name label using HTML */}
      <Html position={[0, 1.8, 0]} center>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {deckName}
        </div>
      </Html>

      {/* Word count label */}
      <Html position={[0, 1.4, 0]} center>
        <div style={{
          color: '#aaa',
          fontSize: '12px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {stats.totalWords} words
        </div>
      </Html>

      {/* Satellites */}
      {satellites}
    </group>
  );
}
