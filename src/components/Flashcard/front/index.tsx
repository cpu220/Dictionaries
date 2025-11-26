import React from 'react';
import { Word } from '@/interfaces';
import './index.less';

interface FrontProps {
    word: Word;
}

export default function Front({ word }: FrontProps) {
    return (
        <div className="flashcard-front-content">
            <h1 className="flashcard-word">{word.word}</h1>
            <div className="flashcard-tap-hint">Tap to flip</div>
        </div>
    );
}
