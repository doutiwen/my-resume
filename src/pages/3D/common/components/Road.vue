<template>
  <TresGroup>
    <!-- 道路主体 -->
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]">
      <TresBoxGeometry :args="[roadLength, features.width, 0.1]" />
      <TresMeshStandardMaterial :color="features.color" :roughness="0.8" :metalness="0.1" />
    </TresMesh>

    <!-- 道路标线 -->
    <TresGroup v-if="features.hasMarkings">
      <TresMesh
        v-for="(marking, index) in markings"
        :key="index"
        :position="marking"
      >
        <TresBoxGeometry :args="[3, features.width * 0.6, 0.15]" />
        <TresMeshStandardMaterial color="#FFFFFF" :roughness="0.3" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    points: {
      type: Array,
      required: true,
    },
    features: {
      type: Object,
      default: () => ({
        width: 10,
        color: '#424242',
        hasMarkings: true,
      }),
    },
  });

  // 计算道路长度
  const roadLength = computed(() => {
    if (props.points.length >= 2) {
      const start = props.points[0];
      const end = props.points[props.points.length - 1];
      return Math.sqrt(
        Math.pow(end[0] - start[0], 2) +
        Math.pow(end[2] - start[2], 2)
      );
    }
    return 100;
  });

  // 生成道路标线位置
  const markings = computed(() => {
    if (!props.features.hasMarkings) return [];

    const positions = [];
    const startX = props.points[0][0];
    const endX = props.points[props.points.length - 1][0];
    const startZ = props.points[0][2];
    const endZ = props.points[props.points.length - 1][2];

    const directionX = endX - startX;
    const directionZ = endZ - startZ;
    const totalLength = Math.sqrt(directionX * directionX + directionZ * directionZ);

    // 每隔6单位放置一个标线
    for (let i = 6; i < totalLength - 6; i += 12) {
      const ratio = i / totalLength;
      positions.push([
        startX + directionX * ratio,
        0.08,
        startZ + directionZ * ratio,
      ]);
    }

    return positions;
  });
</script>
