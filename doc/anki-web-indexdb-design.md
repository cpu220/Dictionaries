# Anki Web 版本详细设计文档

## 1. 项目概述

本项目是一个基于Web技术栈（React、Umi、TypeScript）开发的Anki-like单词学习应用。当前版本存在以下问题：

1. 单词数据以大型JSON文件（100+MB）形式存储，加载效率低
2. 仅支持单个词库（CET4）
3. 音频文件需要单独存储和加载

本设计文档主要解决上述问题，通过引入IndexDB进行本地数据存储、实现APKG文件解析导入功能，以及使用Chrome TTS API替代音频文件。

## 2. 当前系统分析

### 2.1 技术栈

- React
- Umi
- TypeScript
- Less
- antd-mobile组件库

### 2.2 现有数据结构

根据`src/interfaces/index.ts`，当前系统定义了以下主要接口：

```typescript
// 单词接口
export interface Word {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  phonetic_groups: PhoneticGroup[];
  audio_url?: string;
  tags: string[];
}

// 用户学习进度
export interface UserProgress {
  word_id: string;
  next_review_time: number; // Timestamp
  interval: number; // Days
  ease_factor: number;
  history: { date: number; score: number }[];
}

// 学习会话
export interface StudySession {
  id: string; // 会话唯一ID
  deckId: string;
  words: { id: string; result?: number }[]; // 单词列表，包含ID和上次学习结果
  currentIndex: number; // 当前学习到的索引
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
  completed: boolean; // 是否完成
}
```

### 2.3 现有存储方式

当前系统使用localStorage存储用户学习进度和会话信息，通过`src/utils/storage`模块实现。大型单词数据直接嵌入在JavaScript中或通过HTTP请求加载。

## 3. Anki数据模型分析

### 3.1 Anki核心概念

1. **牌组(Deck)** - 卡片的集合
2. **笔记(Note)** - 包含多个字段的数据条目
3. **卡片(Card)** - 从笔记生成的实际学习单元，正面和背面
4. **模板(Template)** - 定义如何从笔记生成卡片
5. **模型(Model)** - 定义笔记的字段结构

### 3.2 APKG文件结构

APKG文件本质上是一个ZIP文件，包含：

- collection.anki2 - SQLite数据库，包含卡片、笔记、牌组等数据
- media文件 - 图片、音频等附件
- meta.json - 元数据信息

### 3.3 当前JSON数据结构分析

从`src/assets/data/cet4/all.json`文件分析，当前数据结构包含：

```json
{
  "version": "1.0",
  "export_date": "2025-11-28T05:52:00.013Z",
  "total_notes": 4028,
  "card_templates": [...],
  "notes": [...]
}
```

每个note包含丰富的单词信息，如单词、音标、释义、例句等。

## 4. IndexDB存储设计

### 4.1 数据库概述

**数据库名称**: `AnkiWebDB`
**版本**: 1

### 4.2 对象存储空间设计

#### 4.2.1 decks 存储空间

| 字段名 | 数据类型 | 描述 | 索引 |
|-------|---------|------|------|
| id | String | 牌组唯一ID | 主键 |
| name | String | 牌组名称 | 唯一索引 |
| description | String | 牌组描述 | 无 |
| total_cards | Number | 总卡片数 | 无 |
| learned_cards | Number | 已学习卡片数 | 无 |
| created_at | Number | 创建时间戳 | 无 |
| updated_at | Number | 更新时间戳 | 无 |
| metadata | Object | 额外元数据 | 无 |

#### 4.2.2 notes 存储空间

| 字段名 | 数据类型 | 描述 | 索引 |
|-------|---------|------|------|
| id | String | 笔记唯一ID | 主键 |
| deck_id | String | 所属牌组ID | 多字段索引 |
| model_id | String | 模型ID | 无 |
| fields | Object | 字段内容 | 无 |
| tags | Array<String> | 标签列表 | 无 |
| created_at | Number | 创建时间戳 | 无 |
| updated_at | Number | 更新时间戳 | 无 |

