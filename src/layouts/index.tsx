import { Outlet, useLocation, history } from 'umi';
import { TabBar } from 'antd-mobile';
import { AppOutline, UserOutline } from 'antd-mobile-icons';
import styles from './index.less';

export default function Layout() {
  const location = useLocation();
  
  // Determine active tab based on current path
  const getActiveKey = () => {
    if (location.pathname.startsWith('/Dictionaries/profile')) {
      return '/Dictionaries/profile';
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
      key: '/profile',
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  return (
    <div style={{ paddingBottom: '50px' }}>
      <Outlet />
      <TabBar activeKey={getActiveKey()} onChange={setActiveKey}>
        {tabs.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  );
}
