/**
 * geoWorker.js - 主Worker，管理子Worker处理地理数据
 *
 * 功能说明：
 * - 作为主Worker运行在独立线程
 * - 创建和管理多个子Worker（geoChildWorker.js）
 * - 协调子Worker之间的任务分配
 * - 流式返回处理结果（每个省份处理完成后立即返回）
 * - 所有省份处理完成后发送完成通知
 *
 * 架构设计：
 * - 主线程只与主Worker通信
 * - 主Worker内部管理子Worker池
 * - 子Worker专注于地理数据处理逻辑
 * - 流式处理：单个省份完成即返回，无需等待全部完成
 *
 * 消息协议：
 * - 接收 'init': 初始化主Worker（包含地理数据集合、投影范围、墙厚度）
 * - 发送 'progress': 单个省份处理完成，返回处理结果
 * - 发送 'complete': 所有省份处理完成
 */

const MAX_CHILD_WORKERS = 3;

let featureCollection = null;
let extent = null;
let wallThickness = 0.01;
let childWorkers = [];
let pendingFeatures = [];
let readyChildCount = 0;
let totalFeatures = 0;
let completedCount = 0;

function initChildWorkers() {
  const features = featureCollection.features;
  totalFeatures = features.length;

  const featuresPerWorker = Math.ceil(totalFeatures / MAX_CHILD_WORKERS);

  for (let i = 0; i < MAX_CHILD_WORKERS; i++) {
    const childWorker = new Worker(new URL('./geoChildWorker.js', import.meta.url), {
      type: 'module',
    });

    childWorker.onmessage = function (e) {
      const { type, data } = e.data;

      if (type === 'ready') {
        readyChildCount++;

        if (readyChildCount === MAX_CHILD_WORKERS) {
          distributeWork();
        }
      }

      if (type === 'result') {
        const { result, featureIndex } = data;
        completedCount++;

        // 流式返回：单个省份处理完成后立即发送给主线程
        if (result && result.polygons && result.polygons.length > 0) {
          self.postMessage({
            type: 'progress',
            data: { result, featureIndex, completedCount, totalFeatures },
          });
        }

        // 所有省份处理完成，发送完成通知
        if (completedCount === totalFeatures) {
          finishWork();
        }
      }
    };

    const startIdx = i * featuresPerWorker;
    const endIdx = Math.min(startIdx + featuresPerWorker, totalFeatures);
    pendingFeatures.push({ worker: childWorker, startIdx, endIdx });

    childWorkers.push(childWorker);
  }

  for (const childWorker of childWorkers) {
    childWorker.postMessage({
      type: 'init',
      data: { featureCollection, extent, wallThickness },
    });
  }
}

function distributeWork() {
  for (const { worker, startIdx, endIdx } of pendingFeatures) {
    const features = featureCollection.features;
    for (let i = startIdx; i < endIdx; i++) {
      worker.postMessage({
        type: 'process',
        data: { feature: features[i], featureIndex: i },
      });
    }
  }
}

function finishWork() {
  for (const worker of childWorkers) {
    worker.terminate();
  }
  childWorkers = [];

  self.postMessage({
    type: 'complete',
    data: { totalProcessed: completedCount },
  });
}

self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === 'init') {
    featureCollection = data.featureCollection;
    extent = data.extent;
    wallThickness = data.wallThickness !== undefined ? data.wallThickness : 0.01;

    initChildWorkers();
  }
};
