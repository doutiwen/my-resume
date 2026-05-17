<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';

  const chartRef = ref(null);
  let chartInstance = null;

  const timeData = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
  const valueData1 = [78.6, 41.6, 57.2, 35.0, 31.8, 40.5, 54.7];
  const valueData2 = [65, 38, 52, 42, 35, 45, 58];

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
      legend: {
        data: ['指标一', '指标二'],
        right: 0,
        top: 0,
        textStyle: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 11,
        },
        itemWidth: 12,
        itemHeight: 8,
      },
      xAxis: {
        type: 'category',
        data: timeData,
        axisLine: {
          lineStyle: { color: 'rgba(148, 163, 184, 0.3)' },
        },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 10,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'K',
        nameTextStyle: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 10,
          padding: [0, 0, 0, -20],
        },
        max: 80,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: 10,
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
          name: '指标一',
          type: 'bar',
          barWidth: 8,
          data: valueData1,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.2)' },
            ]),
            borderRadius: [2, 2, 0, 0],
          },
        },
        {
          name: '指标二',
          type: 'line',
          smooth: true,
          data: valueData2,
          lineStyle: {
            color: '#f59e0b',
            width: 2,
          },
          itemStyle: {
            color: '#f59e0b',
          },
          symbol: 'circle',
          symbolSize: 6,
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
