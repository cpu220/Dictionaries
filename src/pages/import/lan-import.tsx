import React, { useState, useEffect, useRef } from 'react';
import { Button, ProgressBar, Toast, Card, Space, Divider, Loading } from 'antd-mobile';
import { NavBar } from 'antd-mobile';
import { history } from 'umi';
import { LanImportService, LanImportStatus } from '@/services/import/LanImportService';
import styles from './lan-import.less';

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

const LanImportPage: React.FC = () => {
  const [status, setStatus] = useState<LanImportStatus>({
    isRunning: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [port, setPort] = useState<number>(8000);
  const lanImportServiceRef = useRef<LanImportService | null>(null);

  /**
   * 初始化服务
   */
  useEffect(() => {
    // 创建LanImportService实例
    lanImportServiceRef.current = new LanImportService();

    // 注册状态变化回调
    lanImportServiceRef.current.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // 组件卸载时停止服务
    return () => {
      if (lanImportServiceRef.current) {
        lanImportServiceRef.current.stop();
      }
    };
  }, []);

  /**
   * 启动服务器
   */
  const handleStartServer = async () => {
    if (!lanImportServiceRef.current) return;

    try {
      setIsLoading(true);
      await lanImportServiceRef.current.start();
      // 获取并保存端口号
      const serverPort = lanImportServiceRef.current.getPort();
      setPort(serverPort);
      Toast.show({
        content: '服务器启动成功',
        icon: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '服务器启动失败';
      Toast.show({
        content: errorMessage,
        icon: 'fail',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 停止服务器
   */
  const handleStopServer = () => {
    if (!lanImportServiceRef.current) return;

    try {
      setIsLoading(true);
      lanImportServiceRef.current.stop();
      Toast.show({
        content: '服务器已停止',
        icon: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '服务器停止失败';
      Toast.show({
        content: errorMessage,
        icon: 'fail',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 复制地址到剪贴板
   */
  const handleCopyAddress = async (address: string) => {
    try {
      // 使用浏览器的Clipboard API复制文本
      await navigator.clipboard.writeText(address);
      
      setCopied(true);
      Toast.show({
        content: '地址已复制',
        icon: 'success',
      });

      // 3秒后重置复制状态
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      Toast.show({
        content: '复制失败，请手动复制',
        icon: 'fail',
      });
    }
  };

  /**
   * 获取状态图标
   */
  const getStatusIcon = () => {
    if (!status.progress) return null;

    switch (status.progress.status) {
      case 'uploading':
      case 'processing':
        return <Loading />;
      case 'completed':
        return <div className={styles.checkIcon}></div>;
      case 'failed':
        return <div className={styles.errorIcon}></div>;
      default:
        return null;
    }
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = () => {
    if (!status.progress) return '#1677ff';

    switch (status.progress.status) {
      case 'uploading':
      case 'processing':
        return '#1677ff';
      case 'completed':
        return '#52c41a';
      case 'failed':
        return '#ff4d4f';
      default:
        return '#1677ff';
    }
  };

  return (
    <div className={styles.container}>
      <NavBar
        onBack={() => history.back()}
        className={styles.navBar}
      >
        局域网导入
      </NavBar>

      <div className={styles.content}>
        {/* 服务器状态卡片 */}
        <Card className={styles.statusCard}>
          <Title level={4} className={styles.cardTitle}>服务器状态</Title>
          
          <div className={styles.serverStatus}>
            <div className={`${styles.statusIndicator} ${status.isRunning ? styles.running : styles.stopped}`}>
              {status.isRunning ? '运行中' : '已停止'}
            </div>
            
            <Space direction="vertical" className={styles.serverActions}>
              {!status.isRunning ? (
                <Button
                  block
                  color="primary"
                  onClick={handleStartServer}
                  loading={isLoading}
                >
                  启动服务器
                </Button>
              ) : (
                <Button
                  block
                  color="danger"
                  onClick={handleStopServer}
                  loading={isLoading}
                >
                  停止服务器
                </Button>
              )}
            </Space>
          </div>

          {/* 局域网地址 */}
          {status.isRunning && (
            <div className={styles.addressSection}>
              <Divider>局域网访问地址</Divider>
              {status.localAddress ? (
                <>
                  <div className={styles.addressContainer}>
                    <div className={styles.addressText}>{status.localAddress}</div>
                    <Button
                      size="small"
                      color={copied ? 'success' : 'primary'}
                      className={styles.copyButton}
                      onClick={() => handleCopyAddress(status.localAddress!)}
                    >
                      {copied ? '已复制' : '复制'}
                    </Button>
                  </div>
                  <div className={styles.addressHint}>
                    <p>⚠️ 重要提示：</p>
                    <ul className={styles.addressTips}>
                      <li>确保手机和PC处于同一局域网</li>
                      <li>在PC浏览器中输入上述地址即可访问上传页面</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className={styles.manualAddressSection}>
                  <div className={styles.manualAddressHint}>
                    <p>⚠️ 无法自动获取局域网IP地址，请手动使用您手机的IP地址：</p>
                    <ul className={styles.addressTips}>
                      <li>1. 在手机设置 - Wi-Fi - 已连接网络详情中查找IP地址</li>
                      <li>2. 在PC浏览器中输入：http://[您的手机IP]:{port}</li>
                      <li>3. 确保手机和PC处于同一局域网</li>
                      <li>示例：如果手机IP是 192.168.1.100，使用 http://192.168.1.100:{port}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 导入进度卡片 */}
        <Card className={styles.progressCard}>
          <Title level={4} className={styles.cardTitle}>导入进度</Title>
          
          {status.progress ? (
            <div className={styles.progressSection}>
              <ProgressBar 
                percent={status.progress.progress} 
                className={styles.progressBar}
              />
              <div className={styles.progressStatus}>
                <div className={styles.statusIcon} style={{ color: getStatusColor() }}>
                  {getStatusIcon()}
                </div>
                <div className={styles.statusInfo}>
                  <div className={styles.statusMessage}>{status.progress.message}</div>
                  {status.progress.fileInfo && (
                    <div className={styles.fileInfo}>
                      {status.progress.fileInfo.name} ({(status.progress.fileInfo.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyProgress}>
              <Loading className={styles.emptyIcon} />
              <div className={styles.emptyText}>等待文件上传...</div>
            </div>
          )}
        </Card>

        {/* 错误信息卡片 */}
        {status.error && (
          <Card className={styles.errorCard}>
            <div className={styles.errorSection}>
              <div className={styles.errorIcon}></div>
              <div className={styles.errorText}>{status.error}</div>
            </div>
          </Card>
        )}

        {/* 操作指引卡片 */}
        <Card className={styles.guideCard}>
          <Title level={4} className={styles.cardTitle}>操作指引</Title>
          <ul className={styles.guideList}>
            <li>1. 确保手机和PC处于同一局域网</li>
            <li>2. 点击"启动服务器"按钮</li>
            <li>3. 复制显示的局域网地址</li>
            <li>4. 在PC浏览器中粘贴该地址</li>
            <li>5. 在PC端选择并上传.apkg文件</li>
            <li>6. 等待导入完成</li>
            <li>7. 导入完成后，点击"停止服务器"</li>
          </ul>
        </Card>

        {/* 注意事项卡片 */}
        <Card className={styles.noteCard}>
          <Title level={4} className={styles.cardTitle}>注意事项</Title>
          <ul className={styles.noteList}>
            <li>• 仅支持.apkg格式文件</li>
            <li>• 单个文件大小不超过100MB</li>
            <li>• 导入过程中请勿关闭应用或切换后台</li>
            <li>• 导入完成后请及时停止服务器</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default LanImportPage;
