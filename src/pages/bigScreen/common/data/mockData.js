const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

const provinces = [
  '北京',
  '天津',
  '河北',
  '山西',
  '内蒙古',
  '辽宁',
  '吉林',
  '黑龙江',
  '上海',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '广西',
  '海南',
  '重庆',
  '四川',
  '贵州',
  '云南',
  '西藏',
  '陕西',
  '甘肃',
  '青海',
  '宁夏',
  '新疆',
];

const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];
const types = ['类型一', '类型二', '类型三', '类型四', '类型五'];
const regions = ['区域一', '区域二', '区域三', '区域四'];
const monitorTypes = ['监测一', '监测二', '监测三', '监测四', '监测五'];
const stationTypes = ['市', '省', '区', '县'];
const stationNames = ['气象部监测站', '环境监测站', '水利监测站', '农业监测站'];

const getProvince = (province) => {
  return province || provinces[randomInt(0, provinces.length - 1)];
};

export const mockData = {
  waterConservancy: (province) => {
    const p = getProvince(province);
    return types.map((name, index) => ({
      name: `${p}${name}`,
      value: randomInt(300, 1000),
    }));
  },

  monitoringRank: (province) => {
    const p = getProvince(province);
    const areas = ['华北大区', '华东大区', '华南大区', '西南大区', '西北大区', '东北大区'];
    const subAreas = ['A分区', 'B分区', 'C区', 'D区', ''];

    return [1, 2, 3].map((rank) => {
      const area = areas[randomInt(0, areas.length - 1)];
      const subArea = subAreas[randomInt(0, subAreas.length - 1)];
      return {
        rank,
        name: `${p}${area}${subArea}`,
        config: randomInt(100000, 800000).toLocaleString(),
        total: randomInt(5000, 300000).toLocaleString(),
      };
    });
  },

  stationStats: (province) => {
    const p = getProvince(province);
    const values = [];
    let remaining = 100;

    for (let i = 0; i < regions.length - 1; i++) {
      const value = randomInt(10, remaining - (regions.length - i - 1) * 10);
      values.push(value);
      remaining -= value;
    }
    values.push(remaining);

    return regions.map((name, index) => ({
      name: `${p}${name}`,
      value: values[index],
      color: colors[index],
    }));
  },

  meteoMonitoring: (province) => {
    const p = getProvince(province);
    const stationType = stationTypes[randomInt(0, stationTypes.length - 1)];
    const progress = randomInt(10, 90);

    return {
      stationName: `${p}${stationType}${stationNames[randomInt(0, stationNames.length - 1)]}`,
      stationType,
      province: p,
      stationDesc: `${p}气象环境监测站在农业环境监测中发挥着非常重要的作用，促进了智能农业的发展。`,
      progress,
      totalFacilities: 100,
      flowRateCount: randomInt(1000, 5000),
      waterVolumeCount: randomInt(500, 3000),
    };
  },

  forecastAnalysis: (province) => {
    const p = getProvince(province);
    return monitorTypes.map((name, index) => ({
      name: `${p}${name}`,
      value: randomInt(500, 2000),
      color: colors[index],
    }));
  },

  futureMonitoring: (province) => {
    const p = getProvince(province);
    const timeData = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    const valueData1 = timeData.map(() => randomFloat(20, 80));
    const valueData2 = timeData.map(() => randomFloat(30, 70));

    return {
      province: p,
      timeData,
      valueData1,
      valueData2,
    };
  },
};
