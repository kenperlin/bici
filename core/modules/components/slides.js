import { addDiagramProperties, TextDiagram } from "./diagram.js";

export class SlideDeck {
  constructor() {
    this.projectName = null;
    this.slides = [];
    this.modules = {};
    this.urlMap = {};
    this.currentSlide = 0;

    this.isOpaque = false;
    this.position = { x: WIDTH - 520, y: 20 };
  }

  async init(name, slidesList) {
    this.projectName = name;
    this.slides = [];
    this.modules = {};
    this.urlMap = {};
    this.currentSlide = 0;

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
        if (key && value) this.urls[key] = value;
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

        const diagram = new slideModule.Diagram();
        addDiagramProperties(diagram);
        this.slides.push({ type: "diagram", content: diagram });
      } else {
        let lines = file.split("\\n");
        const textDiagram = new TextDiagram(lines);
        this.slides.push({ type: "text", content: textDiagram });
      }
    }
  }

  async _loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  setSize(left, top, width, height) {
    this.rect = { left, top, width, height };
  }

  getSlide(idx = this.currentSlide) {
    return this.slides[idx];
  }

  draw(ctx, idx = this.currentSlide) {
    const slide = this.getSlide(idx);
    if (!slide) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.globalAlpha = this.isOpaque ? 1 : 0.5;

    if (slide.type === "diagram") {
      slide.content.ctx = ctx;
      slide.content._beforeUpdate();
      slide.content.update();
    } else if (slide.type === "image") {
      ctx.drawImage(slide.content, 0, 0, 500, 500);
    } else if (slide.type === "text") {
      slide.content.ctx = ctx;
      slide.content.update();
    }

    ctx.font = '20px Courier';
    ctx.fillText(idx + 1, 10, 30);
    ctx.restore();
  }
}
