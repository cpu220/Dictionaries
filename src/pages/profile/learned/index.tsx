import React, { useState, useEffect } from 'react';
import { NavBar, List, SearchBar, Empty, Tag, Button } from 'antd-mobile';
import { history, useLocation } from 'umi';
import { CardService } from '@/services/database/indexeddb/CardService';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { Card, Deck } from '@/services/database/types';
import { tts } from '@/utils/tts';

export default function LearnedCardsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const deckId = searchParams.get('deckId');

  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<Deck | null>(null);

  const cardService = new CardService();
  const deckService = new DeckService();

  console.log('LearnedCardsPage rendering, deckId:', deckId);

  

  useEffect(() => {
    loadData();
  }, [deckId]);

  useEffect(() => {
    if (!searchText) {
      setFilteredCards(cards);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredCards(
        cards.filter(c => 
          (c.word && c.word.toLowerCase().includes(lower)) || 
          c.front.toLowerCase().includes(lower) || 
          c.back.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchText, cards]);

  const loadData = async () => {
    try {
        setLoading(true);
        console.log('Loading learned cards for deck:', deckId);
        
        if (deckId) {
            const d = await deckService.getDeck(deckId);
            setDeck(d || null);
        }

        const learned = await cardService.getLearnedCards(deckId || undefined);
        console.log('Learned cards found:', learned.length);
        
        learned.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
        setCards(learned);
        setFilteredCards(learned);
    } catch (error) {
        console.error('Failed to load learned cards:', error);
    } finally {
        setLoading(false);
    }
  };

  const cleanHtml = (html: string) => {
    return html.replace(/\{\{.*?\}\}/g, '').replace(/<[^>]*>/g, ' ').trim();
  };

  const handleCardClick = (card: Card) => {
    // Navigate to study page for this deck
    history.push(`/study?deckId=${card.deck_id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar onBack={() => history.back()}>{deck ? deck.name : 'Learned Cards'}</NavBar>
      
      <div style={{ padding: '10px', background: '#fff' }}>
        <SearchBar 
          placeholder="Search learned cards" 
          value={searchText} 
          onChange={setSearchText} 
        />
      </div>

      <div style={{ paddingBottom: '20px' }}>
        {filteredCards.length === 0 && !loading ? (
          <Empty description="No learned cards found" />
        ) : (
          <List>
            {filteredCards.map(card => (
              <List.Item 
                key={card.id}
                onClick={() => handleCardClick(card)}
                arrow
                description={cleanHtml(card.back).substring(0, 50) + '...'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{card.word || cleanHtml(card.front)}</span>
                  <Button 
                    size='mini' 
                    fill='none'
                    onClick={(e) => { e.stopPropagation(); tts.speak(card.word || cleanHtml(card.front)); }}
                  >
                    🔊
                  </Button>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </div>
    </div>
  );
}
