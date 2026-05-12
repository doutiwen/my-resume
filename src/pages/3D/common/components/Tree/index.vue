<template>
  <TresGroup>
    <TresInstancedMesh
      v-if="treeInstancedState.isModelLoaded.value"
      :args="[
        treeInstancedState.mergedGeometry,
        treeInstancedState.material,
        treeInstancedState.MAX_INSTANCES,
      ]"
      @created="onInstancedMeshCreated"
    />
  </TresGroup>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { treeInstancedState } from './useTreeInstancedState';

  const props = defineProps({
    position: {
      type: Array,
      default: () => [0, 0, 0],
    },
    scale: {
      type: Array,
      default: () => [1, 1, 1],
    },
    rotation: {
      type: Array,
      default: () => [0, 0, 0],
    },
  });

  const onInstancedMeshCreated = (mesh) => {
    const sharedMesh = treeInstancedState.setInstancedMesh(mesh);
    treeInstancedState.addInstance(sharedMesh, props.position, props.scale, props.rotation);
  };

  onMounted(async () => {
    if (!treeInstancedState.isModelLoaded.value && !treeInstancedState.isLoading) {
      await treeInstancedState.loadModel();
    }
  });
</script>
