import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NavBar, Button } from 'antd-mobile';
import { history } from 'umi';
import Scene from './components/Scene';
import { getAllDecksProgress, DeckStats } from './utils/deckProgress';
import { DECKS } from '@/consts/decks';

export default function Home3D() {
  const [decksProgress, setDecksProgress] = useState<Record<string, DeckStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load progress data
    async function loadProgress() {
      const deckIds = DECKS.map(d => d.id);
      const progress = await getAllDecksProgress(deckIds);
      console.log('3D Home - Loaded progress:', progress);
      setDecksProgress(progress);
      setLoading(false);
    }
    loadProgress();
  }, []);

  const handleDeckClick = (deckId: string) => {
    history.push(`/study?deck=${deckId}`);
  };

  const handleBackToOriginal = () => {
    history.push('/');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000' }}>
      <NavBar
        back={null}
        style={{ 
          background: 'rgba(0, 0, 0, 0.8)', 
          color: '#ffffff',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        right={
          <Button
            size='small'
            onClick={handleBackToOriginal}
            style={{ fontSize: '0.12rem' }}
          >
            Back to 2D
          </Button>
        }
      >
        Vocab Master 3D
      </NavBar>

      {!loading && (
        <Canvas
          camera={{ position: [0, 5, 12], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Scene 
            decks={DECKS}
            decksProgress={decksProgress}
            onDeckClick={handleDeckClick}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
          />
        </Canvas>
      )}

      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: '0.2rem',
        left: '0.2rem',
        right: '0.2rem',
        color: 'white',
        textAlign: 'center',
        fontSize: '0.14rem',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '0.1rem',
        borderRadius: '0.08rem',
        zIndex: 10,
      }}>
        <p style={{ margin: '0 0 0.05rem 0' }}>🖱️ Drag to rotate • 🔍 Scroll to zoom • Click planet to study</p>
        <p style={{ margin: 0, fontSize: '0.12rem', color: '#aaa' }}>
          🔴 Low Proficiency • 🟡 Medium • 🟢 High
        </p>
      </div>
    </div>
  );
}
