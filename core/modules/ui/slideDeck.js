import { addDiagramProperties, TextDiagram } from "./diagram.js";

export class SlideDeck {
  constructor() {
    this.projectName = null;
    this.slides = [];
    this.modules = {};
    this.urlMap = {};
    this.currentSlide = 0;

    this.isVisible = false;
    this.isOpaque = false;
    this.rect = { left: WIDTH - 520, top: 20, width: 500, height: 500 };
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

  getSlide(idx = this.currentSlide) {
    return this.slides[idx];
  }

  next() {
    this.currentSlide = Math.min(this.currentSlide + 1, this.slides.length - 1);
  }

  prev() {
    this.currentSlide = Math.max(this.currentSlide - 1, 0);
  }

  toggleVisible() {
    this.isVisible = !this.isVisible;
  }

  toggleOpaque() {
    this.isOpaque = !this.isOpaque;
  }

  draw(ctx, idx = this.currentSlide) {
    if(!this.isVisible) return;

    const slide = this.getSlide(idx);
    if (!slide) return;

    ctx.save();
    ctx.translate(this.rect.left, this.rect.top);
    ctx.globalAlpha = this.isOpaque ? 1 : 0.5;

    if (slide.type === "diagram" || slide.type === "text") {
      this.rect.width = slide.content.width;
      this.rect.height = slide.content.height;
      slide.content.ctx = ctx;
      slide.content._beforeUpdate();
      slide.content.update();
    } else if (slide.type === "image") {
      this.rect.width = 500;
      this.rect.height = 500;
      ctx.drawImage(slide.content, 0, 0, 500, 500);
    }

    ctx.font = '20px Courier';
    ctx.fillText(idx + 1, 10, 30);
    ctx.restore();
  }
}
