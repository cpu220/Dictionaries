import { defineConfig } from "umi";
import { ROOT_PATH } from './baseConfig';

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'yarn',
    // 配置基础路径和公共路径，用于Nginx部署
  base: `${ROOT_PATH}/`,
  publicPath: `${ROOT_PATH}/`,
});
