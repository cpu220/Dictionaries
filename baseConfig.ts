export const ROOT_PATH = '/Dictionaries';

// CommonJS 兼容导出
export default { ROOT_PATH };

// 支持 Node.js 的 require 方式引入
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ROOT_PATH };
  module.exports.default = { ROOT_PATH };
}