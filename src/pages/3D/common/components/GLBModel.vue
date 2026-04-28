<template>
  <primitive v-if="state?.scene" :object="state.scene" />
</template>

<script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { useGraph, useLoader } from '@tresjs/core';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
  import modelUrl from '@/assets/3d model/NewProject.glb';

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  dracoLoader.preload();

  const { state, isLoading, error } = useLoader(GLTFLoader, modelUrl, {
    extensions: (loader) => {
      if (loader instanceof GLTFLoader) {
        loader.setDRACOLoader(dracoLoader);
      }
    },
  });
</script>
