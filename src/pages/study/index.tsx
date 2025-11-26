import React, { useState, useEffect } from 'react';
import { useSearchParams, history } from 'umi';
import { Button, NavBar, Loading, Toast } from 'antd-mobile';
import Flashcard from '@/components/Flashcard';
import { getWords } from '@/utils/data';
import { Word, UserProgress, StudySession } from '@/interfaces';
import { calculateNextReview, getInitialProgress } from '@/utils/scheduler';
import { saveProgress, getProgress, saveSession, loadCurrentSession, loadSession, clearSession, createSession } from '@/utils/storage/progress';
import { SESSION_WORDS_COUNT } from '@/consts';

export default function StudyPage() {
    const [searchParams] = useSearchParams();
    const deckId = searchParams.get('deck') || 'cet4';

    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentSession, setCurrentSession] = useState<StudySession | null>(null);

    useEffect(() => {
        async function loadData() {
            const data = await getWords(deckId);
            let sessionWords = data;
            let initialIndex = 0;
            let currentSession: StudySession | null = null;
            
            // 优先处理 sessionId 参数
            const targetSessionId = searchParams.get('sessionId');
            const targetWordId = searchParams.get('initialWordId') || searchParams.get('wordId');

            if (targetSessionId) {
                // 加载指定会话
                const session = loadSession(targetSessionId);
                if (session) {
                    currentSession = session;
                    sessionWords = session.words.map(item => {
                        return data.find(word => word.id === item.id);
                    }).filter(Boolean) as Word[];
                    
                    // 如果指定了单词ID，跳转到该单词
                    if (targetWordId) {
                        const wordIndex = session.words.findIndex(item => item.id === targetWordId);
                        if (wordIndex !== -1) {
                            initialIndex = wordIndex;
                        } else {
                            initialIndex = session.currentIndex;
                        }
                    } else {
                        initialIndex = session.currentIndex;
                    }
                }
            } 
            // 如果没有 sessionId 但有 wordId (旧逻辑兼容)
            else if (targetWordId) {
                // 如果指定了单词ID，找到该单词在列表中的位置
                const wordIndex = data.findIndex(word => word.id === targetWordId);
                if (wordIndex !== -1) {
                    // 加载整个卡组，并设置初始索引为目标单词的位置
                    sessionWords = data;
                    initialIndex = wordIndex;
                    
                    // 创建新的学习会话
                    currentSession = createSession(deckId, sessionWords.map(word => word.id));
                }
            } else {
                // 否则，检查是否有当前活跃会话
                const savedSession = loadCurrentSession();
                if (savedSession && savedSession.deckId === deckId && !savedSession.completed) {
                    // 如果有已保存的会话且未完成，使用已保存的单词列表和当前索引
                    currentSession = savedSession;
                    sessionWords = savedSession.words.map(item => {
                        return data.find(word => word.id === item.id) || data[0];
                    }).filter(Boolean) as Word[];
                    initialIndex = savedSession.currentIndex;
                } else {
                    // 否则，随机选择一定数量的单词
                    if (data.length > SESSION_WORDS_COUNT) {
                        sessionWords = [...data].sort(() => Math.random() - 0.5).slice(0, SESSION_WORDS_COUNT);
                    }
                    
                    // 创建新的学习会话
                    currentSession = createSession(deckId, sessionWords.map(word => word.id));
                }
            }
            
            setWords(sessionWords);
            setCurrentIndex(initialIndex);
            setCurrentSession(currentSession);
            setLoading(false);
        }
        loadData();
    }, [deckId, searchParams]);

    const handleFlip = () => {
        if (!isFlipped) {
            setIsFlipped(true);
        }
    };

    const handleScore = (score: number) => {
        if (!currentSession) return;
        
        const currentWord = words[currentIndex];
        const previousProgress = getProgress(deckId, currentWord.id) || getInitialProgress(currentWord.id);

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

        saveProgress(deckId, newProgress);

        Toast.show({
            content: 'Saved',
            duration: 500,
        });

        // 更新会话中的单词结果
        const updatedWords = [...currentSession.words];
        // 找到当前单词在会话中的索引（注意：words数组和currentSession.words数组是对应的）
        if (updatedWords[currentIndex]) {
            updatedWords[currentIndex] = {
                ...updatedWords[currentIndex],
                result: score
            };
        }

        if (currentIndex < words.length - 1) {
            // 更新学习会话的当前索引
            const nextIndex = currentIndex + 1;
            const updatedSession: StudySession = {
                ...currentSession,
                words: updatedWords,
                currentIndex: nextIndex,
                updatedAt: Date.now(),
                completed: false
            };
            
            saveSession(updatedSession);
            setCurrentSession(updatedSession);
            
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        } else {
            // 学习会话完成，更新会话状态为已完成
            const completedSession: StudySession = {
                ...currentSession,
                words: updatedWords,
                currentIndex: currentIndex,
                updatedAt: Date.now(),
                completed: true
            };
            
            saveSession(completedSession);
            
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
