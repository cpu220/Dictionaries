import React, { useState, useRef } from 'react';
import { Button, ProgressBar, Toast, Card, Space } from 'antd-mobile';
import styles from './index.less';

// 定义Title组件类型，使用div标签替代
const Title = ({ level, children, className }: { level: number; children: React.ReactNode; className?: string }) => {
  const fontSize = {
    1: '24px',
    2: '20px',
    3: '18px',
    4: '16px',
  }[level] || '16px';
  
  return (
    <div style={{ fontSize, fontWeight: 'bold', display: 'block', marginBottom: '8px' }} className={className}>
      {children}
    </div>
  );
};

const LanUploadPage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.apkg')) {
      Toast.show({
        content: 'Please select a valid .apkg file',
        icon: 'fail',
      });
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
    setMessage('');
  };

  /**
   * 处理文件上传
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      Toast.show({
        content: 'Please select a file first',
        icon: 'warning',
      });
      return;
    }

    try {
      setIsUploading(true);
      setStatus('uploading');
      setProgress(0);
      setMessage('Starting upload...');

      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', selectedFile);

      // 模拟上传进度
      // 注意：在实际实现中，这里应该发送HTTP请求到手机端
      // 由于是模拟，我们使用setTimeout来模拟进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setProgress(i);
        setMessage(`Uploading file... ${i}%`);
      }

      // 模拟处理文件
      setStatus('processing');
      setMessage('Processing file...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 模拟导入完成
      setStatus('completed');
      setProgress(100);
      setMessage('File imported successfully!');
      Toast.show({
        content: 'File imported successfully!',
        icon: 'success',
      });
    } catch (error) {
      setStatus('failed');
      setProgress(0);
      setMessage(error instanceof Error ? error.message : 'Upload failed');
      Toast.show({
        content: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        icon: 'fail',
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 重新选择文件
   */
  const handleReselect = () => {
    setSelectedFile(null);
    setStatus('idle');
    setProgress(0);
    setMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title level={2} className={styles.title}>
          局域网导入
        </Title>
        <div className={styles.description}>
          选择.apkg文件上传到手机端
        </div>

        <div className={styles.content}>
          {/* 文件选择区域 */}
          {!selectedFile ? (
            <div className={styles.fileSelectArea}>
              <input
                type="file"
                accept=".apkg"
                ref={fileInputRef}
                className={styles.fileInput}
                onChange={handleFileSelect}
              />
              <Button
                block
                color="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                选择.apkg文件
              </Button>
              <div className={styles.hint}>
                支持.apkg格式文件，最大100MB
              </div>
            </div>
          ) : (
            <div className={styles.fileInfoArea}>
              <Card className={styles.fileInfoCard}>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{selectedFile.name}</div>
                  <div className={styles.fileSize}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <Space>
                  <Button
                    size="small"
                    color="primary"
                    onClick={handleReselect}
                  >
                    重新选择
                  </Button>
                  <Button
                    size="small"
                    color="success"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    上传
                  </Button>
                </Space>
              </Card>
            </div>
          )}

          {/* 进度显示区域 */}
          {isUploading || status !== 'idle' ? (
            <div className={styles.progressArea}>
              <ProgressBar percent={progress} />
              <div className={styles.statusContainer}>
                <div className={styles.statusIcon}>
                  {(status === 'uploading' || status === 'processing') && <div className={styles.loading}></div>}
                  {status === 'completed' && <div className={styles.checkIcon}></div>}
                  {status === 'failed' && <div className={styles.errorIcon}></div>}
                </div>
                <div className={styles.statusText}>{message}</div>
              </div>
            </div>
          ) : null}

          {/* 状态提示区域 */}
          {status === 'completed' && (
            <div className={styles.successArea}>
              <div className={styles.successIcon}></div>
              <div className={styles.successText}>
                文件导入成功！您可以在手机端查看导入的卡片。
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className={styles.errorArea}>
              <div className={styles.errorIcon}></div>
              <div className={styles.errorText}>
                文件导入失败，请重试。
              </div>
              <Button
                block
                color="primary"
                onClick={handleReselect}
                className={styles.retryButton}
              >
                重新尝试
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 操作指引 */}
      <Card className={styles.guideCard}>
        <Title level={4} className={styles.guideTitle}>操作指引</Title>
        <ul className={styles.guideList}>
          <li>1. 在手机端打开应用，进入局域网导入页面</li>
          <li>2. 点击"启动服务器"按钮，获取局域网访问地址</li>
          <li>3. 在PC浏览器中输入该地址</li>
          <li>4. 选择要上传的.apkg文件</li>
          <li>5. 等待上传和导入完成</li>
          <li>6. 在手机端查看导入结果</li>
        </ul>
      </Card>
    </div>
  );
};

export default LanUploadPage;
