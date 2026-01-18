export class SceneCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.onMove = () => {};
    this.onDown = () => {};
    this.onUp = () => {};

    this.isDown = {};

    window.addEventListener('mousemove', (e) => {
      const id = "mouse";
      if(this.isDown[id]) this.onMove(e.clientX, e.clientY, 0, id)
    })
    window.addEventListener('mousedown', (e) => {
      const id = "mouse";
      if(e.target === this.canvas) this.onDown(e.clientX, e.clientY, 0, id)
    })
    window.addEventListener('mouseup', (e) => {
      const id = "mouse";
      if(this.isDown[id]) this.onUp(e.clientX, e.clientY, 0, id)
    })
  }

  getRect() {
    return this.canvas.getBoundingClientRect();
  }

  contains(x, y) {
    const {left, right, top, bottom} = this.getRect();
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  xToScene(x) {
    const { left, width } = this.getRect();
    return (2 * (x - left)) / width - 1;
  }
  yToScene(y) {
    const { top, height } = this.getRect();
    return 1 - (2 * (y - top)) / height;
  }
  zToScene(z) {
    const { width } = this.getRect();
    return (-2 * z) / width - 2.5;
  }
  coordsToScene(x, y, z) {
    const { left, top, width, height } = this.getRect();
    return {
      x: (2 * (x - left)) / width - 1,
      y: 1 - (2 * (y - top)) / height,
      z: (-2 * z) / width - 2.5
    };
  }
  registerSceneEvents(scene) {
    this.onMove = (x, y, z, id) => {
      ({ x, y, z } = this.coordsToScene(x, y, z));
      if (!this.isDown[id]) {
        scene.onMove?.(x, y, z, id);
      } else {
        scene.onDrag?.(x, y, z, id);
      }
    };

    this.onUp = (x, y, z, id) => {
      ({ x, y, z } = this.coordsToScene(x, y, z));
      this.isDown[id] = false;
      scene.onUp?.(x, y, z, id);
    };

    this.onDown = (x, y, z, id) => {
      ({ x, y, z } = this.coordsToScene(x, y, z));
      if (x * x > 1 || y * y > 1) return;

      this.isDown[id] = true;
      scene.onDown?.(x, y, z, id);
    };
  }
}
