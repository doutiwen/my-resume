import { Group } from '@tweenjs/tween.js';

const globalTweenGroup = new Group();
function animateLoop() {
  requestAnimationFrame(animateLoop);
  globalTweenGroup.update();
}
animateLoop();

export { globalTweenGroup };
