import { defineAsyncComponent } from 'vue';

const ArcgisMap = defineAsyncComponent(() => import('./map/index.vue'));

ArcgisMap.install = (Vue) => {
  Vue.component(ArcgisMap.name, ArcgisMap)
}

export default ArcgisMap
