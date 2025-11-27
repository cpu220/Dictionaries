import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Planet from './Planet';
import { DeckStats } from '../utils/deckProgress';
import { DeckConfig } from '@/consts/decks';
import { PLANET_CONFIG, SATELLITE_CONFIG, SCENE_CONFIG } from '@/consts/home3d';

interface SceneProps {
  decks: DeckConfig[];
  decksProgress: Record<string, DeckStats>;
  onDeckClick: (deckId: string) => void;
}

export default function Scene({ decks, decksProgress, onDeckClick }: SceneProps) {
  const starsRef = useRef<THREE.Points>(null);
  const solarSystemRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * SCENE_CONFIG.STARS_ROTATION_SPEED;
    }
    
    // Rotate the entire solar system
    if (solarSystemRef.current) {
      solarSystemRef.current.rotation.y += delta * PLANET_CONFIG.ORBIT_ROTATION_SPEED;
    }
  });

  // Create starfield background
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
  });

  const starsVertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    starsVertices.push(x, y, z);
  }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));

  // Position planets in a circular layout
  // Position planets in a circular layout

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4466ff" />

      {/* Starfield */}
      <points ref={starsRef} geometry={starsGeometry} material={starsMaterial} />

      {/* Central Sun / Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} distance={20} color="#ffaa00" />

      {/* Planets - 围绕中心点旋转 */}
      {/* Solar System Container - Rotates around center */}
      <group ref={solarSystemRef}>
        {decks.map((deck, index) => {
          // Merge configurations
          const planetConfig = { ...PLANET_CONFIG, ...deck.planetConfig };
          const satelliteConfig = { ...SATELLITE_CONFIG, ...deck.satelliteConfig };

          // 获取该星球的轨道半径
          const radius = planetConfig.ORBIT_RADIUS;
            
          // 随机分布起始角度，避免所有星球排成一条线
          const angle = (index / decks.length) * Math.PI * 2; 
          
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          return (
            <Planet
              key={deck.id}
              position={[x, 0, z]}
              deckName={deck.name}
              deckId={deck.id}
              stats={decksProgress[deck.id] || { totalWords: 0, again: [], hard: [], good: [], easy: [] }}
              color={deck.color}
              textureUrl={deck.textureUrl}
              planetConfig={planetConfig}
              satelliteConfig={satelliteConfig}
              onClick={() => onDeckClick(deck.id)}
            />
          );
        })}
      </group>
    </>
  );
}
