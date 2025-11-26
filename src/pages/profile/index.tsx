import React, { useState, useEffect } from 'react';
import { NavBar, Card, List, Empty, Tag, ProgressBar } from 'antd-mobile';
import { history } from 'umi';
import { getWords } from '@/utils/data';
import { getSessionsMap, loadSession } from '@/utils/storage/progress';
import { Word, StudySession } from '@/interfaces';

export default function ProfilePage() {
    const [allWords, setAllWords] = useState<Word[]>([]);
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            // 加载所有单词数据，用于显示单词详情
            const words = await getWords('cet4');
            setAllWords(words);
            
            // 加载会话映射
            const map = getSessionsMap();
            
            // 加载所有会话数据
            const loadedSessions: StudySession[] = [];
            if (map && map.sessions) {
                // 倒序加载，最新的在前面
                for (let i = map.sessions.length - 1; i >= 0; i--) {
                    const sessionId = map.sessions[i];
                    const session = loadSession(sessionId);
                    if (session) {
                        loadedSessions.push(session);
                    }
                }
            }
            setSessions(loadedSessions);
            setLoading(false);
        }
        loadData();
    }, []);

    // 获取会话中的单词详情
    const getSessionWords = (session: StudySession): Word[] => {
        return session.wordList.map(wordId => allWords.find(w => w.id === wordId)).filter(Boolean) as Word[];
    };

    // 点击单词跳转到study页面
    const handleWordClick = (e: React.MouseEvent, session: StudySession, wordId: string) => {
        e.stopPropagation(); // 防止触发卡片点击
        // 跳转到study页面，并传递卡包ID、会话ID和单词ID
        // 注意：这里我们需要传递 sessionId 让 study 页面加载这个特定的会话
        // 同时也传递 wordId 以便直接定位到这个单词（如果 study 页面支持的话）
        history.push(`/study?deck=${session.deckId}&sessionId=${session.id}&initialWordId=${wordId}`);
    };

    // 点击卡片，展示或隐藏单词列表
    const handleCardClick = (sessionId: string) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null);
        } else {
            setExpandedSessionId(sessionId);
        }
    };

    // 格式化日期
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <NavBar onBack={() => history.back()}>学习记录</NavBar>

            <div style={{ padding: '0.2rem' }}>
                <h3 style={{ marginBottom: '0.2rem' }}>我的学习会话</h3>
                
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#888' }}>
                        <p>加载中...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <Empty description="暂无学习记录" />
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start' // 确保卡片顶部对齐
                    }}>
                        {sessions.map(session => {
                            const sessionWords = getSessionWords(session);
                            const progress = Math.round(((session.currentIndex + 1) / session.wordList.length) * 100);
                            const isExpanded = expandedSessionId === session.id;
                            
                            return (
                                <div 
                                    key={session.id} 
                                    style={{ 
                                        width: isExpanded ? '100%' : '48%', // 展开时占满一行
                                        marginBottom: '0.2rem',
                                        transition: 'width 0.3s ease'
                                    }}
                                >
                                    <Card 
                                        style={{ 
                                            height: '100%',
                                            cursor: 'pointer',
                                            border: isExpanded ? '1px solid #1677ff' : 'none'
                                        }}
                                        onClick={() => handleCardClick(session.id)}
                                    >
                                        <div style={{ marginBottom: '0.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold' }}>{formatDate(session.createdAt)}</span>
                                            {session.completed ? (
                                                <Tag color="success">已完成</Tag>
                                            ) : (
                                                <Tag color="processing">进行中</Tag>
                                            )}
                                        </div>
                                        
                                        <div style={{ marginBottom: '0.1rem', fontSize: '0.28rem', color: '#666' }}>
                                            共 {session.wordList.length} 个单词
                                        </div>
                                        
                                        <div style={{ marginBottom: '0.1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.24rem', marginBottom: '0.05rem', color: '#888' }}>
                                                <span>进度</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <ProgressBar percent={progress} />
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: '0.2rem', borderTop: '1px solid #eee', paddingTop: '0.2rem' }}>
                                                <List header="单词列表">
                                                    {sessionWords.map((word, index) => {
                                                        const isLearned = index <= session.currentIndex;
                                                        return (
                                                            <List.Item
                                                                key={word.id}
                                                                onClick={(e) => handleWordClick(e, session, word.id)}
                                                                clickable
                                                                extra={isLearned ? <span style={{ color: '#52c41a' }}>已学</span> : <span style={{ color: '#faad14' }}>未学</span>}
                                                            >
                                                                <span style={{ fontWeight: 'bold' }}>{word.word}</span>
                                                                <div style={{ fontSize: '0.24rem', color: '#888', marginTop: '0.05rem' }}>{word.translation}</div>
                                                            </List.Item>
                                                        );
                                                    })}
                                                </List>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
