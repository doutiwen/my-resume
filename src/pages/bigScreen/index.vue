<template>
  <div class="dashboard-container">
    <header class="dashboard-header animate-header">
      <h1 class="header-title">气象水利监测中心大屏</h1>
      <div class="header-right">
        <div class="header-number">13215</div>
        <div class="header-label">总监测数</div>
      </div>
    </header>

    <div class="dashboard-content">
      <div class="panel-left">
        <div class="panel-card animate-panel" style="animation-delay: 0.1s">
          <div class="panel-header">
            <div class="panel-title-icon"></div>
            <h2 class="panel-title">水利保障</h2>
            <span class="panel-subtitle">Water conservancy guarantee</span>
          </div>
          <div class="chart-height">
            <WaterConservancyChart />
          </div>
        </div>

        <div class="panel-card animate-panel" style="animation-delay: 0.2s">
          <div class="panel-header">
            <div class="panel-title-icon"></div>
            <h2 class="panel-title">监测站点排行</h2>
            <span class="panel-subtitle">Monitoring site ranking</span>
          </div>
          <MonitoringRank />
        </div>

        <div class="panel-card animate-panel" style="animation-delay: 0.3s">
          <div class="panel-header">
            <div class="panel-title-icon"></div>
            <h2 class="panel-title">气象站所统计</h2>
            <span class="panel-subtitle">Statistics of meteorological stations</span>
          </div>
          <div class="stats-row">
            <div class="stat-box">
              <div class="stat-label">云量监测</div>
              <div class="stat-value stat-value-cyan">260个</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">风向监测</div>
              <div class="stat-value stat-value-amber">16个</div>
            </div>
          </div>
          <div class="chart-height">
            <StationStats />
          </div>
        </div>
      </div>

      <div class="panel-center">
        <ChinaMap3D />
      </div>

      <div class="panel-right">
        <div class="panel-card animate-panel" style="animation-delay: 0.1s">
          <div class="panel-header">
            <div class="panel-title-icon"></div>
            <h2 class="panel-title">气象监测统计</h2>
            <span class="panel-subtitle">Meteorological monitoring statistics</span>
          </div>
          <MeteoMonitoring />
        </div>

        <div class="panel-card animate-panel" style="animation-delay: 0.2s">
          <div class="panel-header">
            <div class="panel-title-icon"></div>
            <h2 class="panel-title">预计分析</h2>
            <span class="panel-subtitle">Forecast analysis</span>
          </div>
          <div class="chart-height">
            <ForecastAnalysis />
          </div>
        </div>

        <div class="panel-card animate-panel" style="animation-delay: 0.3s">
          <div class="panel-header">
            <div class="panel-title-icon"></div>
            <h2 class="panel-title">未来监测分析</h2>
            <span class="panel-subtitle">Future monitoring and analysis</span>
          </div>
          <div class="chart-height">
            <FutureMonitoring />
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <button @click="activeTab = 'meteo'" :class="['nav-item', { active: activeTab === 'meteo' }]">
        气象总览
      </button>
      <button @click="activeTab = 'water'" :class="['nav-item', { active: activeTab === 'water' }]">
        水利预计
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import WaterConservancyChart from './common/components/WaterConservancyChart.vue';
  import MonitoringRank from './common/components/MonitoringRank.vue';
  import StationStats from './common/components/StationStats.vue';
  import MeteoMonitoring from './common/components/MeteoMonitoring.vue';
  import ForecastAnalysis from './common/components/ForecastAnalysis.vue';
  import FutureMonitoring from './common/components/FutureMonitoring.vue';
  import ChinaMap3D from './common/components/ChinaMap3D';

  const activeTab = ref('meteo');
</script>

