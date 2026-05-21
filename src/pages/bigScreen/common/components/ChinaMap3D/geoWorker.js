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

import { createProjection } from './projection.js';

const MAX_CHILD_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 6);

let featureCollection = null;
let extent = null;
let wallThickness = 0.01;
let scale = null;
let translate = null;
let childWorkers = [];
let taskQueue = [];
let readyChildCount = 0;
let totalFeatures = 0;
let completedCount = 0;
let processingStates = {};

function initChildWorkers() {
  const features = featureCollection.features;
  totalFeatures = features.length;

  for (let i = 0; i < MAX_CHILD_WORKERS; i++) {
    const childWorker = new Worker(new URL('./geoChildWorker.js', import.meta.url), {
      type: 'module',
    });

    childWorker.onmessage = function (e) {
      const { type, data } = e.data;

      if (type === 'ready') {
        readyChildCount++;
        if (readyChildCount === childWorkers.length) {
          initializeTaskQueue();
          childWorkers.forEach((worker) => distributeNextTask(worker));
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
          distributeNextTask(this);
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
          distributeNextTask(this);
        }
      }
    };

    childWorker.onerror = function (error) {
      console.error('Child worker error:', error);
    };

    childWorkers.push(childWorker);
  }

  for (const childWorker of childWorkers) {
    childWorker.postMessage({
      type: 'init',
      data: {
        wallThickness,
        extent,
        featureCollection,
        scale,
        translate,
      },
    });
  }
}

function initializeTaskQueue() {
  const features = featureCollection.features;
  taskQueue = features.map((_, index) => index);
  features.forEach((feature, index) => {
    processingStates[index] = 'pending';
  });
}

function distributeNextTask(worker) {
  if (taskQueue.length === 0) return;

  const featureIndex = taskQueue.shift();
  const feature = featureCollection.features[featureIndex];
  processingStates[featureIndex] = 'processing';

  worker.postMessage({
    type: 'process',
    data: { feature, featureIndex },
  });
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

    const projectionResult = createProjection(featureCollection, extent);
    scale = projectionResult.scale;
    translate = projectionResult.translate;

    initChildWorkers();
  }
};
