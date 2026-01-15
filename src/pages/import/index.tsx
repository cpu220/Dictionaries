import React, { useState, useRef } from 'react';
import { Button, ProgressBar, Toast, Card, NavBar, Space } from 'antd-mobile';
import { history } from 'umi';
import { ApkgImporter } from '@/services/import/ApkgImporter';
import styles from './index.less';

const ImportPage: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.apkg')) {
      Toast.show({
        content: 'Please select a valid .apkg file',
        icon: 'fail',
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setStatus('Starting import...');

    const importer = new ApkgImporter();

    try {
      await importer.import(file, (p, msg) => {
        setProgress(p);
        setStatus(msg);
      });

      Toast.show({
        content: 'Import successful!',
        icon: 'success',
      });
      
      setTimeout(() => {
        history.push('/decks');
      }, 1000);
    } catch (error) {
      console.error(error);
      Toast.show({
        content: `Import failed: ${(error as Error).message}`,
        icon: 'fail',
      });
      setStatus('Import failed');
    } finally {
      setImporting(false);
    }
  };

  /**
   * 跳转到局域网导入页面
   */
  const handleLanImport = () => {
    history.push('/import/lan');
  };

  return (
    <div className={styles.container}>
      <NavBar className={styles.importNavBar} onBack={() => history.back()}>Import Anki Deck</NavBar>
      <div className={styles.content}>
        <p>Select an .apkg file to import your decks.</p>
        
        <input
          type="file"
          accept=".apkg"
          ref={fileInputRef}
          className={styles.fileInput}
          onChange={handleFileChange}
        />

        {!importing ? (
          <Space direction="vertical" className={styles.importOptions}>
            <Button 
              block 
              color="primary" 
              onClick={() => fileInputRef.current?.click()}
            >
              选择本地文件
            </Button>
            
            <Button 
              block 
              color="success" 
              onClick={handleLanImport}
            >
              局域网导入
            </Button>
            
            <div className={styles.lanHint}>
              同一局域网下，可通过PC浏览器上传文件到手机端
            </div>
          </Space>
        ) : (
          <div className={styles.progress}>
            <ProgressBar percent={progress} />
            <div className={styles.status}>{status}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
