import React, { useState, useEffect } from 'react';
import { NavBar, Card as AntdCard, List, Radio, Space } from 'antd-mobile';
import { history } from 'umi';
import styles from './index.less';

export default function SettingsPage() {
  const [newCardOrder, setNewCardOrder] = useState<'random' | 'sequential'>('random');
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const storedOrder = localStorage.getItem('newCardOrder');
    if (storedOrder === 'sequential') {
      setNewCardOrder('sequential');
    } else {
      setNewCardOrder('random');
    }
  };

  const handleOrderChange = (value: 'random' | 'sequential') => {
    setNewCardOrder(value);
    localStorage.setItem('newCardOrder', value);
  };

  return (
    <div className={styles.settingsContainer}>
      <NavBar onBack={() => history.push('/profile')}>设置</NavBar>

      <div className={styles.settingsContent}>
        <AntdCard title="学习选项" className={styles.settingsCard}>
          <List>
            <List.Item>
              <div className={styles.settingsItem}>
                <span>新卡片排序</span>
                <Radio.Group value={newCardOrder} onChange={val => handleOrderChange(val as any)}>
                  <Space direction='horizontal'>
                    <Radio value='random'>随机</Radio>
                    <Radio value='sequential'>顺序</Radio>
                  </Space>
                </Radio.Group>
              </div>
            </List.Item>
          </List>
        </AntdCard>

        <AntdCard title="数据管理" className={styles.settingsCard}>
          <List>
            <List.Item
              onClick={() => history.push('/import')}
              clickable
              prefix={<span className={styles.settingsPrefix}>📥</span>}
            >
              导入 Anki 卡组
            </List.Item>
          </List>
        </AntdCard>
      </div>
    </div>
  );
}