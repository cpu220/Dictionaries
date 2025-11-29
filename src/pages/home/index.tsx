import React, { useEffect, useState } from 'react';
import { Button, Card, NavBar, ProgressBar, List } from 'antd-mobile';
import { history } from 'umi';
import { AppOutline } from 'antd-mobile-icons';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { Deck } from '@/services/database/types';
import styles from './index.less';

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDecks = async () => {
      try {
        const deckService = new DeckService();
        const allDecks = await deckService.getAllDecks();
        setDecks(allDecks);
      } catch (error) {
        console.error('Failed to load decks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, []);

  const getProgress = (deck: Deck) => {
    if (deck.total_cards === 0) return 0;
    
    // 计算百分比，处理负数情况
    const percentage = (deck.learned_cards / deck.total_cards) * 100;
    
    // 保留2位小数并转换为数字（自动去掉末尾的0）
    return Number(percentage.toFixed(2));
  };

  return (
    <div className={styles.homeContainer}>
      <NavBar className={styles.homeNavBar} back={null}>Vocab Master</NavBar>

      <div className={styles.homeContent}>
        <h2 className={styles.homeTitle}>我的卡组</h2>

        {loading ? (
          <div className={styles.homeLoading}>
            加载中...
          </div>
        ) : decks.length === 0 ? (
          <div className={styles.homeEmpty}>
            <p>暂无卡组</p>
            <p className={styles.homeEmptyText}>
              点击下方"导入 Anki 卡组"开始学习
            </p>
          </div>
        ) : (
          <div className={styles.homeDecksGrid}>
            {decks.map(deck => (
              <Card
                key={deck.id}
                className={styles.homeDeckCard}
                onClick={() => history.push(`/study?deckId=${deck.id}`)}
              >
                <div className={styles.homeDeckContent}>
                  <div className={styles.homeDeckName}>
                    {deck.name}
                  </div>
                  <div>{`/study?deckId=${deck.id}`}</div>
                  <div className={styles.homeDeckStats}>
                    总计: {deck.total_cards} 词
                    <br />
                    已学: {deck.learned_cards} 词
                  </div>
                  <ProgressBar
                    percent={getProgress(deck)}
                    className={styles.homeProgressBar}
                  />
                  <div className={styles.homeProgressPercent}>
                    {getProgress(deck)}%
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}
