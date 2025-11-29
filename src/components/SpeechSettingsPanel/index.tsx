import React from 'react';
import { Slider, List } from 'antd-mobile';
import './index.less';

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
    <div className="speech-settings-panel">
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