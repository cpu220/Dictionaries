# englishCommonPhrases 卡组加载问题修复说明

## 问题描述
用户报告在访问 `http://127.0.0.1:8000/Dictionaries/study?deck=englishCommonPhrases` 页面时，显示 "No words found in this deck" 错误。

## 问题分析

1. **数据文件检查**：
   - 确认 `src/assets/data/english_CommonPhrases/englishCommonPhrases.json` 文件存在且包含有效的单词数据
   - 数据文件包含 4228 个单词条目，每个条目包含 id, word, phonetic, translation 等必要字段

2. **代码问题**：
   - `src/utils/data.ts` 文件中最初只实现了 cet4 卡组的数据加载逻辑
   - 即使添加了 englishCommonPhrases 数据导入，可能存在路径解析或数据结构问题

## 解决方案

1. **修改 src/utils/data.ts**：
   - 直接导入 englishCommonPhrases 数据文件，使用 webpack 的模块解析能力
   - 添加数据结构验证，确保返回的是有效的单词数组
   - 增加详细的调试日志，帮助诊断问题

2. **调试步骤**：
   - 创建并运行独立测试脚本验证数据文件可正确读取
   - 在 study 页面添加日志，检查 deckId 和加载的单词数量
   - 修改数据加载逻辑，优化错误处理

## 关键修复点

1. **确保导入路径正确**：
   - 注意目录名 `english_CommonPhrases` 中包含下划线
   - 使用 webpack 的模块解析能力处理 `@` 别名

2. **验证数据结构**：
   - 确保返回的是有效的 Word 对象数组
   - 添加类型安全检查

3. **调试信息**：
   - 添加全局和函数级别的调试日志
   - 验证数据加载和处理过程

## 使用方法

修复后，用户可以通过以下方式访问 englishCommonPhrases 卡组：

1. 开发环境：`http://localhost:8001/Dictionaries/study?deck=englishCommonPhrases`
2. 生产环境：根据部署配置访问相应 URL

## 注意事项

- 确保 webpack 正确配置了 JSON 模块加载
- 验证数据格式符合 Word 接口定义
- 检查网络请求和响应，确保数据正确传输和处理