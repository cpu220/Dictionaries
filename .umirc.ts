import { defineConfig } from 'umi';
import webpackBaseConfig from './webpackBaseConfig';

/**
 * Umi配置文件
 * 实现基础配置与环境特定配置的合并
 */
const isDev = process.env.NODE_ENV === 'development';

// 根据环境动态导入对应环境配置
const envConfig = isDev
  ? require('./webpack.dev').default
  : require('./webpack.online').default;

// 合并基础配置和环境特定配置
// 环境配置中的项会覆盖基础配置中同名的项
const mergedConfig = {
  ...webpackBaseConfig,
  ...envConfig,
  // 特殊处理headScripts等数组类型的配置项，进行合并而不是覆盖
  // headScripts: [...(envConfig.headScripts || [])]
};

// 导出合并后的配置
export default defineConfig({
  ...mergedConfig,
  // 解决esbuild helpers冲突问题
  esbuildMinifyIIFE: true,
});