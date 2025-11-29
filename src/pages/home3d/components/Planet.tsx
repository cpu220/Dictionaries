import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Satellite from './Satellite';
import { DeckStats } from '../utils/deckProgress';
import { PlanetConfig, SatelliteConfig } from '@/consts/home3d';
import { DIFFICULTY_LEVELS } from '@/consts/difficulty';
import './Planet.less';

interface PlanetProps {
  position: [number, number, number];
  deckName: string;
  deckId: string;
  stats: DeckStats;
  color: string;
  textureUrl?: string;
  planetConfig: PlanetConfig;
  satelliteConfig: SatelliteConfig;
  onClick: () => void;
}

export default function Planet({ position, deckName, deckId, stats, color, textureUrl, planetConfig, satelliteConfig, onClick }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Load texture if URL is provided
  const texture = textureUrl ? useLoader(THREE.TextureLoader, textureUrl) : null;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * planetConfig.ROTATION_SPEED * 2; // 稍微增加旋转速度，使自转更明显
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
      const orbitRadius = baseRadius + Math.random() * planetConfig.SATELLITE_RADIUS_VARIATION;
      const orbitSpeed = satelliteConfig.ORBIT_SPEED_MIN + Math.random() * satelliteConfig.ORBIT_SPEED_RANGE;
      const initialAngle = Math.random() * Math.PI * 2;
      
      // Random orbital inclination (tilt)
      // Rotate mainly around X and Z axes to tilt the orbital plane
      const tiltX = (Math.random() - 0.5) * Math.PI; // +/- 90 degrees tilt
      const tiltZ = (Math.random() - 0.5) * Math.PI; // +/- 90 degrees tilt
      
      satellites.push(
        <group key={`${color}-${i}`} rotation={[tiltX, 0, tiltZ]}>
          <Satellite
            color={color}
            orbitRadius={orbitRadius}
            orbitSpeed={orbitSpeed}
            initialAngle={initialAngle}
            config={satelliteConfig}
          />
        </group>
      );
    }
  };

  // Limit total satellites
  const totalWords = stats.totalWords;
  const maxSatellites = planetConfig.MAX_SATELLITES;
  const scaleFactor = totalWords > maxSatellites ? maxSatellites / totalWords : 1;
  
  const againCount = Math.floor(stats.again.length * scaleFactor);
  const hardCount = Math.floor(stats.hard.length * scaleFactor);
  const goodCount = Math.floor(stats.good.length * scaleFactor);
  const easyCount = Math.floor(stats.easy.length * scaleFactor);

  let currentRadius = planetConfig.SATELLITE_BASE_RADIUS;
  
  addSatellites(againCount, DIFFICULTY_LEVELS.AGAIN.color, currentRadius);
  currentRadius += planetConfig.SATELLITE_RADIUS_INCREMENT;
  
  addSatellites(hardCount, DIFFICULTY_LEVELS.HARD.color, currentRadius);
  currentRadius += planetConfig.SATELLITE_RADIUS_INCREMENT;
  
  addSatellites(goodCount, DIFFICULTY_LEVELS.GOOD.color, currentRadius);
  currentRadius += planetConfig.SATELLITE_RADIUS_INCREMENT;
  
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
        <sphereGeometry args={[planetConfig.BASE_RADIUS, 64, 64]} />
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
          <sphereGeometry args={[planetConfig.BASE_RADIUS, 32, 32]} />
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
        <sphereGeometry args={[planetConfig.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Atmosphere glow - outer layer */}
      <mesh scale={1.15}>
        <sphereGeometry args={[planetConfig.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmosphere glow - middle layer */}
      <mesh scale={1.08}>
        <sphereGeometry args={[planetConfig.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Deck name label using HTML */}
      <Html position={[0, 1.8, 0]} center>
        <div className="planet-name">
          {deckName}
        </div>
      </Html>

      {/* Word count label */}
      <Html position={[0, 1.4, 0]} center>
        <div className="planet-word-count">
          {stats.totalWords} words
        </div>
      </Html>

      {/* Satellites */}
      {satellites}
    </group>
  );
}
