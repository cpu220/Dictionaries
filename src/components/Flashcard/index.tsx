import React from 'react';
import { Word } from '@/interfaces';
import Front from './Front';
import Back from './Back';

interface FlashcardProps {
    word: Word;
    isFlipped: boolean;
    onFlip: () => void;
}

export default function Flashcard({ word, isFlipped, onFlip }: FlashcardProps) {
    return (
        <div
            style={{
                perspective: '1000px',
                width: '100%',
                height: '400px',
                cursor: 'pointer'
            }}
            onClick={onFlip}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.6s',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    backgroundColor: 'white',
                }}
            >
                {/* Front */}
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '16px',
                        overflow: 'hidden',
                    }}
                >
                    <Front word={word} />
                </div>

                {/* Back */}
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                    }}
                >
                    <Back word={word} />
                </div>
            </div>
        </div>
    );
}
