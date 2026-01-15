/**
 * 局域网导入服务
 * 集成WebSocketServer和ApkgImporter，实现PC端到手机端的文件上传和导入功能
 */

import { WebSocketServer, UploadProgress } from '../http-server/WebSocketServer';
import { ApkgImporter } from './ApkgImporter';
import { getLocalIPAddress, generateRandomPort } from '@/utils/network';

export interface LanImportServiceOptions {
  /** 服务器配置选项 */
  serverOptions?: {
    /** 最大文件大小（字节） */
    maxFileSize?: number;
    /** 允许的文件类型 */
    allowedFileTypes?: string[];
  };
  /** 端口号 */
  port?: number;
}

export interface LanImportStatus {
  /** 服务器运行状态 */
  isRunning: boolean;
  /** 局域网访问地址 */
  localAddress?: string;
  /** 当前进度 */
  progress?: UploadProgress;
  /** 错误信息 */
  error?: string;
}

export class LanImportService {
  private options: LanImportServiceOptions;
  private webSocketServer: WebSocketServer;
  private apkgImporter: ApkgImporter;
  private status: LanImportStatus = {
    isRunning: false,
  };
  private onStatusChangeCallback?: (status: LanImportStatus) => void;
  private port: number;

  /**
   * 构造函数
   * @param options 服务配置选项
   */
  constructor(options: LanImportServiceOptions = {}) {
    this.options = {
      serverOptions: {
        maxFileSize: 100 * 1024 * 1024, // 默认100MB
        allowedFileTypes: ['.apkg'],
      },
      ...options,
    };

    // 初始化端口号
    this.port = this.options.port || generateRandomPort(8000, 9000);

    // 初始化WebSocket服务器
    this.webSocketServer = new WebSocketServer(this.options.serverOptions);

    // 初始化ApkgImporter
    this.apkgImporter = new ApkgImporter();

    // 注册WebSocket服务器事件
    this.registerServerEvents();
  }

  /**
   * 注册服务器事件
   */
  private registerServerEvents(): void {
    // 注册文件上传完成回调
    this.webSocketServer.onFileUploaded(async (file: File) => {
      await this.handleFileImport(file);
    });

    // 注册进度回调
    this.webSocketServer.onProgress((progress: UploadProgress) => {
      this.updateStatus({
        progress,
      });
    });
  }

  /**
   * 处理文件导入
   * @param file 上传的文件
   */
  private async handleFileImport(file: File): Promise<void> {
    try {
      // 使用ApkgImporter解析和导入文件
      await this.apkgImporter.import(file, (progress, message) => {
        this.updateStatus({
          progress: {
            progress,
            status: 'processing',
            message,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
            },
          },
        });
      });
    } catch (error) {
      this.updateStatus({
        progress: {
          progress: 0,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error occurred during import',
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        },
      });
      throw error;
    }
  }

  /**
   * 启动服务
   */
  public async start(): Promise<void> {
    try {
      console.log('Starting LanImportService...');
      
      // 尝试使用WebRTC API获取本地IP地址
      let localIP: string | null = null;
      let ipError = '';
      
      try {
        localIP = await getLocalIPAddress();
        console.log(`Successfully obtained local IP address: ${localIP}`);
        
        // 验证获取到的IP是否为有效的局域网IP（非回环地址）
        if (localIP === 'localhost' || localIP.startsWith('127.')) {
          localIP = null;
          ipError = 'Failed to get valid LAN IP address. Please find your phone\'s IP address manually.';
          console.warn('Obtained IP is localhost or loopback address, PC may not be able to access.');
        }
      } catch (error) {
        ipError = error instanceof Error ? error.message : 'Failed to get local IP address. Please find your phone\'s IP address manually.';
        console.warn('Failed to get local IP address:', error);
      }
      
      // 启动WebSocket服务器
      this.webSocketServer.start();

      // 更新状态，包含IP获取错误信息
      this.updateStatus({
        isRunning: true,
        localAddress: localIP ? `http://${localIP}:${this.port}` : undefined,
        error: ipError,
      });

      console.log(`LanImportService started`);
      console.log(`Note: In browser environment, we can't create a real HTTP server.`);
      console.log(`The WebSocket server is running on this device.`);
      if (localIP) {
        console.log(`For PC access, use: ${this.status.localAddress}`);
      } else {
        console.log(`Failed to get valid LAN IP address. Please find your phone's actual LAN IP address in settings > Wi-Fi > connected network details.`);
        console.log(`Then use http://[your-phone-ip]:${this.port} on your PC.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start LanImportService';
      console.error('Error starting LanImportService:', error);
      this.updateStatus({
        isRunning: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * 停止服务
   */
  public stop(): void {
    // 停止WebSocket服务器
    this.webSocketServer.stop();

    // 更新状态
    this.updateStatus({
      isRunning: false,
      localAddress: undefined,
      progress: undefined,
      error: undefined,
    });

    console.log('LanImportService stopped');
  }

  /**
   * 注册状态变化回调
   * @param callback 回调函数
   */
  public onStatusChange(callback: (status: LanImportStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  /**
   * 更新状态
   * @param updates 状态更新
   */
  private updateStatus(updates: Partial<LanImportStatus>): void {
    this.status = {
      ...this.status,
      ...updates,
    };

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.status);
    }
  }

  /**
   * 获取当前状态
   */
  public getStatus(): LanImportStatus {
    return { ...this.status };
  }

  /**
   * 获取当前使用的端口号
   */
  public getPort(): number {
    return this.port;
  }

  /**
   * 处理文件上传
   * @param file 文件对象
   */
  public async uploadFile(file: File): Promise<void> {
    try {
      await this.webSocketServer.handleFileUpload(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      this.updateStatus({
        error: errorMessage,
      });
      throw error;
    }
  }
}
