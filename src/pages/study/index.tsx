import React, { useState, useEffect } from 'react';
import { useSearchParams, history } from 'umi';
import { Button, NavBar, Loading, Toast } from 'antd-mobile';
import Flashcard from '@/components/Flashcard';
import { getWords } from '@/utils/data';
import { Word, UserProgress } from '@/interfaces';
import { calculateNextReview, getInitialProgress } from '@/utils/scheduler';
import { saveProgress, getProgress } from '@/utils/storage';
import { SESSION_WORDS_COUNT } from '@/consts';

export default function StudyPage() {
    const [searchParams] = useSearchParams();
    const deckId = searchParams.get('deck') || 'cet4';

    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const data = await getWords(deckId);
            // Filter words that are due for review (mock logic for now: show all or just first 10)
            // In a real app, we would filter based on getProgress(word.id).next_review_time < Date.now()
            
            // For demo, let's shuffle and take a fixed number of words if it's a large deck
            let sessionWords = data;
            if (data.length > SESSION_WORDS_COUNT) {
                sessionWords = [...data].sort(() => Math.random() - 0.5).slice(0, SESSION_WORDS_COUNT);
            }
            
            setWords(sessionWords);
            setLoading(false);
        }
        loadData();
    }, [deckId]);

    const handleFlip = () => {
        if (!isFlipped) {
            setIsFlipped(true);
        }
    };

    const handleScore = (score: number) => {
        const currentWord = words[currentIndex];
        const previousProgress = getProgress(currentWord.id) || getInitialProgress(currentWord.id);

        const reviewResult = calculateNextReview(
            previousProgress.interval,
            previousProgress.ease_factor,
            score
        );

        const newProgress: UserProgress = {
            ...previousProgress,
            next_review_time: reviewResult.nextReviewTime,
            interval: reviewResult.interval,
            ease_factor: reviewResult.easeFactor,
            history: [
                ...previousProgress.history,
                { date: Date.now(), score }
            ]
        };

        saveProgress(newProgress);

        Toast.show({
            content: 'Saved',
            duration: 500,
        });

        if (currentIndex < words.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        } else {
            Toast.show({
                content: 'Session Complete!',
                icon: 'success',
            });
            setTimeout(() => history.push('/'), 1000);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loading />
            </div>
        );
    }

    if (words.length === 0) {
        return (
             <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
                <NavBar onBack={() => history.back()}>Study: {deckId}</NavBar>
                <div style={{ padding: '0.2rem', textAlign: 'center' }}>No words found in this deck.</div>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <NavBar onBack={() => history.back()}>Study: {deckId}</NavBar>

            <div style={{ flex: 1, padding: '0.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: '0.2rem', textAlign: 'center', color: '#888' }}>
                    Word {currentIndex + 1} / {words.length}
                </div>

                <Flashcard
                    word={currentWord}
                    isFlipped={isFlipped}
                    onFlip={handleFlip}
                />
            </div>

            {isFlipped && (
                <div style={{
                    padding: '0.2rem',
                    background: 'white',
                    borderTopLeftRadius: '0.16rem',
                    borderTopRightRadius: '0.16rem',
                    boxShadow: '0 -0.02rem 0.1rem rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.1rem' }}>
                        <Button block color='danger' onClick={() => handleScore(1)}>
                            Again
                            <div style={{ fontSize: '0.4rem', opacity: 0.8 }}>&lt; 1m</div>
                        </Button>
                        <Button block color='warning' onClick={() => handleScore(5)}>
                            Hard
                            <div style={{ fontSize: '0.4rem', opacity: 0.8 }}>2d</div>
                        </Button>
                        <Button block color='primary' fill='outline' onClick={() => handleScore(8)}>
                            Good
                            <div style={{ fontSize: '0.4rem', opacity: 0.8 }}>2w</div>
                        </Button>
                        <Button block color='success' fill='outline' onClick={() => handleScore(10)}>
                            Easy
                            <div style={{ fontSize: '0.4rem', opacity: 0.8 }}>1mo</div>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
