<template>
  <TresGroup>
    <TresInstancedMesh :args="[lightGeometry, lightMaterial, instances.length]">
      <TresCylinderGeometry :args="[0.1, 0.1, 6, 8]" />
      <TresMeshStandardMaterial color="#757575" :roughness="0.5" :metalness="0.3" />
    </TresInstancedMesh>
  </TresGroup>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import * as THREE from 'three';
  import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

  const props = defineProps({
    instances: {
      type: Array,
      required: true,
    },
  });

  const lightGeometry = ref(null);
  const lightMaterial = ref(null);

  onMounted(() => {
    // 创建路灯几何体
    const geometries = [];

    // 灯杆
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
    poleGeo.translate(0, 3, 0);
    geometries.push(poleGeo);

    // 横杆
    const armGeo = new THREE.BoxGeometry(1.5, 0.08, 0.08);
    armGeo.translate(0.75, 5.5, 0);
    geometries.push(armGeo);

    // 灯头
    const headGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    headGeo.translate(1.5, 5.5, 0);
    geometries.push(headGeo);

    // 灯泡
    const bulbGeo = new THREE.SphereGeometry(0.15, 16, 16);
    bulbGeo.translate(1.5, 5.3, 0);
    geometries.push(bulbGeo);

    // 合并几何体
    const merged = BufferGeometryUtils.mergeGeometries(geometries);

    lightGeometry.value = merged;
    lightMaterial.value = new THREE.MeshStandardMaterial({
      color: '#757575',
      roughness: 0.5,
      metalness: 0.3,
    });
  });
</script>
