import { ROOT_PATH } from './baseConfig';

/**
 * 开发环境webpack配置
 * 只包含开发环境特有的配置项
 * 基础配置已移至webpackBaseConfig.ts，并在.umirc.ts中进行合并
 */
export default {
 
  // 开发环境特有的配置
  headScripts: [
    // {
    //   content: `
    //     // 动态创建favicon链接
    //     const link = document.createElement('link');
    //     link.rel = 'icon';
    //     link.href = '${ROOT_PATH}/favicon.svg';
    //     link.type = 'image/svg+xml';
    //     document.head.appendChild(link);
    //   `,
    // },
  ],
  
  // 开发工具配置
  devtool: 'source-map',
  
  // 全局变量定义
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
};
