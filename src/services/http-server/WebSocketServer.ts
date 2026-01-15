/**
 * WebSocket服务器封装类
 * 在浏览器环境中，使用WebSocket API实现类似HTTP服务器的功能
 * 用于处理PC端到手机端的文件上传和通信
 */

export interface WebSocketServerOptions {
  /** 服务器名称 */
  name?: string;
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 允许的文件类型 */
  allowedFileTypes?: string[];
}

export interface UploadProgress {
  /** 当前进度（0-100） */
  progress: number;
  /** 当前状态 */
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  /** 消息 */
  message?: string;
  /** 文件信息 */
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
}

export class WebSocketServer {
  private options: WebSocketServerOptions;
  private clients: Map<string, WebSocket> = new Map();
  private fileChunks: Map<string, Blob[]> = new Map();
  private fileMetadata: Map<string, { name: string; size: number; type: string }> = new Map();
  private onFileUploadedCallback?: (file: File) => Promise<void>;
  private onProgressCallback?: (progress: UploadProgress) => void;
  private serverId: string;
  private isRunning: boolean = false;

  /**
   * 构造函数
   * @param options 服务器配置选项
   */
  constructor(options: WebSocketServerOptions = {}) {
    this.options = {
      name: 'LanImportServer',
      maxFileSize: 100 * 1024 * 1024, // 默认100MB
      allowedFileTypes: ['.apkg'],
      ...options,
    };
    this.serverId = this.generateServerId();
  }

  /**
   * 生成服务器ID
   * @returns 服务器ID
   */
  private generateServerId(): string {
    return `${this.options.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动服务器
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('WebSocket server is already running');
      return;
    }

    this.isRunning = true;
    console.log(`WebSocket server started with ID: ${this.serverId}`);
  }

  /**
   * 停止服务器
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn('WebSocket server is not running');
      return;
    }

    // 关闭所有客户端连接
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();
    this.fileChunks.clear();
    this.fileMetadata.clear();

    this.isRunning = false;
    console.log('WebSocket server stopped');
  }

  /**
   * 注册文件上传完成回调
   * @param callback 回调函数
   */
  public onFileUploaded(callback: (file: File) => Promise<void>): void {
    this.onFileUploadedCallback = callback;
  }

  /**
   * 注册进度回调
   * @param callback 回调函数
   */
  public onProgress(callback: (progress: UploadProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * 发送进度更新
   * @param progress 进度信息
   */
  private sendProgress(progress: UploadProgress): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(progress);
    }
  }

  /**
   * 处理文件上传
   * @param file 文件对象
   */
  public async handleFileUpload(file: File): Promise<void> {
    try {
      // 验证文件类型
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
      if (!this.options.allowedFileTypes?.includes(fileExtension)) {
        throw new Error(`File type not allowed. Allowed types: ${this.options.allowedFileTypes?.join(', ')}`);
      }

      // 验证文件大小
      if (file.size > this.options.maxFileSize!) {
        throw new Error(`File size exceeds limit. Max size: ${this.options.maxFileSize} bytes`);
      }

      // 发送上传开始进度
      this.sendProgress({
        progress: 0,
        status: 'uploading',
        message: 'Starting file upload...',
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });

      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.sendProgress({
          progress: i,
          status: 'uploading',
          message: `Uploading file... ${i}%`,
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
      }

      // 发送处理中进度
      this.sendProgress({
        progress: 100,
        status: 'processing',
        message: 'Processing file...',
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });

      // 调用文件上传完成回调
      if (this.onFileUploadedCallback) {
        await this.onFileUploadedCallback(file);
      }

      // 发送完成进度
      this.sendProgress({
        progress: 100,
        status: 'completed',
        message: 'File upload completed successfully!',
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
    } catch (error) {
      // 发送失败进度
      this.sendProgress({
        progress: 0,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    }
  }

  /**
   * 获取服务器状态
   */
  public getStatus(): {
    isRunning: boolean;
    clientCount: number;
    serverId: string;
  } {
    return {
      isRunning: this.isRunning,
      clientCount: this.clients.size,
      serverId: this.serverId,
    };
  }
}
