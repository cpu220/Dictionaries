import React from 'react';
import { Button, List, NavBar } from 'antd-mobile';
import { history } from 'umi';
import { AppOutline } from 'antd-mobile-icons';

export default function HomePage() {
  const decks = [
    { id: 'cet4', name: 'CET-4 Vocabulary (Mock)', count: 3 },
    { id: 'cet4_imported', name: 'CET-4 Vocabulary (Full)', count: 4028 },
  ];

  return (
    <div style={{ padding: '0 0 20px 0', minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar back={null}>Vocab Master</NavBar>

      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Select a Deck</h2>

        <List header='Available Decks'>
          {decks.map(deck => (
            <List.Item
              key={deck.id}
              prefix={<AppOutline />}
              onClick={() => history.push(`/study?deck=${deck.id}`)}
              clickable
              extra={`${deck.count} words`}
            >
              {deck.name}
            </List.Item>
          ))}
          <List.Item
            onClick={() => history.push('/profile')}
            clickable
            prefix={<span style={{ fontSize: '20px' }}>👤</span>}
          >
            Profile & Mistakes
          </List.Item>
        </List>

        <div style={{ marginTop: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
          <p>More decks coming soon...</p>
        </div>
      </div>
    </div>
  );
}
