import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NavBar, Button } from 'antd-mobile';
import { history } from 'umi';
import Scene from './components/Scene';
import { getAllDecksProgress, DeckStats } from './utils/deckProgress';
import { DECKS } from '@/consts/decks';
import { SCENE_CONFIG } from '@/consts/home3d';
import styles from './index.less';

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
    <div className={styles.home3dContainer}>
      <NavBar
        back={null}
        className={styles.home3dNavbar}
        right={
          <Button
            size='small'
            onClick={handleBackToOriginal}
            className={styles.home3dBackButton}
          >
            Back to 2D
          </Button>
        }
      >
        Vocab Master 3D
      </NavBar>

      {!loading && (
        <Canvas
          camera={{ 
            position: [SCENE_CONFIG.INITIAL_CAMERA_POSITION.x, SCENE_CONFIG.INITIAL_CAMERA_POSITION.y, SCENE_CONFIG.INITIAL_CAMERA_POSITION.z], 
            fov: SCENE_CONFIG.CAMERA_FOV 
          }}
          className={styles.home3dCanvas}
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
            minDistance={SCENE_CONFIG.CAMERA_MIN_DISTANCE}
            maxDistance={SCENE_CONFIG.CAMERA_MAX_DISTANCE}
          />
        </Canvas>
      )}

      {/* Instructions overlay */}
      <div className={styles.home3dInstructions}>
        <p className={styles.home3dInstructionsTitle}>Drag to rotate • Scroll to zoom • Click planet to study</p>
        {/* <p className={styles.home3dInstructionsLegend}>
          🔴 Low Proficiency • 🟡 Medium • 🟢 High
        </p> */}
      </div>
    </div>
  );
}