#### 4.2.3 cards 存储空间

| 字段名 | 数据类型 | 描述 | 索引 |
|-------|---------|------|------|
| id | String | 卡片唯一ID | 主键 |
| note_id | String | 关联笔记ID | 多字段索引 |
| deck_id | String | 所属牌组ID | 多字段索引 |
| ord | Number | 卡片顺序号 | 无 |
| template_name | String | 模板名称 | 无 |
| front | String | 卡片正面内容(HTML) | 无 |
| back | String | 卡片背面内容(HTML) | 无 |
| created_at | Number | 创建时间戳 | 无 |

#### 4.2.4 models 存储空间

| 字段名 | 数据类型 | 描述 | 索引 |
|-------|---------|------|------|
| id | String | 模型ID | 主键 |
| name | String | 模型名称 | 唯一索引 |
| fields | Array<Object> | 字段定义 | 无 |
| templates | Array<Object> | 卡片模板定义 | 无 |
| css | String | 样式定义 | 无 |

#### 4.2.5 user_progress 存储空间

| 字段名 | 数据类型 | 描述 | 索引 |
|-------|---------|------|------|
| id | String | 记录ID | 主键 |
| card_id | String | 卡片ID | 唯一索引 |
| deck_id | String | 牌组ID | 多字段索引 |
| next_review_time | Number | 下次复习时间戳 | 索引 |
| interval | Number | 复习间隔(天) | 无 |
| ease_factor | Number | 容易度因子 | 无 |
| step | Number | 学习步骤 | 无 |
| history | Array<Object> | 学习历史 | 无 |
| last_review | Number | 最后复习时间 | 无 |

#### 4.2.6 study_sessions 存储空间

| 字段名 | 数据类型 | 描述 | 索引 |
|-------|---------|------|------|
| id | String | 会话ID | 主键 |
| deck_id | String | 牌组ID | 多字段索引 |
| card_ids | Array<String> | 卡片ID列表 | 无 |
| current_index | Number | 当前索引 | 无 |
| completed | Boolean | 是否完成 | 无 |
| created_at | Number | 创建时间 | 索引 |
| updated_at | Number | 更新时间 | 无 |

### 4.3 索引设计

为了优化查询性能，需要创建以下索引：

1. **decks**: 
   - 主键索引: `id`
   - 唯一索引: `name`

2. **notes**:
   - 主键索引: `id`
   - 复合索引: `[deck_id]` (用于按牌组查询笔记)

3. **cards**:
   - 主键索引: `id`
   - 复合索引: `[note_id]` (用于查找笔记关联的所有卡片)
   - 复合索引: `[deck_id]` (用于按牌组查询卡片)

4. **models**:
   - 主键索引: `id`
   - 唯一索引: `name`

5. **user_progress**:
   - 主键索引: `id`
   - 唯一索引: `[card_id]`
   - 复合索引: `[deck_id]` (用于按牌组查询进度)
   - 复合索引: `[next_review_time]` (用于查找待复习卡片)

6. **study_sessions**:
   - 主键索引: `id`
   - 复合索引: `[deck_id]` (用于按牌组查询会话)
   - 复合索引: `[created_at]` (用于按时间排序会话)

### 4.4 主要操作SQL/命令

#### 4.4.1 创建数据库和对象存储空间

