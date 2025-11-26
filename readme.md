# 知识星球

这是一个 H5 应用，用于学习只是点的，目前内置了 cet4 单词数据

## 技术栈

- React
- Umi
- TypeScript
- Less ( 由于是 h5，所以单位要使用 rem， 750px -》7.5rem)
- 组件库：antd-mobile

## 静态资源

- src/assets/data：CET4 单词数据
- src/assets/data/cet4/cet4_imported.json ：导入的 CET4 单词数据
- src/assets/data/cet4/audio ：CET4 单词音频

## 目录结构

- src/utils ： 通用方法、工具方法
- src/pages ： 页面组件
- src/layouts ： 布局组件（尽量不要修改）

### 目录规范

为了能够方便管理，路由在 src/page 目录下，目录进行区分

- src/pages/home/index.tsx ： 首页
- src/pages/study/index.tsx ： 学习页
- src/pages/profile/index.tsx ： 个人页

- src/consts ： 常量,存放通用的枚举、常量。以 index 文件统一到处，不通类型和定位的内容按文件进行区分
- src/interfaces ： 接口,存放通用的接口定义。以 index 文件统一到处，不通类型和定位的内容按文件进行区分
- Dictionaries/src/models ：全局状态存储，用于跨路由共享数据

# 功能描述

- 整体界面仿照 anki ，单词以卡片进行展示，正面单词，背面展示单词的翻译、音标、例句。
- 下方有对应的 4 个按钮，用来自行对单词的熟练度进行标记。
- 每次开始背单词，都会随机从 src/assets/data/cet4/cet4_imported.json 内获取单词的数据

## 组件的使用

- 我希望尽可能的使用 antd-mobile 的组件，避免自定义组件。
