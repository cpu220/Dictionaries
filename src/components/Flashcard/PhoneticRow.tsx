import React from 'react';
import { PhoneticGroup } from '@/interfaces';
import { PhoneticEngine } from '@/utils/phonetic-engine';

interface PhoneticRowProps {
    groups: PhoneticGroup[];
    activeGroupIndex: number | null;
    onGroupClick: (index: number) => void;
    playbackRate: number;
}

export default function PhoneticRow({ groups, activeGroupIndex, onGroupClick, playbackRate }: PhoneticRowProps) {
    return (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', margin: '10px 0' }}>
            {groups.map((group, index) => {
                const isActive = index === activeGroupIndex;
                return (
                    <span
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card flip
                            onGroupClick(index);
                            PhoneticEngine.speak(group.text, group.related_letters, playbackRate);
                        }}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: isActive ? '#fff7cc' : 'transparent', // Yellow highlight
                            color: isActive ? '#d48806' : 'inherit',
                            transition: 'all 0.2s',
                            fontSize: '1.2rem',
                            fontFamily: 'monospace',
                            border: isActive ? '1px solid #ffe58f' : '1px solid transparent',
                        }}
                    >
                        {group.text}
                    </span>
                );
            })}
        </div>
    );
}
