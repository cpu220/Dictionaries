export interface SpeakOptions {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  lang?: string; // e.g., 'en-US'
}

class TTSService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private audio: HTMLAudioElement | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
      };
      this.voices = this.synthesis.getVoices();
    }
  }

  speak(text: string, options: SpeakOptions = {}) {
    // Cancel any current playback
    this.cancel();

    // 1. Try YouDao API (US English by default, type=0)
    // Note: YouDao API returns an audio stream. We can play it directly.
    // We'll try US accent (type=0) first.
    const type = 0; // 0=US, 1=UK
    const url = `http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(text)}`;

    this.audio = new Audio(url);
    
    // Handle playback speed for Audio element
    if (options.rate) {
      this.audio.playbackRate = options.rate;
    }

    this.audio.onended = () => {
      this.audio = null;
    };

    this.audio.onerror = () => {
      console.warn('YouDao API failed, falling back to Web Speech API');
      this.audio = null;
      this.fallbackSpeak(text, options);
    };

    this.audio.play().catch(err => {
      console.warn('Audio play failed (interaction needed or network error), falling back', err);
      this.fallbackSpeak(text, options);
    });
  }

  private fallbackSpeak(text: string, options: SpeakOptions) {
    if (!this.synthesis) {
      console.warn('Speech Synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (options.rate) utterance.rate = options.rate;
    if (options.pitch) utterance.pitch = options.pitch;
    if (options.volume) utterance.volume = options.volume;
    if (options.lang) utterance.lang = options.lang;

    // Try to find a good voice for the language
    if (options.lang) {
      const voice = this.voices.find(v => v.lang === options.lang && !v.localService) || 
                    this.voices.find(v => v.lang === options.lang);
      if (voice) {
        utterance.voice = voice;
      }
    }

    this.synthesis.speak(utterance);
  }

  cancel() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  getVoices() {
    return this.voices;
  }
}

export const tts = new TTSService();
