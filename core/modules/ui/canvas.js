export class InteractiveCanvas {
  constructor(canvasElement, contextId) {
    this.element = canvasElement;
    this.ctx = canvasElement.getContext(contextId)
    this.onMove = () => {};
    this.onDown = () => {};
    this.onUp = () => {};
    this.isVisible = false;
    this.isOpaque = true;

    this.isDown = {};
  }

  getRect() {
    return this.element.getBoundingClientRect();
  }

  contains(x, y) {
    const { left, right, top, bottom } = this.getRect();
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  toggleVisible() {
    this.isVisible = !this.isVisible;
    this.element.style.display = this.isVisible ? "block" : "none";
  }

  toggleOpaque() {
    this.isOpaque = !this.isOpaque;
    this.element.style.opacity = this.isOpaque ? 1 : 0.5;
  }

  toCanvas(x, y, z) {
    const { left, top, width, height } = this.getRect();
    return {
      x: (2 * (x - left)) / width - 1,
      y: 1 - (2 * (y - top)) / height,
      z: (-2 * z) / width - 2.5
    };
  }

  registerEvents(target) {
    this.onMove = (x, y, z, id) => {
      ({ x, y, z } = this.toCanvas(x, y, z));
      if (!this.isDown[id]) {
        target.onMove?.(x, y, z, id);
      } else {
        target.onDrag?.(x, y, z, id);
      }
    };

    this.onUp = (x, y, z, id) => {
      ({ x, y, z } = this.toCanvas(x, y, z));
      this.isDown[id] = false;
      target.onUp?.(x, y, z, id);
    };

    this.onDown = (x, y, z, id) => {
      ({ x, y, z } = this.toCanvas(x, y, z));
      if (x * x > 1 || y * y > 1) return;
      this.isDown[id] = true;
      target.onDown?.(x, y, z, id);
    };
  }
}
