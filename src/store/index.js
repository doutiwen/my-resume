import { defineStore } from 'pinia';
import routes from '~pages';

const routeTitleMap = {
  '/': '个人简介',
  '/3D': '3D智慧园区',
  '/bigScreen': '数据大屏',
  '/home': '个人简介',
};

const filterMenus = (routes) => {
  return routes
    .filter((route) => route.path !== '/:pathMatch(.*)' && route.path !== '/:pathMatch(.*)*')
    .map((route) => ({
      path: route.path,
      title: route.meta?.title || routeTitleMap[route.path] || route.name || route.path,
    }));
};

export const useStore = defineStore('store', () => {
  const menus = ref(filterMenus(routes));

  return {
    menus,
  };
});

export default useStore;