```javascript
// 数据库初始化代码
const dbName = 'AnkiWebDB';
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  // 创建decks存储空间
  const decksStore = db.createObjectStore('decks', { keyPath: 'id' });
  decksStore.createIndex('name', 'name', { unique: true });
  
  // 创建notes存储空间
  const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
  notesStore.createIndex('deck_id', 'deck_id', { unique: false });
  
  // 创建cards存储空间
  const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
  cardsStore.createIndex('note_id', 'note_id', { unique: false });
  cardsStore.createIndex('deck_id', 'deck_id', { unique: false });
  
  // 创建models存储空间
  const modelsStore = db.createObjectStore('models', { keyPath: 'id' });
  modelsStore.createIndex('name', 'name', { unique: true });
  
  // 创建user_progress存储空间
  const progressStore = db.createObjectStore('user_progress', { keyPath: 'id' });
  progressStore.createIndex('card_id', 'card_id', { unique: true });
  progressStore.createIndex('deck_id', 'deck_id', { unique: false });
  progressStore.createIndex('next_review_time', 'next_review_time', { unique: false });
  
  // 创建study_sessions存储空间
  const sessionsStore = db.createObjectStore('study_sessions', { keyPath: 'id' });
  sessionsStore.createIndex('deck_id', 'deck_id', { unique: false });
  sessionsStore.createIndex('created_at', 'created_at', { unique: false });
};
```

#### 4.4.2 插入牌组

```javascript
// 插入牌组示例
function addDeck(deck) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('decks', 'readwrite');
    const store = tx.objectStore('decks');
    const request = store.add(deck);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

#### 4.4.3 查询待复习卡片

```javascript
// 查询待复习卡片示例
function getDueCards(deckId) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const cards = [];
    
    const tx = db.transaction(['user_progress', 'cards'], 'readonly');
    const progressStore = tx.objectStore('user_progress');
    const dueIndex = progressStore.index('next_review_time');
    
    // 查询所有next_review_time <= now的记录
    const request = dueIndex.getAll(IDBKeyRange.upperBound(now));
    
    request.onsuccess = async (event) => {
      const progressRecords = event.target.result;
      
      // 过滤出指定牌组的卡片并获取卡片详情
      for (const progress of progressRecords) {
        if (progress.deck_id === deckId) {
          const cardTx = db.transaction('cards', 'readonly');
          const cardStore = cardTx.objectStore('cards');
          const cardRequest = cardStore.get(progress.card_id);
          
          await new Promise((cardResolve) => {
            cardRequest.onsuccess = () => {
              if (cardRequest.result) {
                cards.push({
                  ...cardRequest.result,
                  progress
                });
              }
              cardResolve();
            };
          });
        }
      }
      
      resolve(cards);
    };
    
    request.onerror = () => reject(request.error);
  });
}
```

#### 4.4.4 更新学习进度

```javascript
// 更新学习进度示例
function updateCardProgress(cardId, rating, deckId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user_progress', 'readwrite');
    const store = tx.objectStore('user_progress');
    const index = store.index('card_id');
    const request = index.get(cardId);
    
    request.onsuccess = (event) => {
      let progress = event.target.result;
      const now = Date.now();
      
      if (!progress) {
        // 创建新进度记录
        progress = {
          id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          card_id: cardId,
          deck_id: deckId,
          next_review_time: now,
          interval: 0,
          ease_factor: 2.5,
          step: 0,
          history: []
        };
      }
      
      // 基于SM-2算法更新进度
      // 这里简化实现，实际应使用完整的SM-2算法
      progress.history.push({ date: now, score: rating });
      progress.last_review = now;
      
      if (rating === 1 || rating === 2) {
        // 重新学习
        progress.step = 0;
        progress.interval = 0;
        progress.next_review_time = now;
      } else {
        // 更新间隔和下次复习时间
        if (progress.step === 0) {
          progress.interval = 1;
        } else if (progress.step === 1) {
          progress.interval = 6;
        } else {
          progress.interval = Math.ceil(progress.interval * progress.ease_factor);
        }
        
        // 更新容易度因子
        progress.ease_factor = Math.max(1.3, progress.ease_factor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02)));
        progress.step += 1;
        progress.next_review_time = now + (progress.interval * 24 * 60 * 60 * 1000);
      }
      
      // 保存更新
      const saveRequest = store.put(progress);
      saveRequest.onsuccess = () => resolve(progress);
      saveRequest.onerror = () => reject(saveRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}
