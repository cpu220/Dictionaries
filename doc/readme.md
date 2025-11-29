# 知识星球项目文档

## 技术栈

- **React**：前端框架
- **Umi**：React应用框架，提供路由、构建等功能
- **TypeScript**：类型安全的JavaScript超集
- **Less**：CSS预处理器，由于是H5应用，使用rem单位（750px -> 7.5rem）
- **组件库**：antd-mobile，提供移动端UI组件

## 主要目录结构

### 根目录
- **src/assets**：静态资源目录
  - **src/assets/data**：CET4单词数据
  - **src/assets/data/cet4/cet4_imported.json**：导入的CET4单词数据
  - **src/assets/data/cet4/audio**：CET4单词音频

- **src/components**：组件目录
  - **Flashcard**：闪卡组件，包含正面、背面和音标行
  - **SpeechSettingsPanel**：语音设置面板
  - **StudyNavigation**：学习导航组件

- **src/consts**：常量目录，存放通用枚举、常量
  - decks.ts：卡片组相关常量
  - difficulty.ts：难度相关常量
  - home3d.ts：3D首页相关常量

- **src/interfaces**：接口定义目录

- **src/layouts**：布局组件目录

- **src/models**：全局状态存储目录
  - CONTENT.ts：内容相关状态
  - GLOBAL.ts：全局状态

- **src/pages**：页面组件目录
  - **home**：首页
  - **home3d**：3D效果首页
  - **study**：学习页
  - **decks**：卡片组页
  - **import**：导入页
  - **profile**：个人页
  - **settings**：设置页

- **src/services**：服务目录
  - **database/indexeddb**：IndexedDB数据库操作服务
  - **import**：导入功能服务
  - **scheduling**：学习计划调度服务

- **src/utils**：工具方法目录
  - **storage**：存储相关工具
  - audioCache.ts：音频缓存工具
  - audioUtils.ts：音频处理工具
  - data.ts：数据处理工具
  - phonetic-engine.ts：音标处理引擎
  - scheduler.ts：调度算法工具
  - tts.ts：文本转语音工具

## 主要功能

1. **单词学习**：仿照Anki的卡片式学习，正面显示单词，背面显示翻译、音标、例句
2. **学习进度跟踪**：记录学习过的单词和学习进度
3. **单词音频播放**：支持单词发音播放
4. **学习计划调度**：根据记忆曲线算法安排学习计划
5. **单词熟练度标记**：提供4个按钮用于标记单词熟练度
6. **支持导入单词数据**：支持导入自定义单词数据
7. **个人学习统计**：统计每日学习情况
8. **3D首页效果**：提供3D星球效果的首页

## IndexedDB数据库结构

### 1. decks表

| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | string | 卡片组唯一标识符 |
| name | string | 卡片组名称 |
| description | string | 卡片组描述 |
| total_cards | number | 总卡片数 |
| learned_cards | number | 已学习卡片数 |
| created_at | number | 创建时间戳 |
| updated_at | number | 更新时间戳 |
| last_studied | number | 最后学习时间戳 |
| metadata | Record<string, any> | 元数据，存储额外信息 |

**用途**：存储卡片组信息，用于组织和管理不同的学习内容。

### 2. notes表

| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | string | 笔记唯一标识符 |
| deck_id | string | 所属卡片组ID |
| model_id | string | 所属模型ID |
| fields | Record<string, string> | 笔记字段，存储实际内容 |
| tags | string[] | 标签，用于分类和检索 |
| created_at | number | 创建时间戳 |
| updated_at | number | 更新时间戳 |

**用途**：存储笔记信息，一条笔记可以生成多张卡片。

### 3. cards表

| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | string | 卡片唯一标识符 |
| note_id | string | 所属笔记ID |
| deck_id | string | 所属卡片组ID |
| ord | number | 卡片在笔记中的顺序 |
| template_name | string | 卡片模板名称 |
| front | string | 卡片正面内容 |
| back | string | 卡片背面内容 |
| word | string | 提取的单词，用于音频/TTS |
| phonetic | string | 提取的音标，用于显示/TTS |
| created_at | number | 创建时间戳 |
| type | number | 卡片类型：0=新卡, 1=学习中, 2=复习, 3=重新学习 |
| queue | number | 队列类型：-1=暂停, 0=新卡, 1=学习中, 2=复习, 3=当日学习 |
| due | number | 到期时间戳或顺序索引 |
| interval | number | 间隔天数 |
| factor | number | 容易因子，默认2500 |
| reps | number | 复习次数 |
| lapses | number | 遗忘次数 |

**用途**：存储卡片信息，是实际用于学习的单位。

### 4. models表

| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | string | 模型唯一标识符 |
| name | string | 模型名称 |
| fields | { name: string; ord: number }[] | 模型字段定义 |
| templates | { name: string; qfmt: string; afmt: string; ord: number }[] | 卡片模板定义 |
| css | string | 卡片样式 |

**用途**：存储卡片模型信息，定义笔记如何转换为卡片。

### 5. revlog表

| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | number | 日志唯一标识符（时间戳） |
| card_id | string | 所属卡片ID |
| ease | number | 难度等级：1= Again, 2=Hard, 3=Good, 4=Easy |
| interval | number | 间隔天数 |
| last_interval | number | 上次间隔天数 |
| factor | number | 容易因子 |
| time | number | 花费时间（毫秒） |
| type | number | 复习类型：0=学习, 1=复习, 2=重新学习, 3=突击复习 |

**用途**：存储复习日志，用于分析学习效果和调整学习计划。

### 6. daily_stats表

| 字段名 | 类型 | 描述 |
|-------|------|------|
| date | string | 日期（YYYY-MM-DD） |
| total_cards | number | 当日复习总卡片数 |
| learned_cards | number | 当日学习新卡片数 |
| review_cards | number | 当日复习卡片数 |
| time_spent | number | 当日学习总时间（毫秒） |

**用途**：存储每日学习统计信息，用于展示学习进度和统计数据。

## 数据库服务

项目使用IndexedDB进行本地数据存储，提供了以下服务：

- **CardService**：卡片相关数据库操作
- **DeckService**：卡片组相关数据库操作
- **ModelService**：模型相关数据库操作
- **NoteService**：笔记相关数据库操作
- **StatsService**：统计相关数据库操作

这些服务封装了对IndexedDB的操作，提供了简洁的API供应用使用。