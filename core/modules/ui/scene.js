import { fetchText } from "../utils.js";
import { gl_start } from "../webgl/webgl.js";
import { webrtcClient } from "../yjs/yjs.js";

export class SceneManager {
  constructor(canvas, codeArea) {
    this.canvas = new SceneCanvas(canvas);
    this.code = codeArea;
    this.scene = null;
    this.sceneCounter = 0;
    this.isVisible = false;

    this.projectName = null;
    this.context = {};

    this.code.onReloadScene = this.hotReload.bind(this);
  }

  setProject(projectName, context) {
    this.projectName = projectName;
    this.context = context;
  }
  
  async load(num) {
    const path = `/projects/${this.projectName}/scenes/scene${num}.js`;
    let sceneModule;
  
    try {
      sceneModule = await import(path + "?t=" + Date.now()); // cache busting
      if (!sceneModule.Scene) {
        throw new Error(`Scene ${num} does not export a Scene class.`);
      }
    } catch (e) {
      console.error(`Failed to load scene ${num} of project ${this.projectName}:`, e);
    }

    this.context = {
      module: sceneModule,
      seed: this.getSeed(),
      code: await fetchText(path),
      codeArea: this.code,
      canvas: this.canvas,
      vars: {},
      ...this.context
    }
    this.scene = new sceneModule.Scene(this.context);
    this.code.element.value = this.context.code;
    this.canvas.registerSceneEvents(this.scene);
    gl_start(this.canvas.element, this.scene);
  }

  async hotReload(code) {
    try {
      const url = URL.createObjectURL(
        new Blob([code], { type: "text/javascript" })
      );
      const module = await import(url);
      
      this.scene = new module.Scene(this.context);
      this.canvas.registerSceneEvents(this.scene);
      gl_start(this.canvas.element, this.scene);

    } catch (e) {
      console.error("Hot reload failed: ", e)
      return
    }
  }

  getSeed() {
    return webrtcClient.roomId.charCodeAt(0)
                      + webrtcClient.roomId.charCodeAt(1) / 128
                      + 123.456 * (++this.sceneCounter);
  }

  toggleVisible() {
    this.isVisible = !this.isVisible;
    this.canvas.element.style.display = this.isVisible ? "block" : "none";
  }

  update() {
    if(!this.isVisible) return;
    this.scene?.update();
  }
}

class SceneCanvas {
  constructor(canvasElement) {
    this.element = canvasElement;
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
      if(e.target === this.element) this.onDown(e.clientX, e.clientY, 0, id)
    })
    window.addEventListener('mouseup', (e) => {
      const id = "mouse";
      if(this.isDown[id]) this.onUp(e.clientX, e.clientY, 0, id)
    })
  }

  getRect() {
    return this.element.getBoundingClientRect();
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
