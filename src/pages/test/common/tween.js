import { Group } from '@tweenjs/tween.js';
// 全局唯一分组，存放项目所有tween实例
const globalTweenGroup = new Group();

// 全局渲染循环
function animateLoop(time) {
  requestAnimationFrame(animateLoop);
  // 关键：更新我们自己创建的Group，所有挂载进来的tween都会执行onUpdate
  globalTweenGroup.update(time);
}
// 启动循环
animateLoop(0);

export { globalTweenGroup };
