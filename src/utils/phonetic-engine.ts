// Mapping table for IPA to "Speakable English" (Respelling)
// Based on common approximations for TTS engines
const IPA_MAP: Record<string, string> = {
  // Vowels - Long
  'iː': 'ee',
  'ɑː': 'ah',
  'ɔː': 'aw',
  'uː': 'oo',
  'ɜː': 'ur',
  
  // Vowels - Short
  'ɪ': 'ih',
  'e': 'eh',
  'æ': 'a', // 'a' as in 'cat' - sometimes 'ae' works better
  'ɒ': 'o',
  'ʌ': 'u', // 'u' as in 'cup'
  'ʊ': 'uu', // 'uu' as in 'book'
  'ə': 'uh', // Schwa
  
  // Diphthongs
  'eɪ': 'ay',
  'aɪ': 'eye',
  'ɔɪ': 'oy',
  'aʊ': 'ow',
  'əʊ': 'oh',
  'oʊ': 'oh',
  'ɪə': 'ear',
  'eə': 'air',
  'ʊə': 'oor',
  'juː': 'you',

  // Consonants (Special)
  'θ': 'th', // thin
  'ð': 'th', // this
  'ʃ': 'sh', // she
  'ʒ': 'zh', // vision
  'tʃ': 'ch', // cheap
  'dʒ': 'j', // jeep
  'ŋ': 'ng', // sing
  'j': 'y',  // yes
  'ɡ': 'g',  // go
  
  // Syllabic Consonants
  'l̩': 'ul',
  'n̩': 'un',
  'm̩': 'um',
};

export class PhoneticEngine {
  /**
   * Converts IPA string to speakable text for TTS.
   */
  static toSpeakable(ipa: string): string {
    let text = ipa;

    // 1. Remove delimiters but maybe keep stress for spacing?
    // TTS doesn't really understand IPA stress ' or ˌ, but we can use them to add space.
    text = text.replace(/[\/\[\]]/g, ''); // Remove brackets/slashes
    text = text.replace(/[ˈˌ]/g, ' '); // Replace stress with space for pause

    // 2. Map symbols
    // Sort keys by length (descending) to match longest sequences first
    const keys = Object.keys(IPA_MAP).sort((a, b) => b.length - a.length);
    
    for (const key of keys) {
      // Global replace
      text = text.split(key).join(IPA_MAP[key] + ' '); // Add space after mapping to prevent blending
    }

    // 3. Clean up
    text = text.replace(/\s+/g, ' ').trim();
    
    // 4. Handle remaining special chars (like length mark ː if missed)
    text = text.replace(/[ː:.]/g, '');

    return text;
  }

  /**
   * Speak the text using System TTS.
   * @param text The IPA text or fallback text
   * @param fallbackText The related letters to use if IPA is unpronounceable
   * @param rate Playback rate
   */
  static speak(text: string, fallbackText: string, rate: number = 1) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();

    let speakable = this.toSpeakable(text);
    const isPronounceable = /[aeiouy]/i.test(speakable);

    // Fallback logic
    if (!isPronounceable && fallbackText) {
      console.log(`PhoneticEngine: '${text}' -> '${speakable}' (Unpronounceable). Fallback to '${fallbackText}'`);
      speakable = fallbackText;
    } else {
      console.log(`PhoneticEngine: '${text}' -> '${speakable}'`);
    }

    const utterance = new SpeechSynthesisUtterance(speakable);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    
    // Tweak pitch/volume if needed?
    // utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }
}

function hasVowels(text: string): boolean {
  return /[aeiouy]/i.test(text);
}
