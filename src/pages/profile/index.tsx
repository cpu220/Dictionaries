import React, { useState, useEffect } from 'react';
import { NavBar, Card as AntdCard, List, Empty, Tag, ProgressBar, Switch, Radio, Space } from 'antd-mobile';
import { SetOutline } from 'antd-mobile-icons';
import { history } from 'umi';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { CardService } from '@/services/database/indexeddb/CardService';
import { StatsService } from '@/services/database/indexeddb/StatsService';
import { Deck, DailyStudyStat, Card } from '@/services/database/types';
import ContributionCalendar from 'react-github-contribution-calendar';
import styles from './index.less';

export default function ProfilePage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [totalCards, setTotalCards] = useState(0);
    const [learnedCards, setLearnedCards] = useState(0);
    const [newCardOrder, setNewCardOrder] = useState<'random' | 'sequential'>('random');
    const [loading, setLoading] = useState(true);
    const [dailyStats, setDailyStats] = useState<DailyStudyStat | null>(null);
    const [allDailyStats, setAllDailyStats] = useState<DailyStudyStat[]>([]);
    
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

        // Load all daily stats for contribution calendar
        const allStats = await statsService.getAllDailyStats();
        setAllDailyStats(allStats);

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
        <div className={styles.profileCardList}>
            {cards.length === 0 ? (
                <div className={styles.profileCardListEmpty}>No cards found</div>
            ) : (
                <List>
                    {cards.map(card => (
                        <List.Item key={card.id}>
                            <div className={styles.profileCardItem}>
                                <span className={styles.profileCardWord}>{card.word || extractText(card.front)}</span>
                                <span className={styles.profileCardDefinition}>{extractText(card.back).substring(0, 20)}...</span>
                            </div>
                        </List.Item>
                    ))}
                </List>
            )}
        </div>
    );

    const renderDecksList = () => (
        <div className={styles.profileDeckList}>
            <List>
                {decks.map(deck => (
                    <List.Item key={deck.id}>
                        <div className={styles.profileDeckItem}>
                            <span>{deck.name}</span>
                            <span className={styles.profileDeckCount}>{deck.learned_cards || 0}/{deck.total_cards}</span>
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

    // Convert daily stats to contribution calendar format
    const getContributionData = () => {
        const data: Record<string, number> = {};
        allDailyStats.forEach(stat => {
            data[stat.date] = stat.total_cards || 0;
        });
        return data;
    };

    return (
        <div className={styles.profileContainer}>
            <NavBar 
              className={styles.profileNavBar}
              onBack={() => history.push('/')} 
              right={
                <SetOutline 
                  onClick={() => history.push('/settings')}
                  className={styles.profileSettingsIcon}
                />
              }
            >个人中心</NavBar>

            <div className={styles.profileContent}>
                 <AntdCard title="Study Activity" className={styles.profileCard}>
                    <div className={styles.profileContributionCalendar}>
                        <ContributionCalendar
                            values={getContributionData()}
                            until={new Date().toISOString().split('T')[0]}
                            weekLabelAttributes={undefined}
                            monthLabelAttributes={undefined}
                            panelAttributes={undefined}
                            panelColors={['#EEE', '#C6E48B', '#7BC96F', '#239A3B', '#196127']}
                        />
                    </div>
                </AntdCard>
                
                <AntdCard title="Today's Progress" className={styles.profileCard}>
                    <div className={styles.profileProgress}>
                        <div>
                            <div className={`${styles.profileStatValue} ${styles.reviewed}`}>
                                {dailyStats?.total_cards || 0}
                            </div>
                            <div className={styles.profileStatLabel}>Reviewed</div>
                        </div>
                        <div onClick={toggleTodayLearned} className={styles.profileStatItem}>
                            <div className={`${styles.profileStatValue} ${styles.learned}`}>
                                {dailyStats?.learned_cards || 0} {expandedTodayLearned ? '▲' : '▼'}
                            </div>
                            <div className={styles.profileStatLabel}>Learned</div>
                        </div>
                        <div>
                            <div className={`${styles.profileStatValue} ${styles.time}`}>
                                {dailyStats ? Math.round(dailyStats.time_spent / 1000 / 60) : 0}m
                            </div>
                            <div className={styles.profileStatLabel}>Time</div>
                        </div>
                    </div>
                    {expandedTodayLearned && renderCardList(todayLearnedCards)}
                </AntdCard>

                <AntdCard title="Overall Statistics" className={styles.profileCard}>
                    <div className={styles.profileProgress}>
                        <div>
                            <div className={`${styles.profileStatValue} ${styles.reviewed}`}>{totalCards}</div>
                            <div className={styles.profileStatLabel}>Total Cards</div>
                        </div>
                        <div onClick={toggleAllLearned} className={styles.profileStatItem}>
                            <div className={`${styles.profileStatValue} ${styles.learned}`}>
                                {learnedCards} {expandedAllLearned ? '▲' : '▼'}
                            </div>
                            <div className={styles.profileStatLabel}>Learned</div>
                        </div>
                        <div onClick={() => setExpandedDecksList(!expandedDecksList)} className={styles.profileStatItem}>
                            <div className={`${styles.profileStatValue} ${styles.decks}`}>
                                {decks.length} {expandedDecksList ? '▲' : '▼'}
                            </div>
                            <div className={styles.profileStatLabel}>Decks</div>
                        </div>
                    </div>
                    {expandedAllLearned && renderCardList(allLearnedCards)}
                    {expandedDecksList && renderDecksList()}
                </AntdCard>

               

                <h3 className={styles.profileDecksTitle}>My Decks</h3>
                {decks.map(deck => {
                    const lastStudied = deck.last_studied ? new Date(deck.last_studied).toLocaleDateString() : 'Never';
                    
                    return (
                        <AntdCard 
                            key={deck.id} 
                            className={styles.profileDeckCard}
                            onClick={() => history.push(`/profile/learned?deckId=${deck.id}`)}
                        >
                            <div className={styles.profileDeckHeader}>
                                <span className={styles.profileDeckName}>{deck.name}</span>
                                <Tag color="primary">{deck.learned_cards || 0} / {deck.total_cards}</Tag>
                            </div>
                            <div className={styles.profileDeckInfo}>
                                Last studied: {lastStudied}
                            </div>
                            <ProgressBar percent={deck.total_cards > 0 ? ((deck.learned_cards || 0) / deck.total_cards) * 100 : 0} className={styles.profileDeckProgress} />
                        </AntdCard>
                    );
                })}
            </div>
        </div>
    );
}
