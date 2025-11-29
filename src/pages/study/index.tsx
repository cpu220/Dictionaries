import React, { useEffect, useState } from 'react';
import { Button, Card as AntCard, Toast, NavBar, Slider, Popover, List } from 'antd-mobile';
import { history, useLocation } from 'umi';
import { SoundOutline, SetOutline } from 'antd-mobile-icons';
import { CardService } from '@/services/database/indexeddb/CardService';
import { StatsService } from '@/services/database/indexeddb/StatsService';
import { Scheduler } from '@/services/scheduling/Scheduler';
import { Card } from '@/services/database/types';
import { StudySession } from '@/interfaces';
import {
  loadCurrentSession,
  createSession,
  saveSession,
  clearSession,
  getSessionsMap
} from '@/utils/storage/progress';
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
  const [session, setSession] = useState<StudySession | null>(null);

  // TTS Settings
  const [rate, setRate] = useState(1);

  const cardService = new CardService();
  const statsService = new StatsService();
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
      // Check for existing session for this deck
      const existingSession = loadCurrentSession();

      if (existingSession && existingSession.deckId === deckId && !existingSession.completed) {
        // Restore session: load cards by IDs from session
        const cardIds = existingSession.words.map(w => w.id);
        const restoredCards = await Promise.all(
          cardIds.map(id => cardService.getCard(id))
        );
        const validCards = restoredCards.filter(c => c !== undefined) as Card[];

        // Resume from currentIndex
        const remainingCards = validCards.slice(existingSession.currentIndex);

        if (remainingCards.length > 0) {
          setCards(validCards);
          setCurrentCard(remainingCards[0]);
          setSession(existingSession);
          Toast.show({ content: `Resuming from card ${existingSession.currentIndex + 1}/${validCards.length}`, icon: 'success' });
        } else {
          // Session was already completed
          setFinished(true);
        }
      } else {
        // No existing session or session is for different deck - create new session
        // 1. Get Due Cards (Review + Learning)
        const dueCards = await cardService.getDueCards(deckId!, 2);
        let sessionCards = [...dueCards];

        // 2. Get New Cards if we have space
        if (sessionCards.length < 20) {
          const limit = 20 - sessionCards.length;
          const order = (localStorage.getItem('newCardOrder') as 'random' | 'sequential') || 'random';
          const newCards = await cardService.getNewCards(deckId!, limit, order);
          sessionCards = [...sessionCards, ...newCards];
        }

        if (sessionCards.length > 0) {
          // Create new session
          const cardIds = sessionCards.map(c => c.id);
          const newSession = createSession(deckId!, cardIds);

          setCards(sessionCards);
          setCurrentCard(sessionCards[0]);
          setSession(newSession);
        } else {
          setFinished(true);
        }
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
    if (!currentCard || !session) return;

    const startTime = Date.now(); // In a real app, track actual time spent
    // For now, we'll estimate or just use a placeholder, or we could track time since card loaded
    // But to keep it simple, let's just assume a fixed time or 0 for now if we don't have a timer
    const timeTaken = 0;

    const updatedCard = scheduler.answerCard(currentCard, rating);
    await cardService.updateCard(updatedCard);

    // Log statistics
    await statsService.logReview(
      currentCard.id,
      currentCard.deck_id,
      rating,
      timeTaken,
      currentCard.type
    );

    // Update session progress
    const updatedSession: StudySession = {
      ...session,
      currentIndex: session.currentIndex + 1,
      updatedAt: Date.now(),
      words: session.words.map((w, idx) =>
        idx === session.currentIndex ? { ...w, result: rating } : w
      )
    };

    const remainingCards = cards.slice(session.currentIndex + 1);

    if (remainingCards.length > 0) {
      // Save progress and continue
      saveSession(updatedSession);
      setSession(updatedSession);
      setCurrentCard(remainingCards[0]);
      setShowAnswer(false);
    } else {
      // Mark session as completed
      const completedSession: StudySession = {
        ...updatedSession,
        completed: true
      };
      saveSession(completedSession);
      setSession(completedSession);
      setCards([]);
      setCurrentCard(null);
      setFinished(true);
    }
  };

  const renderSettings = () => (
    <div style={{ width: '300px' }}>
      <List header='Settings'>
        <List.Item
          title="Speech Rate"
          extra={`${rate.toFixed(1)}x`}
        >
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(val) => setRate(val as number)}
            marks={{
              0.5: '0.5',
              1.0: '1.0',
              1.5: '1.5',
              2.0: '2.0'
            }}
          />
        </List.Item>
      </List>
    </div>
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

  const handleCardClick = () => {
    if (!showAnswer) {
      // Front side: flip to show answer
      setShowAnswer(true);
      // Audio will be auto-played by useEffect when showAnswer becomes true
    }
    // Back side: do nothing, clicking just for interaction
    // Audio is already handled by US/UK buttons
  };

  return (
    <div className={styles.container}>
      <NavBar
        onBack={() => history.push('/decks')}
        right={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
          <div
            className={`${styles.flipContainer} ${showAnswer ? styles.flipped : ''}`}
            onClick={handleCardClick}
          >
            {/* Front Face */}
            <AntCard className={`${styles.flashcard} ${styles.cardFront}`}>
              <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Button size='mini' style={{ marginRight: '5px' }} onClick={(e) => { e.stopPropagation(); playCardAudio(currentCard, 'front', 0); }}>🇺🇸 US</Button>
                <Button size='mini' onClick={(e) => { e.stopPropagation(); playCardAudio(currentCard, 'front', 1); }}>🇬🇧 UK</Button>
              </div>
              <div
                className={styles.cardContent}
                dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.front) }}
              />
            </AntCard>

            {/* Back Face */}
            <AntCard className={`${styles.flashcard} ${styles.cardBack}`}>
              <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Button size='mini' style={{ marginRight: '5px' }} onClick={(e) => { e.stopPropagation(); playCardAudio(currentCard, 'back', 0); }}>🇺🇸 US</Button>
                <Button size='mini' onClick={(e) => { e.stopPropagation(); playCardAudio(currentCard, 'back', 1); }}>🇬🇧 UK</Button>
              </div>
              <div
                className={styles.cardContent}
                dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.front) }}
              />
              <div className={styles.answerArea}>
                <div className={styles.divider} />
                <div
                  className={styles.cardContent}
                  dangerouslySetInnerHTML={{ __html: cleanHtml(currentCard.back) }}
                />
              </div>
            </AntCard>
          </div>
        )}
      </div>
      {
        showAnswer && (
          <div className={styles.controls}>
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
          </div>
        )
      }

      {/* <div className={styles.controls}>
        {!showAnswer ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '10px' }}>
            点击卡片查看答案
          </div>
        ) : (
          
        )}
      </div> */}
    </div>
  );
};

export default StudyPage;
