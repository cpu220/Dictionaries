import React, { useEffect, useState } from 'react';
import { Button, Toast, List } from 'antd-mobile';
import { history, useLocation } from 'umi';
import SpeechSettingsPanel from '@/components/SpeechSettingsPanel';
import Flashcard from '@/components/Flashcard';
import StudyNavigation from '@/components/StudyNavigation';
import { SoundOutline, SetOutline, LeftOutline } from 'antd-mobile-icons';
import { CardService } from '@/services/database/indexeddb/CardService';
import { StatsService } from '@/services/database/indexeddb/StatsService';
import { Scheduler } from '@/services/scheduling/Scheduler';
import { Card } from '@/services/database/types';
import { StudySession } from '@/interfaces';
import {
  loadCurrentSession,
  createSession,
  saveSession,
   
} from '@/utils/storage/progress';
import { tts } from '@/utils/tts';
import { handleCardAudioPlay } from '@/utils/audioUtils';
import styles from './index.less';
import { MAX_CARDS_PER_SESSION } from '../../consts/decks';

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
  const [showSettings, setShowSettings] = useState(false);

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
        const dueCards = await cardService.getDueCards(deckId!, MAX_CARDS_PER_SESSION);
        let sessionCards = [...dueCards];

        // 2. Get New Cards if we have space
        if (sessionCards.length < MAX_CARDS_PER_SESSION) {
          const limit = MAX_CARDS_PER_SESSION - sessionCards.length;
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

  const handlePrevious = () => {
    if (!session || session.currentIndex <= 0) return;

    const updatedSession: StudySession = {
      ...session,
      currentIndex: session.currentIndex - 1,
      updatedAt: Date.now()
    };

    saveSession(updatedSession);
    setSession(updatedSession);
    setCurrentCard(cards[session.currentIndex - 1]);
    setShowAnswer(false);
  };

  const handleNext = () => {
    if (!session || session.currentIndex >= cards.length - 1) return;

    const updatedSession: StudySession = {
      ...session,
      currentIndex: session.currentIndex + 1,
      updatedAt: Date.now()
    };

    saveSession(updatedSession);
    setSession(updatedSession);
    setCurrentCard(cards[session.currentIndex + 1]);
    setShowAnswer(false);
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

  // 不再需要renderSettings函数，设置面板直接在JSX中实现

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
  };

  const handlePlayAudio = (card: any, side: string, accentIndex: number) => {
    // 直接传递card对象，由audioUtils处理word的提取和使用
    handleCardAudioPlay(card, side, accentIndex, cleanHtml, rate);
  };
  
  return (
    <div className={styles.container}>
      {/* Header with back to decks button */}
      <div className={styles.header}>
        <Button size='mini' color='primary' fill='none' onClick={() => history.back()}>
          <LeftOutline />
        </Button>
        <h1 className={styles.headerTitle}>Study</h1>
        <div className={styles.headerActions}>
          <div onClick={() => setShowSettings(!showSettings)} className={styles.headerActionItem}>
            <SetOutline fontSize={24} />
          </div>
          {showSettings && <SpeechSettingsPanel rate={rate} onRateChange={setRate} />}
        </div>
      </div>

      {/* Study Navigation Component */}
      {session && (
        <StudyNavigation
          currentIndex={session.currentIndex}
          totalCards={cards.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          currentCard={currentCard}
        />
      )}

      <div className={styles.cardArea}>
        {currentCard && (
          <Flashcard
            currentCard={currentCard}
            isFlipped={showAnswer}
            onFlip={handleCardClick}
            onPlayAudio={handlePlayAudio}
            cleanHtml={cleanHtml}
          />
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
          <div className={styles.tapHint}>
            点击卡片查看答案
          </div>
        ) : (
          
        )}
      </div> */}
    </div>
  );
};

export default StudyPage;
