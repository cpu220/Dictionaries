import React from 'react';
import { Slider, List } from 'antd-mobile';

interface SpeechSettingsPanelProps {
  rate: number;
  onRateChange: (value: number) => void;
}

/**
 * 语音设置面板组件
 * 用于控制语音播放速率
 */
const SpeechSettingsPanel: React.FC<SpeechSettingsPanelProps> = ({ rate, onRateChange }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      right: '16px',
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      padding: '12px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <List header='Settings'>
        <List.Item
          title="Speech Rate"
          extra={`${rate.toFixed(1)}x`}
        >
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(val) => onRateChange(val as number)}
            marks={{
              0.5: '0.5',
              0.75: '0.75',
              1.0: '1.0',
              1.5: '1.5',
              2.0: '2.0'
            }}
          />
        </List.Item>
      </List>
    </div>
  );
};

export default SpeechSettingsPanel;