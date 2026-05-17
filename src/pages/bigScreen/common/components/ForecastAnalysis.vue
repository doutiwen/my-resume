<template>
  <div class="forecast-container">
    <div ref="chartRef" class="chart-left"></div>
    <div class="chart-right">
      <div class="pie-legend">
        <div v-for="(item, index) in pieData" :key="index" class="legend-row">
          <div class="legend-left">
            <div class="legend-dot" :style="{ backgroundColor: item.color }"></div>
            <span class="legend-name">{{ item.name }}</span>
          </div>
          <span class="legend-value">{{ item.value }}</span>
        </div>
      </div>

      <div class="stat-items">
        <div class="stat-item animate-item" style="animation-delay: 0.3s">
          <div class="stat-badge stat-badge-blue">A</div>
          <div class="stat-content">
            <div class="stat-label">分析监测</div>
            <div class="stat-number">1275个</div>
          </div>
        </div>

        <div class="stat-item animate-item" style="animation-delay: 0.4s">
          <div class="stat-badge stat-badge-cyan">B</div>
          <div class="stat-content">
            <div class="stat-label">水利预计值</div>
            <div class="stat-number">659个</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';

  const chartRef = ref(null);
  let chartInstance = null;

  const pieData = [
    { name: '监测一', value: 1684, color: '#3b82f6' },
    { name: '监测二', value: 1075, color: '#06b6d4' },
    { name: '监测三', value: 728, color: '#8b5cf6' },
    { name: '监测四', value: 541, color: '#f59e0b' },
    { name: '监测五', value: 950, color: '#ef4444' },
  ];

  onMounted(() => {
    if (!chartRef.value) return;

    chartInstance = echarts.init(chartRef.value);

    const option = {
      series: [
        {
          type: 'pie',
          radius: ['35%', '55%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: 'rgba(34, 211, 238, 0.3)',
            borderWidth: 2,
          },
          label: { show: false },
          data: pieData.map((d) => ({
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
  @keyframes itemAnim {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .forecast-container {
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

  .pie-legend {
    margin-bottom: 1rem;

    .legend-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .legend-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
    }

    .legend-name {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .legend-value {
      font-size: 0.875rem;
      font-weight: 700;
      color: #fff;
    }
  }

  .stat-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 0.5rem;
    animation: itemAnim 0.4s ease-out forwards;
    opacity: 0;
  }

  .stat-badge {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
  }

  .stat-badge-blue {
    background: rgba(34, 211, 238, 0.2);
    color: #22d3ee;
  }

  .stat-badge-cyan {
    background: rgba(34, 211, 238, 0.2);
    color: #22d3ee;
  }

  .stat-content {
    flex: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .stat-number {
    font-size: 0.875rem;
    font-weight: 700;
    color: #f59e0b;
  }
</style>
