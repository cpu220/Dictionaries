import React from 'react';
import { Button, List, NavBar } from 'antd-mobile';
import { history } from 'umi';
import { AppOutline } from 'antd-mobile-icons';
import { DECKS } from '@/consts/decks';

export default function HomePage() {

  return (
    <div style={{ padding: '0 0 0.2rem 0', minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar back={null}>Vocab Master</NavBar>

      <div style={{ padding: '0.2rem' }}>
        <h2 style={{ marginBottom: '0.2rem', fontWeight: '600' }}>Select a Deck</h2>

        <List header='Available Decks'>
          {DECKS.map(deck => (
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
            onClick={() => history.push('/decks')}
            clickable
            prefix={<span style={{ fontSize: '0.2rem' }}>📚</span>}
          >
            My Decks (Anki)
          </List.Item>
          <List.Item
            onClick={() => history.push('/import')}
            clickable
            prefix={<span style={{ fontSize: '0.2rem' }}>📥</span>}
          >
            Import Anki Deck
          </List.Item>
          <List.Item
            onClick={() => history.push('/home3d')}
            clickable
            prefix={<span style={{ fontSize: '0.2rem' }}>🌍</span>}
          >
            3D Planet View (Beta)
          </List.Item>
          <List.Item
            onClick={() => history.push('/profile')}
            clickable
            prefix={<span style={{ fontSize: '0.2rem' }}>👤</span>}
          >
            Profile & Mistakes
          </List.Item>
        </List>

        <div style={{ marginTop: '0.2rem', textAlign: 'center', color: '#888', fontSize: '0.14rem' }}>
          <p>More decks coming soon...</p>
        </div>
      </div>
    </div>
  );
}
