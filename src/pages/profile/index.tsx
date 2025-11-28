import React, { useState, useEffect } from 'react';
import { NavBar, Card, List, Empty, Tag, ProgressBar, Switch, Radio, Space } from 'antd-mobile';
import { history } from 'umi';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { CardService } from '@/services/database/indexeddb/CardService';
import { Deck } from '@/services/database/types';

export default function ProfilePage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [totalCards, setTotalCards] = useState(0);
    const [learnedCards, setLearnedCards] = useState(0);
    const [newCardOrder, setNewCardOrder] = useState<'random' | 'sequential'>('random');
    const [loading, setLoading] = useState(true);

    const deckService = new DeckService();
    const cardService = new CardService();

    useEffect(() => {
        loadData();
        loadSettings();
    }, []);

    const loadData = async () => {
        const allDecks = await deckService.getAllDecks();
        setDecks(allDecks);
        
        let total = 0;
        let learned = 0;
        allDecks.forEach(d => {
            total += d.total_cards;
            learned += d.learned_cards;
        });
        setTotalCards(total);
        setLearnedCards(learned);
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

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <NavBar onBack={() => history.push('/')}>Profile & Settings</NavBar>

            <div style={{ padding: '0.2rem' }}>
                <Card title="Statistics" style={{ marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>{totalCards}</div>
                            <div style={{ color: '#666' }}>Total Cards</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{learnedCards}</div>
                            <div style={{ color: '#666' }}>Learned</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>{decks.length}</div>
                            <div style={{ color: '#666' }}>Decks</div>
                        </div>
                    </div>
                </Card>

                <Card title="Settings" style={{ marginBottom: '0.2rem' }}>
                    <List header="Study Options">
                        <List.Item>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>New Card Order</span>
                                <Radio.Group value={newCardOrder} onChange={val => handleOrderChange(val as any)}>
                                    <Space direction='horizontal'>
                                        <Radio value='random'>Random</Radio>
                                        <Radio value='sequential'>Sequential</Radio>
                                    </Space>
                                </Radio.Group>
                            </div>
                        </List.Item>
                    </List>
                </Card>

                <h3 style={{ marginBottom: '0.2rem' }}>My Decks</h3>
                {decks.map(deck => (
                    <Card key={deck.id} style={{ marginBottom: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{deck.name}</span>
                            <Tag color="primary">{deck.learned_cards} / {deck.total_cards}</Tag>
                        </div>
                        <ProgressBar percent={deck.total_cards > 0 ? (deck.learned_cards / deck.total_cards) * 100 : 0} style={{ marginTop: '10px' }} />
                    </Card>
                ))}
            </div>
        </div>
    );
}
