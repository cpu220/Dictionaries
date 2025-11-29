import React, { useEffect, useState } from 'react';
import { Button, Card, NavBar, ProgressBar, List } from 'antd-mobile';
import { history } from 'umi';
import { AppOutline } from 'antd-mobile-icons';
import { DeckService } from '@/services/database/indexeddb/DeckService';
import { Deck } from '@/services/database/types';

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
    <div style={{ padding: '0 0 0.2rem 0', minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar back={null}>Vocab Master</NavBar>

      <div style={{ padding: '0.2rem' }}>
        <h2 style={{ marginBottom: '0.2rem', fontWeight: '600' }}>我的卡组</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '0.4rem', color: '#888' }}>
            加载中...
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '0.4rem', color: '#888' }}>
            <p>暂无卡组</p>
            <p style={{ fontSize: '0.14rem', marginTop: '0.1rem' }}>
              点击下方"导入 Anki 卡组"开始学习
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.16rem',
              // justifyContent: 'space-between',
            }}
          >
            {decks.map(deck => (
              <Card
                key={deck.id}
                style={{
                  // width: 'calc(50% - 0.08rem)',
                  width:'100%',
                  borderRadius: '0.12rem',
                  cursor: 'pointer',
                }}
                onClick={() => history.push(`/study?deckId=${deck.id}`)}
              >
                <div style={{ padding: '0.08rem' }}>
                  <div
                    style={{
                      fontSize: '0.46rem',
                      fontWeight: '600',
                      marginBottom: '0.08rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {deck.name}
                  </div>
                  <div>{`/study?deckId=${deck.id}`}</div>
                  <div
                    style={{
                      fontSize: '0.32rem',
                      color: '#888',
                      marginBottom: '0.12rem',
                    }}
                  >
                    总计: {deck.total_cards} 词
                    <br />
                    已学: {deck.learned_cards} 词
                  </div>
                  <ProgressBar
                    percent={getProgress(deck)}
                    style={{ '--track-width': '4px' } as any}
                  />
                  <div
                    style={{
                      fontSize: '0.2',
                      color: '#1677ff',
                      marginTop: '0.08rem',
                      textAlign: 'right',
                    }}
                  >
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
