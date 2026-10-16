import { render } from 'vue';

function tooltip(context, props) {
  let hasEventListener = false;
  const { className, node, zIndex, autoClose, closeCallBack, minusNumber } = props;
  const { MapView } = context;
  const tooltip = document.createElement('div');
  const { style } = tooltip;

  tooltip.setAttribute('role', 'arcgisTooltip');
  tooltip.classList.add('arcgisTooltip');
  if (typeof zIndex === 'string') {
    tooltip.style.zIndex = zIndex;
  }

  const container = document.createElement('div');
  container.classList.add('tooltip-container');
  tooltip.appendChild(container);

  const textElement = document.createElement('div');
  textElement.classList.add(className);
  container.appendChild(textElement);

  if (node) {
    render(node, textElement);
  }

  MapView.container.appendChild(tooltip);

  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let visible = false;
  let isCreate = false;

  function move() {
    x += (targetX - x) * 0.1;
    y += (targetY - y) * 0.1;

    if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
      x = targetX;
      y = targetY;
    } else {
      requestAnimationFrame(move);
    }
    const subtractNumber = minusNumber || minusNumber === 0 ? minusNumber : 28;
    style.transform = `translate3d(${Math.round(x)}px,${Math.round(y - subtractNumber)}px, 0)`;
  }

  function close(event) {
    if (!container.contains(event.target) && !isCreate) {
      style.opacity = String(0);
      visible = false;
      if (closeCallBack) closeCallBack();
      document.removeEventListener('click', close, false);
      hasEventListener = false;
    }
    isCreate = false;
  }

  return {
    show(point, text, status) {
      isCreate = status || false;
      if (autoClose && !hasEventListener) {
        document.addEventListener('click', close, false);
        hasEventListener = true;
      }
      if (!visible) {
        x = point.x;
        y = point.y;
      }
      targetX = point.x;
      targetY = point.y;
      style.opacity = String(1);
      visible = true;
      if (text) {
        if (typeof text === 'string') {
          textElement.innerHTML = text;
        } else {
          render(text, textElement);
        }
      }
      move();
    },
    hide() {
      style.opacity = String(0);
      visible = false;
      if (autoClose) {
        document.removeEventListener('click', close, false);
        hasEventListener = false;
      }
    },
    destroy() {
      MapView.container.removeChild(tooltip);
      if (autoClose) {
        document.removeEventListener('click', close, false);
        hasEventListener = false;
      }
    },
  };
}

export default tooltip;
