import { ROOT_PATH } from './baseConfig';

/**
 * 生产环境webpack配置
 * 只包含生产环境特有的配置项
 * 基础配置已移至webpackBaseConfig.ts，并在.umirc.ts中进行合并
 */
export default {
  // 生产环境特有的配置，包含统计脚本引用
  headScripts: [ 
    // 统计脚本
    { src: 'https://019abf31-25dd-7bbe-875c-d7ff169c4f18.spst2.com/ustat.js' }
  ],
  
  // 开发工具配置（生产环境通常禁用）
  devtool: false,
  
  // 全局变量定义
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  
  // 压缩配置
  compression: {
    gzip: true,
    brotli: false,
  },
};
