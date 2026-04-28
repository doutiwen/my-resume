<template>
  <TresGroup>
    <TresInstancedMesh :args="[treeGeometry, treeMaterial, instances.length]">
      <TresConeGeometry :args="[1.5, 4, 8]" />
      <TresMeshStandardMaterial color="#2E7D32" :roughness="0.3" :metalness="0" />
    </TresInstancedMesh>
  </TresGroup>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import * as THREE from 'three';
  import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

  const props = defineProps({
    modelPaths: {
      type: Array,
      required: true,
    },
    instances: {
      type: Array,
      required: true,
    },
  });

  const treeGeometry = ref(null);
  const treeMaterial = ref(null);

  onMounted(() => {
    // 创建树几何体（树干 + 树冠）
    const geometries = [];

    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
    trunkGeo.translate(0, 1.5, 0);
    geometries.push(trunkGeo);

    // 树冠（圆锥形）
    const foliageGeo = new THREE.ConeGeometry(1.5, 5, 8);
    foliageGeo.translate(0, 3.5, 0);
    geometries.push(foliageGeo);

    // 合并几何体
    const merged = BufferGeometryUtils.mergeGeometries(geometries);

    treeGeometry.value = merged;
    treeMaterial.value = new THREE.MeshStandardMaterial({
      color: '#2E7D32',
      roughness: 0.3,
      metalness: 0,
    });
  });
</script>
