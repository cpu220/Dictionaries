import { ROOT_PATH } from "./baseConfig";

/**
 * 公共webpack配置，包含开发和生产环境共用的配置项
 */
export default {
  title: "知识星球",
  favicons: ["/Dictionaries/favicon.svg"],
  // 路由配置
  routes: [
    { path: "/", component: "home/index" },
    { path: "/home3d", component: "home3d/index" },
    { path: "/profile", component: "profile/index" },
    { path: "/profile/learned", component: "profile/learned/index" },
    { path: "/study", component: "study/index" },
    { path: "/import", component: "import/index" },
    { path: "/decks", component: "decks/index" },
    { path: "/settings", component: "settings/index" },
  ],

  // npm客户端配置
  npmClient: "npm",

  // 是否启用MFSU（Module Federation Speed Up）
  mfsu: false,

  // 配置基础路径和公共路径，用于Nginx部署
  base: `${ROOT_PATH}/`,
  publicPath: `${ROOT_PATH}/`,
};
