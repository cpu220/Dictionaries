import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent, useLoader } from '@react-three/fiber';
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
  textureUrl?: string;
  onClick: () => void;
}

export default function Planet({ position, deckName, deckId, stats, color, textureUrl, onClick }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Load texture if URL is provided
  const texture = textureUrl ? useLoader(THREE.TextureLoader, textureUrl) : null;

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
      {/* Planet - Transparent glass effect with Earth texture for cet4 */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        {texture ? (
          // Custom texture
          <meshPhysicalMaterial
            map={texture}
            transparent
            opacity={0.85}
            metalness={0.1}
            roughness={0.3}
            transmission={0.3}
            thickness={0.5}
            envMapIntensity={1}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
          />
        ) : (
          // Glass effect for decks without texture
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.6}
            metalness={0.1}
            roughness={0.1}
            transmission={0.9}
            thickness={0.5}
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        )}
      </mesh>

      {/* Wireframe overlay for Earth-like grid - only for non-texture planets */}
      {!texture && (
        <mesh scale={1.01}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={hovered ? 0.3 : 0.2}
          />
        </mesh>
      )}

      {/* Inner glow */}
      <mesh scale={0.95}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Atmosphere glow - outer layer */}
      <mesh scale={1.15}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmosphere glow - middle layer */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Deck name label using HTML */}
      <Html position={[0, 1.8, 0]} center>
        <div style={{
          color: 'white',
          fontSize: '0.48rem',
          fontWeight: 'bold',
          textShadow: '0.02rem 0.02rem 0.04rem rgba(0,0,0,0.8)',
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
          fontSize: '0.32rem',
          textShadow: '0.01rem 0.01rem 0.02rem rgba(0,0,0,0.8)',
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
