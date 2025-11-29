import React from 'react';
import { Button } from 'antd-mobile';
import { Card } from '@/services/database/types';
import './index.less';

interface FlashcardProps {
  currentCard: Card;
  isFlipped: boolean;
  onFlip: () => void;
  onPlayAudio: (card: Card, side: string, accentIndex: number) => void;
  cleanHtml: (html: string) => string;
}

/**
 * 闪卡组件
 * 支持正反两面展示和音频播放功能
 */
export default function Flashcard({
  currentCard,
  isFlipped,
  onFlip,
  onPlayAudio,
  cleanHtml
}: FlashcardProps) {
  const handleAudioClick = (e: React.MouseEvent, side: string, accentIndex: number) => {
    e.stopPropagation();
    onPlayAudio(currentCard, side, accentIndex);
  };

  return (
    <div 
      className={`flashcard-container flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
    >
      {/* Front Face */}
      <div className="card-face card-front">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <Button size='mini' style={{ marginRight: '5px' }} onClick={(e) => handleAudioClick(e, 'front', 0)}>🇺🇸 US</Button>
          <Button size='mini' onClick={(e) => handleAudioClick(e, 'front', 1)}>🇬🇧 UK</Button>
        </div>
        <div
          className="card-content"
          dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.front) }}
        />
      </div>

      {/* Back Face */}
      <div className="card-face card-back">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <Button size='mini' style={{ marginRight: '5px' }} onClick={(e) => handleAudioClick(e, 'back', 0)}>🇺🇸 US</Button>
          <Button size='mini' onClick={(e) => handleAudioClick(e, 'back', 1)}>🇬🇧 UK</Button>
        </div>
        <div
          className="card-content"
          dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.front) }}
        />
        <div className="answer-area">
          <div className="divider" />
          <div
            className="card-content"
            dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.back) }}
          />
        </div>
      </div>
    </div>
  );
}