```

## 5. APKG文件解析导入流程

### 5.1 APKG文件结构

APKG文件实际上是一个ZIP文件，包含以下主要内容：

1. `collection.anki2` - SQLite数据库文件，包含卡片、笔记、牌组等核心数据
2. `media`文件 - 可能存在的媒体文件集合
3. `meta.json` - 元数据信息

### 5.2 解析导入流程

#### 5.2.1 文件解压

使用JavaScript的ZIP库（如jszip）解压APKG文件：

```javascript
async function extractApkgFile(file) {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  
  // 获取SQLite数据库文件
  const dbFile = await contents.file('collection.anki2').async('arraybuffer');
  
  // 获取媒体文件列表
  let mediaFiles = {};
  if (contents.file('media')) {
    const mediaContent = await contents.file('media').async('text');
    mediaFiles = JSON.parse(mediaContent);
  }
  
  return { dbFile, mediaFiles, zip };
}
```

#### 5.2.2 SQLite数据库解析

使用SQLite.js库解析SQLite数据库文件：

```javascript
async function parseAnkiDatabase(dbFile) {
  const db = new SQLite3.Database(new Uint8Array(dbFile));
  
  // 查询牌组信息
  const decks = await db.all('SELECT * FROM decks');
  
  // 查询笔记信息
  const notes = await db.all('SELECT * FROM notes');
  
  // 查询卡片信息
  const cards = await db.all('SELECT * FROM cards');
  
  // 查询模型信息
  const models = await db.all('SELECT * FROM models');
  
  db.close();
  
  return { decks, notes, cards, models };
}
```

#### 5.2.3 数据转换与导入

将Anki数据转换为应用数据模型并导入IndexDB：

```javascript
async function importAnkiData(ankiData, mediaFiles, zip, db) {
  const { decks, notes, cards, models } = ankiData;
  const transaction = db.transaction(['decks', 'notes', 'cards', 'models'], 'readwrite');
  
  // 导入模型
  for (const modelData of models) {
    const model = JSON.parse(modelData.models);
    for (const [modelId, modelInfo] of Object.entries(model)) {
      const modelObj = {
        id: modelId,
        name: modelInfo.name,
        fields: modelInfo.flds.map(f => ({ name: f.name, ord: f.ord })),
        templates: Object.values(modelInfo.tmpls),
        css: modelInfo.css
      };
      await transaction.objectStore('models').put(modelObj);
    }
  }
  
  // 导入牌组
  const deckMap = new Map(); // 映射Anki deck ID到我们的deck ID
  const parsedDecks = JSON.parse(decks[0].decks);
  
  for (const [ankiDeckId, deckInfo] of Object.entries(parsedDecks)) {
    if (typeof deckInfo === 'object' && !deckInfo.dyn) { // 跳过动态牌组
      const deckId = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deckObj = {
        id: deckId,
        name: deckInfo.name,
        description: '',
        total_cards: 0, // 稍后更新
        learned_cards: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: { original_id: ankiDeckId }
      };
      await transaction.objectStore('decks').put(deckObj);
      deckMap.set(ankiDeckId, deckId);
    }
  }
  
  // 导入笔记和卡片
  const noteIdMap = new Map(); // 映射Anki note ID到我们的note ID
  let totalCards = 0;
  
  for (const noteData of notes) {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    noteIdMap.set(noteData.id.toString(), noteId);
    
    // 解析字段
    const fields = {};
    const fieldValues = noteData.flds.split('\x1f');
    
    // 获取模型信息以正确映射字段
    const modelData = models.find(m => {
      const modelObj = JSON.parse(m.models);
      return Object.values(modelObj).some((m: any) => m.id == noteData.mid);
    });
    
    if (modelData) {
      const modelObj = JSON.parse(modelData.models);
      const model = Object.values(modelObj).find((m: any) => m.id == noteData.mid);
      
      if (model) {
        model.flds.forEach((field: any, index: number) => {
          fields[field.name] = fieldValues[index] || '';
        });
      }
    }
    
    const noteObj = {
      id: noteId,
      deck_id: deckMap.values().next().value, // 简化处理，实际应根据牌组信息映射
      model_id: noteData.mid.toString(),
      fields,
      tags: noteData.tags ? JSON.parse(noteData.tags).filter(t => t) : [],
      created_at: noteData.id,
      updated_at: noteData.mod
    };
    
    await transaction.objectStore('notes').put(noteObj);
  }
  
  // 导入卡片
  for (const cardData of cards) {
    const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const noteId = noteIdMap.get(cardData.nid.toString());
    
    if (noteId) {
      // 查找对应的笔记和模型以生成卡片正反面
      const noteTx = db.transaction('notes', 'readonly');
      const noteStore = noteTx.objectStore('notes');
      const noteObj = await noteStore.get(noteId);
      
      if (noteObj) {
        const modelTx = db.transaction('models', 'readonly');
        const modelStore = modelTx.objectStore('models');
        const modelObj = await modelStore.get(noteObj.model_id);
        
        if (modelObj && modelObj.templates[cardData.ord]) {
          const template = modelObj.templates[cardData.ord];
          
          // 替换模板中的字段占位符
          let front = template.qfmt;
          let back = template.afmt;
          
          for (const [fieldName, fieldValue] of Object.entries(noteObj.fields)) {
            const regex = new RegExp(`\{\{${fieldName}\}\}`, 'g');
            front = front.replace(regex, fieldValue);
            back = back.replace(regex, fieldValue);
          }
          
          const cardObj = {
            id: cardId,
            note_id: noteId,
            deck_id: noteObj.deck_id,
            ord: cardData.ord,
            template_name: template.name,
            front,
            back,
            created_at: cardData.id
          };
          
          await transaction.objectStore('cards').put(cardObj);
          totalCards++;
        }
      }
    }
  }
  
  // 更新牌组卡片数量
  for (const [_, deckId] of deckMap.entries()) {
    const deckStore = transaction.objectStore('decks');
    const deck = await deckStore.get(deckId);
    if (deck) {
      deck.total_cards = totalCards;
      await deckStore.put(deck);
    }
  }
  
  await transaction.done;
  return { success: true, deckIds: Array.from(deckMap.values()) };
}
```

## 5. Chrome TTS API语音功能设计

### 5.1 语音功能概述

使用Chrome TTS API替代传统的音频文件，实现单词朗读功能，具有以下优势：

1. 无需存储大量音频文件，节省存储空间
2. 动态生成语音，支持多种语言和发音
3. 可自定义语速、音高等参数

### 5.2 API设计

```typescript
/**
 * TTS语音服务接口
 */
