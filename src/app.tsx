// 引入amfe-flexible，用于设置根字体大小
import 'amfe-flexible';

// 在开发环境下过滤掉 findDOMNode 警告
if (process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('findDOMNode is deprecated')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// 应用入口配置
export default {
  // 可以在这里配置Umi应用的全局配置
};
