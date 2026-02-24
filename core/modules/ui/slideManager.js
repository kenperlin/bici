import { InteractiveCanvas } from "./canvas.js";
import { addDiagramProperties, TextDiagram } from "./diagram.js";

export class SlideManager {
  constructor(canvas) {
    this.canvas = new InteractiveCanvas(canvas, "2d");
    this.slides = [];
    this.modules = {};
    this.urlMap = {};
    this.currentSlide = 0;

    this.projectName = null;
    this.context = {};
  }

  async init(name, slidesList, context) {
    this.projectName = name;
    this.slides = [];
    this.modules = {};
    this.urlMap = {};
    this.currentSlide = 0;
    this.context = context;
    this.canvas.toggleOpaque();

    for (let line of slidesList) {
      line = line.split("//")[0].trim();
      if (!line) continue;

      let name = line;
      let file = line;

      let i = file.indexOf("::");
      if (i >= 0) {
        name = file.substring(0, i).trim();
        file = file.substring(i + 2).trim();
      }

      if (file.startsWith("URL ")) {
        const [_, key, value] = line.split(" ");
        if (key && value) this.urlMap[key] = value;
        continue;
      }
      if (file.startsWith("SRC ")) {
        const [_, srcName] = line.split(" ");
        if (srcName) {
          const filePath = `/projects/${this.projectName}/${srcName}`;
          const module = await import(filePath + "?t=" + Date.now());
          // TODO: remove js from window scope.
          if (module) Object.assign(window, module);
        }
        continue;
      }

      if (file.endsWith(".png") || file.endsWith(".jpg")) {
        const img = await this._loadImage(file);
        this.slides.push({ type: "image", content: img });
      } else if (file.endsWith(".js")) {
        const filePath = `/projects/${this.projectName}/diagrams/${file}`;
        let slideModule = await import(filePath + "?t=" + Date.now());
        if (!slideModule.Diagram) continue;

        const diagram = new slideModule.Diagram(this.context);
        diagram.ctx = this.canvas.ctx;
        addDiagramProperties(diagram);
        this.slides.push({ type: "diagram", content: diagram });
      } else {
        let lines = file.split("\\n");
        const textDiagram = new TextDiagram(lines);
        textDiagram.ctx = this.canvas.ctx;
        this.slides.push({ type: "text", content: textDiagram });
      }
    }

    this.registerSlide();
  }

  async _loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  getSlide(idx = this.currentSlide) {
    return this.slides[idx];
  }

  registerSlide() {
    const currentSlide = this.getSlide();
    if(!currentSlide) return;

    if (currentSlide.type === "diagram" || currentSlide.type === "text") {
      this.canvas.element.width = currentSlide.content.width;
      this.canvas.element.height = currentSlide.content.height;
      this.canvas.registerEvents(currentSlide.content);
    } else if (currentSlide.type === "image") {
      this.canvas.element.width = 500;
      this.canvas.element.height = 500;
    }
  }

  setSlide(num) {
    this.currentSlide = num;
    this.registerSlide();
  }

  next() {
    this.currentSlide = Math.min(this.currentSlide + 1, this.slides.length - 1);
    this.registerSlide();
  }

  prev() {
    this.currentSlide = Math.max(this.currentSlide - 1, 0);
    this.registerSlide();
  }

  draw(idx = this.currentSlide) {
    if (!this.canvas.isVisible) return;

    const ctx = this.canvas.ctx;
    const slide = this.getSlide(idx);
    if (!slide) return;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (slide.type === "diagram" || slide.type === "text") {
      slide.content._beforeUpdate();
      slide.content.update();
    } else if (slide.type === "image") {
      ctx.drawImage(slide.content, 0, 0, 500, 500);
    }

    ctx.font = "20px Courier";
    ctx.fillText(idx + 1, 10, 30);
    ctx.restore();
  }
}
