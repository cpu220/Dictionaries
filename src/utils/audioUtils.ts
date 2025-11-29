/**
 * 音频播放工具函数
 */
import { Card } from '@/services/database/types';

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
 * 从HTML中提取纯文本单词
 * @param html HTML内容
 * @returns 清理后的纯文本单词
 */
export const extractWordFromHtml = (html: string): string => {
  // 创建临时DOM元素
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // 尝试直接获取第一个h1标签的内容（这通常是单词）
  const h1Element = tempElement.querySelector('h1');
  if (h1Element) {
    return h1Element.textContent?.trim() || '';
  }
  
  // 如果没有h1标签，尝试获取第一个可能包含单词的主元素
  const mainContent = tempElement.textContent || tempElement.innerText || '';
  
  // 清理文本内容，移除多余的空格和特殊字符
  let cleaned = mainContent.trim();
  
  // 移除音标部分
  cleaned = cleaned.replace(/\[.*?\]/g, '').trim();
  
  // 移除括号中的信息
  cleaned = cleaned.replace(/\(.*?\)/g, '').trim();
  
  // 尝试提取第一个单词（假设是空格分隔的）
  const words = cleaned.split(/\s+/);
  return words[0] || cleaned;
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
  card: Card,
  side: string,
  accentIndex: number,
  cleanHtmlFn: (html: string) => string,
  rate: number = 1
): void => {
  // 引入 tts 服务
  const { tts } = require('./tts');
  
  try {
    // 1. 尝试使用card.word字段（如果存在）
    if (card.word) {
      tts.speak(card.word, { rate, type: accentIndex });
      return;
    }
    
    // 2. 获取HTML内容
    const htmlContent = side === 'front' ? card.front : card.back;
    
    // 3. 提取纯文本单词
    const word = extractWordFromHtml(htmlContent);
    
    // 4. 如果提取成功，播放单词
    if (word) {
      tts.speak(word, { rate, type: accentIndex });
    } else {
      // 5. 作为最后的回退，使用cleanHtmlFn处理
      const fallbackText = cleanHtmlFn(htmlContent);
      if (fallbackText) {
        // 只取前几个字符作为回退，避免传递过长的内容
        const shortText = fallbackText.slice(0, 100);
        tts.speak(shortText, { rate, type: accentIndex });
      }
    }
  } catch (error) {
    console.error('处理音频播放时出错:', error);
  }
};