import React from 'react';
import { PhoneticGroup } from '@/interfaces';
import { PhoneticEngine } from '@/utils/phonetic-engine';
import './index.less';

interface PhoneticRowProps {
    groups: PhoneticGroup[];
    activeGroupIndex: number | null;
    onGroupClick: (index: number) => void;
    playbackRate: number;
}

export default function PhoneticRow({ groups, activeGroupIndex, onGroupClick, playbackRate }: PhoneticRowProps) {
    return (
        <div className="phonetic-row">
            {groups.map((group, index) => {
                const isActive = index === activeGroupIndex;
                return (
                    <span
                        key={index}
                        className={`phonetic-group ${isActive ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card flip
                            onGroupClick(index);
                            PhoneticEngine.speak(group.text, group.related_letters, playbackRate);
                        }}
                    >
                        {group.text}
                    </span>
                );
            })}
        </div>
    );
}
