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
    <TresGridHelper :args="[400, 40, 0x444444, 0x888888]" />

    <!-- 道路 -->
    <Road v-for="road in roads" :key="road.id" :points="road.points" :features="road.features" />

    <!-- 特定建筑 -->
    <SpecificBuilding
      v-for="building in specificBuildings"
      :key="building.id"
      :model-path="building.modelPath"
      :position="building.position"
      :scale="building.scale"
      :rotation="building.rotation"
    />

    <!-- 通用建筑 -->
    <GenericBuilding
      v-for="building in genericBuildings"
      :key="building.id"
      :position="building.position"
      :scale="building.scale"
      :features="building.features"
    />

    <!-- 树木 -->
    <TreesInstance :model-paths="trees.modelPaths" :instances="trees.instances" />

    <!-- 路灯 -->
    <StreetLight :instances="streetLights.instances" />
  </TresGroup>
</template>

<script setup>
  import { sceneData } from '../data/sceneData';
  import SpecificBuilding from './SpecificBuilding.vue';
  import GenericBuilding from './GenericBuilding.vue';
  import TreesInstance from './TreesInstance.vue';
  import StreetLight from './StreetLight.vue';
  import Road from './Road.vue';

  const { specificBuildings, genericBuildings, trees, streetLights, roads } = sceneData;
</script>
