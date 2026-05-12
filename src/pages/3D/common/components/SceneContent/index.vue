<template>
  <TresGroup>
    <!-- 环境光 -->
    <TresAmbientLight :intensity="0.6" />

    <!-- 方向光（太阳光） -->
    <TresDirectionalLight :position="[50, 100, 50]" :intensity="1.2" :cast-shadow="true" />

    <!-- 地面 -->
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]">
      <TresPlaneGeometry :args="[400, 400]" />
      <TresMeshStandardMaterial color="#7CFC00" :roughness="0.8" :metalness="0" />
    </TresMesh>

    <!-- 网格辅助线 -->
    <!-- <TresGridHelper :args="[400, 40, 0x444444, 0x888888]" /> -->

    <!-- 道路 -->
    <!-- <Road v-for="road in roads" :key="road.id" :points="road.points" :features="road.features" /> -->

    <Building
      v-for="building in buildings"
      :key="building.id"
      :model-name="building.modelName"
      :position="building.position"
      :scale="building.scale"
      :rotation="building.rotation"
      :lod-distances="building.lodDistances"
    />

    <Tree
      v-for="tree in trees"
      :key="tree.id"
      :position="tree.position"
      :scale="tree.scale"
      :rotation="tree.rotation"
    />

    <!-- 路灯（暂时注释） -->
    <!-- <StreetLight :model-path="streetLights.modelPath" :instances="streetLights.instances" /> -->
  </TresGroup>
</template>

<script setup>
  import { sceneData } from '../../data/sceneData';
  import Building from '../Building/index.vue';
  import Tree from '../Tree/index.vue';
  // import Road from './Road.vue';

  const { buildings, trees, roads } = sceneData;
</script>
