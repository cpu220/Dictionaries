import React, { useState, useEffect } from 'react';
import { Word } from '@/interfaces';
import PhoneticRow from '../PhoneticRow';
import { ROOT_PATH } from '../../../../baseConfig';
import './index.less';
// import { SoundOutline } from 'antd-mobile-icons'; // Not used in source logic shown, but imported.

interface BackProps {
    word: Word;
}

export default function Back({ word }: BackProps) {
    const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
    const [playbackRate, setPlaybackRate] = useState<number>(1);

    // Reset active group when word changes
    useEffect(() => {
        setActiveGroupIndex(null);
    }, [word.id]);

    const handleGroupClick = (index: number) => {
        setActiveGroupIndex(index);
        // Logic to play audio would go here
        console.log(`Playing audio for: ${word.phonetic_groups[index].text}`);

        // Auto-reset after a short delay (optional, or keep it until next click)
        // setTimeout(() => setActiveGroupIndex(null), 1000);
    };

    const renderWordWithHighlight = () => {
        if (activeGroupIndex === null) return word.word;

        const activeGroup = word.phonetic_groups[activeGroupIndex];
        const targetLetters = activeGroup.related_letters;

        // Simple highlighting logic: find the first occurrence of the related letters
        // In a real app, we might need more robust index mapping from the data
        const index = word.word.toLowerCase().indexOf(targetLetters.toLowerCase());

        if (index === -1) return word.word;

        const before = word.word.substring(0, index);
        const match = word.word.substring(index, index + targetLetters.length);
        const after = word.word.substring(index + targetLetters.length);

        return (
            <>
                {before}
                <span className="flashcard-highlight">{match}</span>
                {after}
            </>
        );
    };

    const playFullAudio = () => {
        if (word.audio_url) {
            // Prepend ROOT_PATH if the URL is absolute and doesn't already contain it
            // Also remove trailing slash from ROOT_PATH if present to avoid double slashes, though ROOT_PATH here is /Dictionaries
            const audioPath = word.audio_url.startsWith('/') ? `${ROOT_PATH}${word.audio_url}` : word.audio_url;
            console.log('Playing audio from:', audioPath);
            const audio = new Audio(audioPath);
            audio.playbackRate = playbackRate;
            audio.play().catch(e => console.error('Audio play failed', e));
        }
    };

    return (
        <div className="flashcard-back-content" onClick={playFullAudio}>
            {/* Speed Control */}
            <div className="speed-control" onClick={(e) => e.stopPropagation()}>
                {[0.5, 0.75, 1].map(rate => (
                    <div
                        key={rate}
                        className={`speed-control-item ${playbackRate === rate ? 'active' : ''}`}
                        onClick={() => setPlaybackRate(rate)}
                    >
                        x{rate}
                    </div>
                ))}
            </div>

            <h1 className="flashcard-back-word">
                {renderWordWithHighlight()}
            </h1>

            <div onClick={(e) => e.stopPropagation()}>
                <PhoneticRow
                    groups={word.phonetic_groups}
                    activeGroupIndex={activeGroupIndex}
                    onGroupClick={handleGroupClick}
                    playbackRate={playbackRate}
                />
            </div>

            <div className="flashcard-translation">
                {word.translation}
            </div>
        </div>
    );
}