export interface TTSService {
  /**
   * 朗读文本
   * @param text 要朗读的文本
   * @param options 朗读选项
   * @returns Promise<void>
   */
  speak(text: string, options?: SpeakOptions): Promise<void>;
  
  /**
   * 停止朗读
   */
  stop(): void;
  
  /**
   * 暂停朗读
   */
  pause(): void;
  
  /**
   * 恢复朗读
   */
  resume(): void;
  
  /**
   * 检查TTS API是否可用
   * @returns boolean
   */
  isAvailable(): boolean;
  
  /**
   * 获取可用的语音列表
   * @returns Promise<Array<Voice>>
   */
  getAvailableVoices(): Promise<Array<Voice>>;
}

/**
 * 朗读选项
 */
export interface SpeakOptions {
  lang?: string; // 语言代码，如 'en-US', 'zh-CN'
  voiceName?: string; // 语音名称
  rate?: number; // 语速，0.1-10.0，默认1.0
  pitch?: number; // 音高，0.5-2.0，默认1.0
  volume?: number; // 音量，0.0-1.0，默认1.0
}

/**
 * 语音信息
 */
export interface Voice {
  voiceName: string;
  lang: string;
  localService: boolean;
  default: boolean;
}
```

### 5.3 实现示例

```javascript
class ChromeTTSService {
  constructor() {
    this.isSpeaking = false;
  }
  
