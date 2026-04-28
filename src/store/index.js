import { defineStore } from 'pinia';

export const useStore = defineStore('store', () => {
  const menus = ref([
    { path: '/', title: '个人简介' },
    { path: '/3D', title: '3D智慧园区' },
  ]);

  return {
    menus,
  };
});

export default useStore;
