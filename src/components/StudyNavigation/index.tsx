import React from 'react';
import { Button } from 'antd-mobile';
import styles from './index.less';

interface StudyNavigationProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
  currentCard?: any;
}

const StudyNavigation: React.FC<StudyNavigationProps> = ({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
  currentCard,
}) => {
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === totalCards - 1;
  const progress = `${currentIndex + 1}/${totalCards}`;

  return (
    <div className={styles.container}>
      {/* Left: Back button */}
      <div className={styles.left}>
        <Button
          size="small"
          color="primary"
          fill="none"
          onClick={onPrevious}
          disabled={isFirstCard}
        >
          Previous
        </Button>
      </div>

      {/* Middle: Current word */}
      <div className={styles.middle}>
        {currentCard?.word || 'Loading...'}
      </div>

      {/* Right: Next button and progress */}
      <div className={styles.right}>
        <Button
          size="small"
          color="primary"
          fill="none"
          onClick={onNext}
          disabled={isLastCard}
        >
          Next
        </Button>
        <div className={styles.progress}>{progress}</div>
      </div>
    </div>
  );
};

export default StudyNavigation;
