import { createApp } from 'vue';
import App from './app.vue';
import router from './router/index.js';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { createPinia } from 'pinia';
const pinia = createPinia();

const app = createApp(App);

const componentModules = import.meta.glob([
  './components/**/index.{vue,js,jsx,ts,tsx}',
  '!./components/**/core/**',
]);
Object.entries(componentModules).forEach(([path, loadComponent]) => {
  const pathParts = path.split('/');
  const componentName = pathParts[pathParts.length - 2];
  app.component(componentName, defineAsyncComponent(loadComponent));
});

app
  .use(pinia)
  .use(router)
  .use(ElementPlus, {
    locale: zhCn,
  })
  .mount('#app');

export default app;