  isAvailable() {
    return 'speechSynthesis' in window;
  }
  
  async speak(text, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('TTS API is not available in this browser');
    }
    
    // 停止当前朗读
    this.stop();
    
    const { 
      lang = 'en-US', 
      voiceName = '', 
      rate = 1.0, 
      pitch = 1.0, 
      volume = 1.0 
    } = options;
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      // 如果指定了语音名称，尝试找到匹配的语音
      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }
      
      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(event.error);
      };
      
      this.isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    });
  }
  
  stop() {
    if (this.isAvailable()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }
  
  pause() {
    if (this.isAvailable()) {
      window.speechSynthesis.pause();
    }
  }
  
  resume() {
    if (this.isAvailable()) {
      window.speechSynthesis.resume();
    }
  }
  
  async getAvailableVoices() {
    if (!this.isAvailable()) {
      return [];
    }
    
    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      
      if (voices.length) {
        resolve(voices);
      } else {
        // 有些浏览器需要等待voiceschanged事件
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(voices);
        };
      }
    });
  }
}
```

### 5.4 集成到应用

```javascript
// 在单词卡片组件中使用TTS
function WordCard({ word }) {
  const ttsService = new ChromeTTSService();
  
  const handleSpeakWord = async () => {
    try {
      await ttsService.speak(word.word, {
        lang: 'en-US',
        rate: 0.8 // 稍慢的语速更适合学习
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  };
  
  return (
    <div className="word-card">
      <div className="word-front">
        <h2>{word.word}</h2>
        <p className="phonetic">{word.phonetic}</p>
        <button onClick={handleSpeakWord} disabled={!ttsService.isAvailable()}>
          🔊
        </button>
      </div>
      {/* 卡片背面... */}
    </div>
  );
}
```

## 6. 架构设计与实现建议

### 6.1 核心服务层

建议创建以下核心服务：

1. **IDBService** - 封装IndexDB操作
2. **APKGImporterService** - 处理APKG文件解析和导入
3. **TTSService** - 语音朗读服务
4. **SRSAlgorithmService** - 间隔重复算法服务
5. **StudySessionService** - 学习会话管理

### 6.2 数据流设计

采用单向数据流模式：

1. 用户操作触发Action
2. Service层处理业务逻辑
3. IndexDB存储状态变更
4. 组件订阅数据变更并更新UI

### 6.3 实现路径建议

1. 首先实现IndexDB服务，提供基础数据存储能力
2. 实现APKG导入功能，支持牌组导入
3. 集成Chrome TTS API，替代音频文件
4. 重构现有组件，使用新的服务和数据模型
5. 添加多牌组管理界面

## 7. 性能优化考虑

1. **懒加载**：牌组数据按需加载，避免一次性加载所有数据
2. **批量操作**：使用事务进行批量数据库操作，提高性能
3. **索引优化**：确保常用查询路径都有合适的索引
4. **缓存机制**：对频繁访问的数据实现内存缓存
5. **分页查询**：大量数据查询时使用分页加载

## 8. 安全性考虑

1. **文件验证**：严格验证APKG文件格式，防止恶意文件
2. **SQL注入防护**：使用参数化查询，避免SQL注入风险
3. **XSS防护**：对用户输入和动态生成的HTML内容进行转义
4. **权限控制**：确保用户只能访问自己的数据
5. **数据备份**：提供导出功能，防止数据丢失

## 9. 后续优化方向

1. 实现数据同步功能，支持跨设备使用
2. 添加自定义卡片模板支持
3. 引入机器学习优化复习算法
4. 添加社交功能，支持牌组分享
5. 优化移动端体验，支持离线使用

---

通过本设计，可以显著提升应用的性能和用户体验，解决当前版本的主要痛点，同时为后续功能扩展提供良好的基础架构。