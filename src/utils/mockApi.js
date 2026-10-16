import { mockData } from '../pages/bigScreen/common/data/mockData';

export const mockApi = {
  fetchWaterConservancyData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.waterConservancy());
      }, 300);
    });
  },

  fetchMonitoringRankData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.monitoringRank());
      }, 400);
    });
  },

  fetchStationStatsData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.stationStats());
      }, 350);
    });
  },

  fetchMeteoMonitoringData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.meteoMonitoring());
      }, 250);
    });
  },

  fetchForecastAnalysisData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.forecastAnalysis());
      }, 450);
    });
  },

  fetchFutureMonitoringData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.futureMonitoring());
      }, 300);
    });
  },
};
