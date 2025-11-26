import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Planet from './Planet';
import { DeckStats } from '../utils/deckProgress';

interface Deck {
  id: string;
  name: string;
  color: string;
}

interface SceneProps {
  decks: Deck[];
  decksProgress: Record<string, DeckStats>;
  onDeckClick: (deckId: string) => void;
}

export default function Scene({ decks, decksProgress, onDeckClick }: SceneProps) {
  const starsRef = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.05;
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
  const radius = 5;
  const angleStep = (Math.PI * 2) / decks.length;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4466ff" />

      {/* Starfield */}
      <points ref={starsRef} geometry={starsGeometry} material={starsMaterial} />

      {/* Planets */}
      {decks.map((deck, index) => {
        const angle = index * angleStep;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <Planet
            key={deck.id}
            position={[x, 0, z]}
            deckName={deck.name}
            deckId={deck.id}
            stats={decksProgress[deck.id] || { totalWords: 0, lowProficiency: [], mediumProficiency: [], highProficiency: [] }}
            color={deck.color}
            onClick={() => onDeckClick(deck.id)}
          />
        );
      })}
    </>
  );
}
