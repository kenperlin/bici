import { fetchText } from "../utils/utils.js";
import { gl_start } from "../webgl/webgl.js";
import { webrtcClient } from "../yjs/yjs.js";
import { InteractiveCanvas } from "./canvas.js";

export class SceneManager {
  constructor(canvas) {
    this.canvas = new InteractiveCanvas(canvas, 'webgl2');
    this.scene = null;
    this.sceneCounter = 0;
    this.sceneNum = null;

    this.projectName = null;
    this.context = {};
  }

  async load(num, context) {
    const path = `/projects/${this.projectName}/scenes/scene${num}.js`;
    let sceneModule;

    try {
      sceneModule = await import(path + "?t=" + Date.now()); // cache busting
      if (!sceneModule.Scene) throw new Error(`Scene ${num} does not export a Scene class.`);
      context.codeArea.element.value = await fetchText(path);
      this.sceneNum = num;
    } catch (e) {
      console.error(`Failed to load scene ${num} of project ${this.projectName}:`, e);
    }

    this.context = {
      seed: this.getSeed(),
      canvas: this.canvas,
      vars: {},
      ...context
    };

    this.scene = new sceneModule.Scene(this.context);
    this.canvas.registerEvents(this.scene);
    gl_start(this.canvas.element, this.scene);
  }

  async hotReload(code) {
    if(!code) return;
    
    try {
      const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
      const module = await import(url);

      this.scene = new module.Scene(this.context);
      this.canvas.registerEvents(this.scene);
      gl_start(this.canvas.element, this.scene);
    } catch (e) {
      console.error("Hot reload failed: ", e);
      return;
    }
  }

  getSeed() {
    return (
      webrtcClient.roomId.charCodeAt(0) +
      webrtcClient.roomId.charCodeAt(1) / 128 +
      123.456 * ++this.sceneCounter
    );
  }

  update() {
    if (!this.canvas.isVisible) return;
    this.scene?.update();
  }
}
