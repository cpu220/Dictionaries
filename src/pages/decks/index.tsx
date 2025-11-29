import React, { useEffect, useState } from 'react';
import { List, Card, Button, Tag, NavBar, Toast } from 'antd-mobile';
import { history } from 'umi';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { Deck } from '@/services/database/types';
import styles from './index.less';

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const deckService = new DeckService();

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    const allDecks = await deckService.getAllDecks();
    setDecks(allDecks);
  };

  const handleStudy = (deckId: string) => {
    history.push(`/study?deckId=${deckId}`);
  };

  const handleDelete = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this deck?')) {
      await deckService.deleteDeck(deckId);
      await loadDecks();
      Toast.show({ content: 'Deck deleted', icon: 'success' });
    }
  };

  return (
    <div className={styles.container}>
      <NavBar className={styles.deckNavBar} onBack={() => history.push('/')} right={<Button size="mini" color="primary" onClick={() => history.push('/import')}>Import</Button>}>
        My Decks
      </NavBar>

      <div className={styles.list}>
        {decks.map(deck => (
          <Card key={deck.id} className={styles.deckCard}>
            <div className={styles.deckContent} onClick={() => handleStudy(deck.id)}>
              <div className={styles.deckInfo}>
                <h3>{deck.name}</h3>
                <div className={styles.stats}>
                  <Tag color="primary">{deck.total_cards} Cards</Tag>
                  <Tag color="success">{deck.learned_cards} Learned</Tag>
                </div>
              </div>
              <div className={styles.deckActions}>
                <Button size="small" color="primary" fill="outline">
                  Study
                </Button>
                <Button 
                  size="small" 
                  color="danger" 
                  fill="outline"
                  onClick={(e) => handleDelete(e, deck.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {decks.length === 0 && (
          <div className={styles.empty}>
            <p>No decks found. Import one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecksPage;
