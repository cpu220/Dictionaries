module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 37.5, // 以375px设计稿为基准，1rem = 37.5px
      propList: ['*'], // 所有属性都转换为rem
      selectorBlackList: [], // 不转换的选择器
      exclude: /node_modules/i, // 排除node_modules目录
      minPixelValue: 1, // 小于1px的不转换
      mediaQuery: false, // 不转换媒体查询中的px
    },
  },
};
