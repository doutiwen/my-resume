<template>
  <div class="meteo-container">
    <div class="station-info">
      <div class="station-header">
        <div class="station-badge">
          <span class="badge-text">市</span>
        </div>
        <span class="station-name">市气象部监测站</span>
      </div>
      <p class="station-desc">
        气象环境监测站在农业环境监测中发挥着非常重要的作用，促进了智能农业的发展。
      </p>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">配置设施占比</span>
        <span class="progress-label">已覆盖 28/100</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 28%"></div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card animate-stat" style="animation-delay: 0.2s">
        <div class="stat-icon stat-icon-cyan">
          <svg class="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </div>
        <div class="stat-label">水流速监测</div>
        <div class="stat-value">
          2,674
          <span class="stat-unit">个</span>
        </div>
      </div>

      <div class="stat-card animate-stat" style="animation-delay: 0.3s">
        <div class="stat-icon stat-icon-blue">
          <svg class="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
          </svg>
        </div>
        <div class="stat-label">水量监测</div>
        <div class="stat-value">
          1,668
          <span class="stat-unit">个</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @keyframes statAnim {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .meteo-container {
    width: 100%;
  }

  .station-info {
    margin-bottom: 1rem;
  }

  .station-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .station-badge {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    background: rgba(34, 211, 238, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;

    .badge-text {
      font-size: 0.75rem;
      color: #22d3ee;
    }
  }

  .station-name {
    font-size: 0.875rem;
    color: #fff;
    font-weight: 500;
  }

  .station-desc {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.625;
  }

  .progress-section {
    margin-bottom: 1rem;
  }

  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;

    .progress-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .progress-bar {
    height: 6px;
    background: rgba(34, 211, 238, 0.2);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22d3ee, #06b6d4);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem;
    text-align: center;
    animation: statAnim 0.4s ease-out forwards;
    opacity: 0;
  }

  .stat-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.5rem;
    font-size: 1.25rem;
  }

  .stat-icon-cyan {
    background: rgba(34, 211, 238, 0.2);
    color: #22d3ee;
  }

  .stat-icon-blue {
    background: rgba(34, 211, 238, 0.2);
    color: #22d3ee;
  }

  .icon-svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
  }

  .stat-unit {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    margin-left: 0.25rem;
  }
</style>
