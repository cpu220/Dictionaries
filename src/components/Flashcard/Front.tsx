import React from 'react';
import { Word } from '@/interfaces';

interface FrontProps {
    word: Word;
}

export default function Front({ word }: FrontProps) {
    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{word.word}</h1>
            <div style={{ marginTop: '20px', color: '#888' }}>Tap to flip</div>
        </div>
    );
}
