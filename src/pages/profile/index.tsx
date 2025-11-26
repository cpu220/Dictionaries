import React, { useState, useEffect } from 'react';
import { NavBar, List } from 'antd-mobile';
import { history } from 'umi';
import { getWords } from '@/utils/data';
import { loadAllProgress } from '@/utils/storage';
import { Word } from '@/interfaces';

export default function ProfilePage() {
    const [mistakes, setMistakes] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMistakes() {
            // In a real app, we would query the database for words with low scores or due dates.
            // Here we filter client-side.
            const allWords = await getWords('cet4');
            const progress = loadAllProgress();

            const difficultWords = allWords.filter(word => {
                const p = progress[word.id];
                // Condition for "Mistake" or "Hard":
                // 1. Has history (been studied)
                // 2. Last score was <= 5 OR Interval is small (< 2 days)
                if (!p) return false;
                const lastHistory = p.history[p.history.length - 1];
                return lastHistory && (lastHistory.score <= 5 || p.interval < 2);
            });

            setMistakes(difficultWords);
            setLoading(false);
        }
        loadMistakes();
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <NavBar onBack={() => history.back()}>Profile & Mistakes</NavBar>

            <div style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>Common Mistakes</h3>
                {mistakes.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                        <p>No common mistakes found yet.</p>
                        <p>Keep studying!</p>
                    </div>
                ) : (
                    <List header={`Found ${mistakes.length} words to review`}>
                        {mistakes.map(word => (
                            <List.Item
                                key={word.id}
                                onClick={() => history.push(`/study?deck=cet4&mode=mistakes`)} // Future: support filtered study
                                clickable
                            >
                                {word.word}
                                <div style={{ fontSize: '12px', color: '#888' }}>{word.translation}</div>
                            </List.Item>
                        ))}
                    </List>
                )}
            </div>
        </div>
    );
}
