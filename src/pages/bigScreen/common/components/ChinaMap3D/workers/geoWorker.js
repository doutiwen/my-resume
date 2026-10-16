/**
 * geoWorker.js - 主Worker，管理子Worker处理地理数据
 *
 * 功能说明：
 * - 作为主Worker运行在独立线程
 * - 创建和管理多个子Worker（geoChildWorker.js）
 * - 协调子Worker之间的任务分配（支持全国所有省份）
 * - 流式返回处理结果（每个省份处理完成后立即返回）
 * - 所有省份处理完成后发送完成通知
 *
 * 架构设计：
 * - 主线程只与主Worker通信
 * - 主Worker内部管理子Worker池
 * - 子Worker专注于地理数据处理逻辑
 * - 流式处理：单个省份完成即返回，无需等待全部完成
 * - 任务队列机制：支持动态任务分发，子Worker完成一个任务后自动获取下一个任务
 *
 * 消息协议：
 * - 接收 'init': 初始化主Worker（包含地理数据集合、投影范围、墙厚度）
 * - 发送 'progress': 单个省份处理完成，返回处理结果（包含省份名称）
 * - 发送 'complete': 所有省份处理完成
 * - 发送 'error': 处理过程中发生错误
 *
 * 数据分发策略：
 * - 使用任务队列模式，子Worker完成当前任务后主动请求下一个任务
 * - 支持动态负载均衡，避免某个Worker负载过重
 * - 记录每个省份的处理状态，便于追踪和调试
 */

import { createProjection } from '../utils/projection.js';

const MAX_CHILD_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 6);

let featureCollection = null;
let extent = null;
let wallThickness = 0.01;
let translate = null;
let childWorkers = [];
let taskQueue = [];
let readyChildCount = 0;
let totalFeatures = 0;
let completedCount = 0;
let processingStates = {};

function initChildWorkers(center) {
  const features = featureCollection.features;
  totalFeatures = features.length;

  const numChildWorkers = Math.min(totalFeatures, MAX_CHILD_WORKERS);

  const chunkSize = Math.ceil(totalFeatures / numChildWorkers);
  const workerFeatures = [];

  for (let i = 0; i < numChildWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalFeatures);
    const workerFeatureIndices = [];
    for (let j = start; j < end; j++) {
      workerFeatureIndices.push(j);
    }
    workerFeatures.push(workerFeatureIndices);
  }

  for (let i = 0; i < numChildWorkers; i++) {
    const childWorker = new Worker(new URL('./geoChildWorker.js', import.meta.url), {
      type: 'module',
    });

    childWorker.onmessage = function (e) {
      const { type, data } = e.data;

      if (type === 'ready') {
        readyChildCount++;
        if (readyChildCount === childWorkers.length) {
          initializeTaskQueue();
          childWorkers.forEach((workerInfo) => distributeNextTask(workerInfo));
        }
      }

      if (type === 'result') {
        const { result, featureIndex } = data;
        completedCount++;

        if (result && result.polygons && result.polygons.length > 0) {
          const provinceName = result.name || `Province_${featureIndex}`;
          processingStates[featureIndex] = 'completed';
          self.postMessage({
            type: 'progress',
            data: {
              result,
              featureIndex,
              provinceName,
              completedCount,
              totalFeatures,
              processingStates: { ...processingStates },
            },
          });
        } else {
          processingStates[featureIndex] = 'skipped';
        }

        if (completedCount === totalFeatures) {
          finishWork();
        } else {
          const workerInfo = childWorkers.find((w) => w.worker === this);
          if (workerInfo) distributeNextTask(workerInfo);
        }
      }

      if (type === 'error') {
        const { featureIndex, error } = data;
        completedCount++;
        processingStates[featureIndex] = 'error';
        console.error(`Error processing feature ${featureIndex}:`, error);

        self.postMessage({
          type: 'progress',
          data: {
            result: null,
            featureIndex,
            provinceName: `Province_${featureIndex}`,
            completedCount,
            totalFeatures,
            error,
            processingStates: { ...processingStates },
          },
        });

        if (completedCount === totalFeatures) {
          finishWork();
        } else {
          const workerInfo = childWorkers.find((w) => w.worker === this);
          if (workerInfo) distributeNextTask(workerInfo);
        }
      }
    };

    childWorker.onerror = function (error) {
      console.error('Child worker error:', error);
    };

    childWorkers.push({ worker: childWorker, features: workerFeatures[i] });
  }

  for (const { worker, features } of childWorkers) {
    const assignedFeatures = features.map((index) => featureCollection.features[index]);
    worker.postMessage({
      type: 'init',
      data: {
        wallThickness,
        extent,
        features: assignedFeatures,
        featureIndices: features,
        translate,
        center,
      },
    });
  }
}

function initializeTaskQueue() {
  const features = featureCollection.features;
  features.forEach((_, index) => {
    processingStates[index] = 'pending';
  });
}

function distributeNextTask(workerInfo) {
  const { worker, features } = workerInfo;
  if (features.length === 0) return;

  const featureIndex = features.shift();
  const feature = featureCollection.features[featureIndex];
  processingStates[featureIndex] = 'processing';

  worker.postMessage({
    type: 'process',
    data: { feature, featureIndex },
  });
}

function finishWork() {
  for (const { worker } of childWorkers) {
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
    const center = data.center !== undefined ? data.center : [102, 25];

    const projectionResult = createProjection(featureCollection, extent);
    console.log('featureCollection', featureCollection);
    translate = projectionResult.translate;

    initChildWorkers(center);
  }
};
