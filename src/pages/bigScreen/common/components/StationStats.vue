<template>
  <div class="station-container">
    <div ref="chartRef" class="chart-left"></div>
    <div class="chart-right">
      <div v-for="(item, index) in regionData" :key="index" class="region-row">
        <div class="region-left">
          <div class="region-dot" :style="{ backgroundColor: item.color }"></div>
          <span class="region-name">{{ item.name }}</span>
        </div>
        <span class="region-value" :style="{ color: item.color }">{{ item.value }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';

  const chartRef = ref(null);
  let chartInstance = null;

  const regionData = [
    { name: '区域一', value: 21, color: '#3b82f6' },
    { name: '区域二', value: 28, color: '#06b6d4' },
    { name: '区域三', value: 32, color: '#8b5cf6' },
    { name: '区域四', value: 19, color: '#f59e0b' },
  ];

  onMounted(() => {
    if (!chartRef.value) return;

    chartInstance = echarts.init(chartRef.value);

    const option = {
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: 'rgba(34, 211, 238, 0.3)',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#22d3ee',
            },
          },
          data: regionData.map((d) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: d.color },
          })),
        },
      ],
    };

    chartInstance.setOption(option);

    const handleResize = () => {
      chartInstance?.resize();
    };

    window.addEventListener('resize', handleResize);

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      chartInstance?.dispose();
    });
  });
</script>

<style lang="scss" scoped>
  .station-container {
    width: 100%;
    height: 100%;
    display: flex;
  }

  .chart-left {
    width: 50%;
    height: 100%;
  }

  .chart-right {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .region-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .region-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .region-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
  }

  .region-name {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .region-value {
    font-size: 0.875rem;
    font-weight: 700;
  }
</style>
