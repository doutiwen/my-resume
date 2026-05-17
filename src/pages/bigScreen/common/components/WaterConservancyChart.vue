<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';

  const chartRef = ref(null);
  let chartInstance = null;

  const data = [
    { name: '类型一', value: 761 },
    { name: '类型二', value: 608 },
    { name: '类型三', value: 972 },
    { name: '类型四', value: 510 },
    { name: '类型五', value: 332 },
  ];

  onMounted(() => {
    if (!chartRef.value) return;

    chartInstance = echarts.init(chartRef.value);

    const option = {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLine: {
          lineStyle: { color: 'rgba(148, 163, 184, 0.3)' },
        },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 11,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '单位(K)',
        nameTextStyle: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 11,
          padding: [0, 0, 0, -30],
        },
        max: 1000,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.1)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          type: 'pictorialBar',
          symbol: 'path://M0,100 L50,100 L50,0 L0,0 Z',
          symbolSize: ['60%', '100%'],
          symbolOffset: [0, 0],
          data: data.map((d, i) => ({
            value: d.value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: ['#3b82f6', '#06b6d4', '#8b5cf6', '#3b82f6', '#06b6d4'][i] },
                { offset: 1, color: ['#1d4ed8', '#0891b2', '#7c3aed', '#1d4ed8', '#0891b2'][i] },
              ]),
              opacity: 0.9,
            },
          })),
          label: {
            show: true,
            position: 'top',
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 20,
              shadowColor: 'rgba(59, 130, 246, 0.5)',
            },
          },
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
  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
