import React, { useState, useEffect } from 'react';
import { NavBar, Card as AntdCard, List, Empty, Tag, ProgressBar, Switch, Radio, Space } from 'antd-mobile';
import { SetOutline } from 'antd-mobile-icons';
import { history } from 'umi';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { CardService } from '@/services/database/indexeddb/CardService';
import { StatsService } from '@/services/database/indexeddb/StatsService';
import { Deck, DailyStudyStat, Card } from '@/services/database/types';

export default function ProfilePage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [totalCards, setTotalCards] = useState(0);
    const [learnedCards, setLearnedCards] = useState(0);
    const [newCardOrder, setNewCardOrder] = useState<'random' | 'sequential'>('random');
    const [loading, setLoading] = useState(true);
    const [dailyStats, setDailyStats] = useState<DailyStudyStat | null>(null);
    
    // Inline expansion state
    const [expandedTodayLearned, setExpandedTodayLearned] = useState(false);
    const [todayLearnedCards, setTodayLearnedCards] = useState<Card[]>([]);
    
    const [expandedAllLearned, setExpandedAllLearned] = useState(false);
    const [allLearnedCards, setAllLearnedCards] = useState<Card[]>([]);

    const [expandedDecksList, setExpandedDecksList] = useState(false);

    const deckService = new DeckService();
    const cardService = new CardService();
    const statsService = new StatsService();

    useEffect(() => {
        loadData();
        loadSettings();
    }, []);

    const loadData = async () => {
        // 1. Sync stats for all decks first to ensure accuracy
        const allDecksInitial = await deckService.getAllDecks();
        await Promise.all(allDecksInitial.map(d => statsService.syncDeckStats(d.id)));

        // 2. Reload decks with updated stats
        const allDecks = await deckService.getAllDecks();
        setDecks(allDecks);
        
        let total = 0;
        let learned = 0;
        allDecks.forEach(d => {
            total += d.total_cards;
            learned += d.learned_cards || 0;
        });
        setTotalCards(total);
        setLearnedCards(learned);

        // Load Stats
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await statsService.getDailyStats(today);
        if (todayStats) {
            setDailyStats(todayStats);
        }

        setLoading(false);
    };

    const loadSettings = () => {
        const storedOrder = localStorage.getItem('newCardOrder');
        if (storedOrder === 'sequential') {
            setNewCardOrder('sequential');
        } else {
            setNewCardOrder('random');
        }
    };

    const handleOrderChange = (value: 'random' | 'sequential') => {
        setNewCardOrder(value);
        localStorage.setItem('newCardOrder', value);
    };

    const toggleTodayLearned = async () => {
        if (!expandedTodayLearned && todayLearnedCards.length === 0) {
            const ids = await statsService.getLearnedCardsByDate(new Date());
            const cards = await Promise.all(ids.map(id => cardService.getCard(id)));
            setTodayLearnedCards(cards.filter(c => c !== undefined) as Card[]);
        }
        setExpandedTodayLearned(!expandedTodayLearned);
    };

    const toggleAllLearned = async () => {
        if (!expandedAllLearned && allLearnedCards.length === 0) {
            const cards = await cardService.getLearnedCards();
            setAllLearnedCards(cards);
        }
        setExpandedAllLearned(!expandedAllLearned);
    };

    const renderCardList = (cards: Card[]) => (
        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fafafa', padding: '10px', marginTop: '10px', borderRadius: '8px' }}>
            {cards.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999' }}>No cards found</div>
            ) : (
                <List>
                    {cards.map(card => (
                        <List.Item key={card.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold' }}>{card.word || extractText(card.front)}</span>
                                <span style={{ color: '#666', fontSize: '12px' }}>{extractText(card.back).substring(0, 20)}...</span>
                            </div>
                        </List.Item>
                    ))}
                </List>
            )}
        </div>
    );

    const renderDecksList = () => (
        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fafafa', padding: '10px', marginTop: '10px', borderRadius: '8px' }}>
            <List>
                {decks.map(deck => (
                    <List.Item key={deck.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{deck.name}</span>
                            <span style={{ color: '#666' }}>{deck.learned_cards || 0}/{deck.total_cards}</span>
                        </div>
                    </List.Item>
                ))}
            </List>
        </div>
    );

    const extractText = (html: string) => {
        // Remove Anki template tags like {{FrontSide}}
        let text = html.replace(/\{\{.*?\}\}/g, '');
        // Remove HTML tags
        const tmp = document.createElement('DIV');
        tmp.innerHTML = text;
        return (tmp.textContent || tmp.innerText || '').trim();
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <NavBar 
              onBack={() => history.push('/')} 
              right={
                <SetOutline 
                  onClick={() => history.push('/settings')}
                  style={{ fontSize: '20px', cursor: 'pointer' }}
                />
              }
            >个人中心</NavBar>

            <div style={{ padding: '0.2rem' }}>
                <AntdCard title="Today's Progress" style={{ marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                                {dailyStats?.total_cards || 0}
                            </div>
                            <div style={{ color: '#666' }}>Reviewed</div>
                        </div>
                        <div onClick={toggleTodayLearned} style={{ cursor: 'pointer' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                {dailyStats?.learned_cards || 0} {expandedTodayLearned ? '▲' : '▼'}
                            </div>
                            <div style={{ color: '#666' }}>Learned</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                                {dailyStats ? Math.round(dailyStats.time_spent / 1000 / 60) : 0}m
                            </div>
                            <div style={{ color: '#666' }}>Time</div>
                        </div>
                    </div>
                    {expandedTodayLearned && renderCardList(todayLearnedCards)}
                </AntdCard>

                <AntdCard title="Overall Statistics" style={{ marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>{totalCards}</div>
                            <div style={{ color: '#666' }}>Total Cards</div>
                        </div>
                        <div onClick={toggleAllLearned} style={{ cursor: 'pointer' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                {learnedCards} {expandedAllLearned ? '▲' : '▼'}
                            </div>
                            <div style={{ color: '#666' }}>Learned</div>
                        </div>
                        <div onClick={() => setExpandedDecksList(!expandedDecksList)} style={{ cursor: 'pointer' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                                {decks.length} {expandedDecksList ? '▲' : '▼'}
                            </div>
                            <div style={{ color: '#666' }}>Decks</div>
                        </div>
                    </div>
                    {expandedAllLearned && renderCardList(allLearnedCards)}
                    {expandedDecksList && renderDecksList()}
                </AntdCard>



                <h3 style={{ marginBottom: '0.2rem' }}>My Decks</h3>
                {decks.map(deck => {
                    const lastStudied = deck.last_studied ? new Date(deck.last_studied).toLocaleDateString() : 'Never';
                    
                    return (
                        <AntdCard 
                            key={deck.id} 
                            style={{ marginBottom: '0.2rem' }}
                            onClick={() => history.push(`/profile/learned?deckId=${deck.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>{deck.name}</span>
                                <Tag color="primary">{deck.learned_cards || 0} / {deck.total_cards}</Tag>
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                                Last studied: {lastStudied}
                            </div>
                            <ProgressBar percent={deck.total_cards > 0 ? ((deck.learned_cards || 0) / deck.total_cards) * 100 : 0} style={{ marginTop: '10px' }} />
                        </AntdCard>
                    );
                })}
            </div>
        </div>
    );
}
