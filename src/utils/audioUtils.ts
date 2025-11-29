/**
 * 音频播放工具函数
 */

// 缓存创建的音频对象
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * 清理HTML标签，提取纯文本内容
 * @param html 包含HTML标签的字符串
 * @returns 清理后的纯文本
 */
export const cleanHtml = (html: string): string => {
  if (!html) return '';
  // 创建临时DOM元素来移除HTML标签
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  return tempElement.textContent || tempElement.innerText || '';
};

/**
 * 创建并播放音频
 * @param text 要转换为语音的文本
 * @param rate 语音播放速率
 * @param accent 口音选择 (0为美式，1为英式)
 */
export const playTextToSpeech = (
  text: string,
  rate: number = 1,
  accent: number = 0
): void => {
  try {
    // 停止所有正在播放的音频
    stopAllAudio();

    // 创建新的语音合成实例
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.rate = rate;
    utterance.volume = 1;
    utterance.lang = accent === 0 ? 'en-US' : 'en-GB'; // 0: 美式英语, 1: 英式英语

    // 播放语音
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('播放音频失败:', error);
  }
};

/**
 * 停止所有正在播放的音频
 */
export const stopAllAudio = (): void => {
  // 停止语音合成
  window.speechSynthesis.cancel();
  
  // 停止所有缓存的音频元素
  audioCache.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
};

/**
 * 处理卡片音频播放
 * @param card 卡片对象
 * @param side 卡片面 ('front' 或 'back')
 * @param accentIndex 口音索引 (0为美式，1为英式)
 * @param cleanHtmlFn 清理HTML的函数
 * @param rate 语音速率
 */
export const handleCardAudioPlay = (
  card: { front: string; back: string },
  side: string,
  accentIndex: number,
  cleanHtmlFn: (html: string) => string,
  rate: number = 1
): void => {
  // 获取要播放的文本
  const text = side === 'front' ? card.front : card.back;
  // 清理HTML标签
  const cleanText = cleanHtmlFn(text);
  // 播放语音
  playTextToSpeech(cleanText, rate, accentIndex);
};