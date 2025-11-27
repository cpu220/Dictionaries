import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Satellite from './Satellite';
import { DeckStats } from '../utils/deckProgress';
import { PLANET_CONFIG, SATELLITE_CONFIG } from '@/consts/home3d';
import { DIFFICULTY_LEVELS } from '@/consts/difficulty';

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
      meshRef.current.rotation.y += delta * PLANET_CONFIG.ROTATION_SPEED * 2; // 稍微增加旋转速度，使自转更明显
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  // Generate satellites
  const satellites: JSX.Element[] = [];
  
  // Helper function to create satellites for a proficiency level
  const addSatellites = (
    count: number, 
    color: string,
    baseRadius: number
  ) => {
    for (let i = 0; i < count; i++) {
      const orbitRadius = baseRadius + Math.random() * PLANET_CONFIG.SATELLITE_RADIUS_VARIATION;
      const orbitSpeed = SATELLITE_CONFIG.ORBIT_SPEED_MIN + Math.random() * SATELLITE_CONFIG.ORBIT_SPEED_RANGE;
      const initialAngle = Math.random() * Math.PI * 2;
      
      satellites.push(
        <Satellite
          key={`${color}-${i}`}
          color={color}
          orbitRadius={orbitRadius}
          orbitSpeed={orbitSpeed}
          initialAngle={initialAngle}
        />
      );
    }
  };

  // Limit total satellites
  const totalWords = stats.totalWords;
  const maxSatellites = PLANET_CONFIG.MAX_SATELLITES;
  const scaleFactor = totalWords > maxSatellites ? maxSatellites / totalWords : 1;
  
  const againCount = Math.floor(stats.again.length * scaleFactor);
  const hardCount = Math.floor(stats.hard.length * scaleFactor);
  const goodCount = Math.floor(stats.good.length * scaleFactor);
  const easyCount = Math.floor(stats.easy.length * scaleFactor);

  let currentRadius = PLANET_CONFIG.SATELLITE_BASE_RADIUS;
  
  addSatellites(againCount, DIFFICULTY_LEVELS.AGAIN.color, currentRadius);
  currentRadius += PLANET_CONFIG.SATELLITE_RADIUS_INCREMENT;
  
  addSatellites(hardCount, DIFFICULTY_LEVELS.HARD.color, currentRadius);
  currentRadius += PLANET_CONFIG.SATELLITE_RADIUS_INCREMENT;
  
  addSatellites(goodCount, DIFFICULTY_LEVELS.GOOD.color, currentRadius);
  currentRadius += PLANET_CONFIG.SATELLITE_RADIUS_INCREMENT;
  
  addSatellites(easyCount, DIFFICULTY_LEVELS.EASY.color, currentRadius);

  return (
    <group position={position}>
      {/* Planet - Transparent glass effect with Earth texture for cet4 */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[PLANET_CONFIG.BASE_RADIUS, 64, 64]} />
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
          <sphereGeometry args={[PLANET_CONFIG.BASE_RADIUS, 32, 32]} />
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
        <sphereGeometry args={[PLANET_CONFIG.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Atmosphere glow - outer layer */}
      <mesh scale={1.15}>
        <sphereGeometry args={[PLANET_CONFIG.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmosphere glow - middle layer */}
      <mesh scale={1.08}>
        <sphereGeometry args={[PLANET_CONFIG.BASE_RADIUS, 32, 32]} />
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
