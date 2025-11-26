/**
 * 音频缓存管理工具
 * 用于缓存已加载的音频对象，避免重复请求
 */

class AudioCache {
  private cache: Map<string, HTMLAudioElement> = new Map();
  private maxCacheSize: number = 50; // 最大缓存数量，防止内存溢出

  /**
   * 获取音频对象
   * 如果缓存中存在，则直接返回；否则创建新的音频对象并缓存
   * @param url 音频URL
   * @returns 音频对象
   */
  getAudio(url: string): HTMLAudioElement {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // 创建新的音频对象
    const audio = new Audio(url);
    
    // 缓存音频对象
    this.cache.set(url, audio);
    
    // 如果缓存数量超过最大值，移除最早的缓存
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return audio;
  }

  /**
   * 播放音频
   * @param url 音频URL
   * @param playbackRate 播放速度
   * @returns Promise<void>
   */
  playAudio(url: string, playbackRate: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = this.getAudio(url);
        audio.playbackRate = playbackRate;
        
        // 重置音频到开始位置，确保每次都从开头播放
        audio.currentTime = 0;
        
        audio.play()
          .then(resolve)
          .catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * 清除指定URL的音频缓存
   * @param url 音频URL
   */
  clearAudio(url: string): void {
    this.cache.delete(url);
  }

  /**
   * 清除所有音频缓存
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * 获取当前缓存大小
   * @returns 缓存数量
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// 导出单例实例
export default new AudioCache();