<style lang="scss" scoped>
  @keyframes headerAnim {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes panelAnim {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dashboard-container {
    width: 100vw;
    height: 100vh;
    min-width: 1920px;
    min-height: 1080px;
    background: linear-gradient(135deg, #0a1929 0%, #0f2a47 50%, #0a1929 100%);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    }

    .dashboard-header {
      z-index: 50;
      padding-top: 1.5rem;
      padding-bottom: 1rem;
      animation: headerAnim 0.6s ease-out;

      .header-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #fff;
        text-align: center;
        letter-spacing: 0.5rem;
        text-shadow:
          0 0 20px rgba(34, 211, 238, 0.5),
          0 0 40px rgba(34, 211, 238, 0.3),
          0 0 60px rgba(34, 211, 238, 0.2);
      }

      .header-right {
        position: absolute;
        top: 2rem;
        right: 2rem;
        text-align: right;

        .header-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #22d3ee;
          text-shadow:
            0 0 10px rgba(34, 211, 238, 0.5),
            0 0 20px rgba(34, 211, 238, 0.3);
        }

        .header-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .dashboard-content {
      flex: 1;
      height: 1px;
      position: relative;
      display: flex;

      .panel-left {
        width: 20%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .panel-card {
          background: linear-gradient(
            135deg,
            rgba(13, 42, 67, 0.8) 0%,
            rgba(20, 64, 101, 0.6) 50%,
            rgba(13, 42, 67, 0.8) 100%
          );
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 0.75rem;
          backdrop-filter: blur(20px);
          position: relative;
          flex: 1;
          padding: 0.875rem;
          min-height: 8rem;
          animation: panelAnim 0.5s ease-out forwards;
          opacity: 0;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 0 30px rgba(34, 211, 238, 0.15),
            inset 0 0 30px rgba(34, 211, 238, 0.05);

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.6), transparent);
          }

          &::after {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: 0.75rem;
            border: 1px solid transparent;
            background: linear-gradient(rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0.1)) border-box;
            mask:
              linear-gradient(#fff 0 0) padding-box,
              linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
          }

          .panel-header {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;

            .panel-title-icon {
              width: 4px;
              height: 14px;
              background: linear-gradient(180deg, #22d3ee, #06b6d4);
              border-radius: 2px;
              box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
            }

            .panel-title {
              color: #fff;
              font-size: 0.875rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              text-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
            }

            .panel-subtitle {
              color: rgba(255, 255, 255, 0.5);
              font-size: 0.625rem;
              margin-left: 0.5rem;
            }
          }

          .chart-height {
            flex: 1;
            min-height: 0;
          }

          .stats-row {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 0.5rem;

            .stat-box {
              flex: 1;
              padding: 0.5rem;
              background: rgba(34, 211, 238, 0.1);
              border: 1px solid rgba(34, 211, 238, 0.2);
              border-radius: 0.5rem;

              .stat-label {
                font-size: 0.625rem;
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 0.25rem;
              }

              .stat-value {
                font-size: 1rem;
                font-weight: 700;
                color: #22d3ee;
                text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);

                &.stat-value-cyan {
                  color: #22d3ee;
                }

                &.stat-value-amber {
                  color: #f59e0b;
                }
              }
            }
          }
        }
      }

      .panel-center {
        width: 1px;
        flex: 1;

        .center-content {
          text-align: center;

          .center-emoji {
            font-size: 2.25rem;
            margin-bottom: 1rem;
          }

          .center-text-primary {
            font-size: 1.125rem;
            color: rgba(255, 255, 255, 0.8);
          }

          .center-text-secondary {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 0.5rem;
          }
        }
      }

      .panel-right {
        width: 20%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        z-index: 40;
        padding-right: 1rem;

        .panel-card {
          background: linear-gradient(
            135deg,
            rgba(13, 42, 67, 0.8) 0%,
            rgba(20, 64, 101, 0.6) 50%,
            rgba(13, 42, 67, 0.8) 100%
          );
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 0.75rem;
          backdrop-filter: blur(20px);
          position: relative;
          flex: 1;
          padding: 0.875rem;
          min-height: 8rem;
          animation: panelAnim 0.5s ease-out forwards;
          opacity: 0;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 0 30px rgba(34, 211, 238, 0.15),
            inset 0 0 30px rgba(34, 211, 238, 0.05);

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.6), transparent);
          }

          &::after {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: 0.75rem;
            border: 1px solid transparent;
            background: linear-gradient(rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0.1)) border-box;
            mask:
              linear-gradient(#fff 0 0) padding-box,
              linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
          }

          .panel-header {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;

            .panel-title-icon {
              width: 4px;
              height: 14px;
              background: linear-gradient(180deg, #22d3ee, #06b6d4);
              border-radius: 2px;
              box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
            }

            .panel-title {
              color: #fff;
              font-size: 0.875rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              text-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
            }

            .panel-subtitle {
              color: rgba(255, 255, 255, 0.5);
              font-size: 0.625rem;
              margin-left: 0.5rem;
            }
          }

          .chart-height {
            flex: 1;
            min-height: 0;
          }
        }
      }
    }

    .bottom-nav {
      display: flex;
      justify-content: center;
      gap: 2.5rem;
      z-index: 100;
      padding-bottom: 1.25rem;

      .nav-item {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0.5rem 1rem;
        border-radius: 1.25rem;
        border: 1px solid rgba(34, 211, 238, 0.3);
        background: rgba(13, 42, 67, 0.6);

        &:hover,
        &.active {
          color: #fff;
          background: rgba(34, 211, 238, 0.3);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
        }
      }
    }
  }
</style>
