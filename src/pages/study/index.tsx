import React, { useEffect, useState } from 'react';
import { Button, Card as AntCard, Toast, NavBar, Slider, Popover, List } from 'antd-mobile';
import { history, useLocation } from 'umi';
import { SoundOutline, SetOutline } from 'antd-mobile-icons';
import { CardService } from '@/services/database/indexeddb/CardService';
import { Scheduler } from '@/services/scheduling/Scheduler';
import { Card } from '@/services/database/types';
import { tts } from '@/utils/tts';
import styles from './index.less';

const StudyPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const deckId = searchParams.get('deckId');

  const [cards, setCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // TTS Settings
  const [rate, setRate] = useState(1);

  const cardService = new CardService();
  const scheduler = new Scheduler();

  useEffect(() => {
    if (deckId) {
      loadCards();
    } else {
      Toast.show({ content: 'No deck selected', icon: 'fail' });
      history.push('/decks');
    }
  }, [deckId]);

  useEffect(() => {
    if (currentCard) {
      // Auto-play front when card loads
      playCardAudio(currentCard, 'front', 0);
    }
  }, [currentCard]);

  useEffect(() => {
    if (showAnswer && currentCard) {
      // Auto-play back when answer is shown
      playCardAudio(currentCard, 'back', 0);
    }
  }, [showAnswer]);

  const loadCards = async () => {
    setLoading(true);
    try {
      // 1. Get Due Cards (Review + Learning)
      // These are always deterministic based on 'due' timestamp
      const dueCards = await cardService.getDueCards(deckId!, 20);
      let sessionCards = [...dueCards];
      
      // 2. Get New Cards if we have space
      if (sessionCards.length < 20) {
        const limit = 20 - sessionCards.length;
        // Get order preference from localStorage
        const order = (localStorage.getItem('newCardOrder') as 'random' | 'sequential') || 'random';
        const newCards = await cardService.getNewCards(deckId!, limit, order);
        sessionCards = [...sessionCards, ...newCards];
      }

      if (sessionCards.length > 0) {
        setCards(sessionCards);
        setCurrentCard(sessionCards[0]);
      } else {
        setFinished(true);
      }
    } catch (error) {
      console.error(error);
      Toast.show({ content: 'Failed to load cards', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  const extractText = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';
    return text.trim();
  };

  const playCardAudio = (card: Card, side: 'front' | 'back', type: number = 0) => {
    // 1. Try to use the parsed 'word' field if available (cleanest for API)
    if (card.word) {
      tts.speak(card.word, { rate, type });
      return;
    }

    // 2. Fallback: Extract text from HTML
    const htmlContent = side === 'front' ? card.front : card.back;
    const text = extractText(htmlContent);
    if (text) {
      tts.speak(text, { rate, type });
    }
  };

  const handleAnswer = async (rating: number) => {
    if (!currentCard) return;

    const updatedCard = scheduler.answerCard(currentCard, rating);
    await cardService.updateCard(updatedCard);

    const remainingCards = cards.slice(1);
    
    if (remainingCards.length > 0) {
      setCards(remainingCards);
      setCurrentCard(remainingCards[0]);
      setShowAnswer(false);
    } else {
      setCards([]);
      setCurrentCard(null);
      setFinished(true);
    }
  };

  const renderSettings = () => (
    <List>
      <List.Item title="Speed">
        <Slider 
          min={0.5} 
          max={2} 
          step={0.1} 
          value={rate} 
          onChange={(val) => setRate(val as number)} 
        />
      </List.Item>
    </List>
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading cards...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className={styles.finished}>
        <div className={styles.icon}>🎉</div>
        <h2>All Done!</h2>
        <p>You have finished all cards for now.</p>
        <Button color='primary' onClick={() => history.push('/decks')}>Back to Decks</Button>
      </div>
    );
  }

  // Helper to remove {{...}} tags for display
  const cleanHtml = (html: string) => {
    return html.replace(/\{\{.*?\}\}/g, '');
  };

  return (
    <div className={styles.container}>
      <NavBar 
        onBack={() => history.push('/decks')}
        right={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Popover content={renderSettings()} trigger='click' placement='bottom-end'>
              <SetOutline fontSize={24} />
            </Popover>
          </div>
        }
      >
        Study
      </NavBar>
      
      <div className={styles.cardArea}>
        {currentCard && (
          <AntCard className={styles.flashcard}>
             <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Button size='mini' style={{ marginRight: '5px' }} onClick={(e) => { e.stopPropagation(); playCardAudio(currentCard, showAnswer ? 'back' : 'front', 0); }}>🇺🇸 US</Button>
                <Button size='mini' onClick={(e) => { e.stopPropagation(); playCardAudio(currentCard, showAnswer ? 'back' : 'front', 1); }}>🇬🇧 UK</Button>
             </div>
            <div 
              className={styles.cardContent}
              dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.front) }} 
            />
            {showAnswer && (
              <div className={styles.answerArea}>
                <div className={styles.divider} />
                <div 
                  className={styles.cardContent}
                  dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.back) }} 
                />
              </div>
            )}
          </AntCard>
        )}
      </div>

      <div className={styles.controls}>
        {!showAnswer ? (
          <Button 
            block 
            color="primary" 
            size="large"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </Button>
        ) : (
          <div className={styles.ratings}>
            <Button 
              className={styles.rateBtn} 
              color="danger" 
              onClick={() => handleAnswer(1)}
            >
              Again
            </Button>
            <Button 
              className={styles.rateBtn} 
              color="warning" 
              onClick={() => handleAnswer(2)}
            >
              Hard
            </Button>
            <Button 
              className={styles.rateBtn} 
              color="success" 
              onClick={() => handleAnswer(3)}
            >
              Good
            </Button>
            <Button 
              className={styles.rateBtn} 
              color="primary" 
              onClick={() => handleAnswer(4)}
            >
              Easy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPage;
