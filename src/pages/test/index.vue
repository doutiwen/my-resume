<script setup>
  import { ref, onMounted } from 'vue';
  import * as TWEEN from '@tweenjs/tween.js';
  // 引入全局分组
  import { globalTweenGroup } from './common/tween.js';

  const boxX = ref(0);
  onMounted(() => {
    console.log('onMounted');

    new TWEEN.Tween({ x: 0 }, globalTweenGroup)
      .to({ x: 300 }, 2000)
      .onUpdate((val) => {
        console.log('val:', val);
        boxX.value = val.x;
      })
      .start();
  });
</script>
<template>
  <div
    :style="{
      left: boxX + 'px',
      position: 'absolute',
      width: '50px',
      height: '50px',
      background: 'red',
    }"
  ></div>
</template>
