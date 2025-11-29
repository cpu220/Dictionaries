import { Outlet, useLocation, history } from 'umi';
import { TabBar } from 'antd-mobile';
import { AppOutline, UserOutline, FolderOutline } from 'antd-mobile-icons';
import styles from './index.less';

export default function Layout() {
  const location = useLocation();
  
  // Determine active tab based on current path
  const getActiveKey = () => {
    if (location.pathname.startsWith('/Dictionaries/profile')) {
      return '/Dictionaries/profile';
    }
    if (location.pathname.startsWith('/Dictionaries/decks')) {
      return '/Dictionaries/decks';
    }
    return '/Dictionaries/';
  };

  const setActiveKey = (key: string) => {
    history.push(key);
  };

  const tabs = [
    {
      key: '/',
      title: '首页',
      icon: <AppOutline />,
    },
    {
      key: '/decks',
      title: '卡包',
      icon: <FolderOutline />,
    },
    {
      key: '/profile',
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  // 检查是否为study页面，不显示底部导航栏
  const isStudyPage = location.pathname.startsWith('/study');
  console.log('isStudyPage', isStudyPage);
  return (
    <div className={styles.container}>
      {!isStudyPage && <div className={styles.content}>
        <Outlet />
      </div>}
      {isStudyPage && <div className={styles.fullContent}>
        <Outlet />
      </div>}
      {!isStudyPage && <div className={styles.tabBar}>
        <TabBar activeKey={getActiveKey()} onChange={setActiveKey}>
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>}
    </div>
  );
}