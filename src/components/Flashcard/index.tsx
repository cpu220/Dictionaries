import React from 'react';
import { Word } from '@/interfaces';
import Front from './front';
import Back from './back';
import './index.less';

interface FlashcardProps {
    word: Word;
    isFlipped: boolean;
    onFlip: () => void;
    deckId?: string;
}

export default function Flashcard({ word, isFlipped, onFlip, deckId = 'cet4' }: FlashcardProps) {
    // debugger
    console.log('Flashcard props:', { word, isFlipped, onFlip, deckId });
    return (
        <div className="flashcard-container" onClick={onFlip}>
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
                {/* Front */}
                <div className="flashcard-face flashcard-front">
                    <Front word={word} />
                </div>

                {/* Back */}
                <div className="flashcard-face flashcard-back">
                    <Back word={word} deckId={deckId} />
                </div>
            </div>
        </div>
    );
}