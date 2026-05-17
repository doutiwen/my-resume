<template>
  <div class="rank-container">
    <div class="rank-header">
      <span class="header-cell header-cell序号">序号</span>
      <span class="header-cell header-cell-name">大区名称</span>
      <span class="header-cell header-cell-config">配置总数</span>
      <span class="header-cell header-cell-total">统计总数</span>
    </div>
    <div class="rank-list">
      <div
        v-for="(item, index) in rankData"
        :key="index"
        class="rank-item animate-rank"
        :style="{ animationDelay: index * 0.1 + 's' }"
      >
        <div :class="['rank-number', { 'rank-number-top': item.rank <= 3 }]">{{ item.rank }}</div>
        <span class="rank-name">{{ item.name }}</span>
        <span class="rank-config">{{ item.config }}</span>
        <span class="rank-total">{{ item.total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  const rankData = [
    { rank: 1, name: '华北大区A分区', config: '184,620', total: '6,843' },
    { rank: 2, name: '华东大区山东C区', config: '359,271', total: '10,957' },
    { rank: 3, name: '华北大区', config: '628,600', total: '270,983' },
  ];
</script>

<style lang="scss" scoped>
  @keyframes rankAnim {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .rank-container {
    width: 100%;
  }

  .rank-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
  }

  .header-cell {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .header-cell序号 {
    width: 3rem;
    text-align: center;
  }

  .header-cell-name {
    flex: 1;
  }

  .header-cell-config {
    width: 6rem;
    text-align: right;
  }

  .header-cell-total {
    width: 6rem;
    text-align: right;
  }

  .rank-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rank-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(34, 211, 238, 0.1);
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
    border-left: 3px solid transparent;
    transition: all 0.3s ease;
    animation: rankAnim 0.4s ease-out forwards;
    opacity: 0;

    &:hover {
      background: rgba(34, 211, 238, 0.2);
      border-left-color: #22d3ee;
    }
  }

  .rank-number {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.75rem;
    margin-right: 0.75rem;
  }

  .rank-number-top {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
  }

  .rank-name {
    flex: 1;
    font-size: 0.875rem;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rank-config {
    width: 6rem;
    text-align: right;
    font-size: 0.875rem;
    color: #22d3ee;
    font-family: monospace;
  }

  .rank-total {
    width: 6rem;
    text-align: right;
    font-size: 0.875rem;
    color: #0891b2;
    font-family: monospace;
  }
</style>
