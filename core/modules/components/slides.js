import { addDiagramProperties } from "./diagram.js";
import { centeredText } from "../utils.js";

export class SlideDeck {
  constructor(projectName, slidesList) {
    this.projectName = projectName;
    this.slideNames = [];
    this.slides = [];
    this.modules = {};
    this.urlMap = {};
    this.currentSlide = 0;

    this.init(slidesList);
  }

  async init(slidesList) {
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
          if (module) Object.assign(window, module);

          // TODO: remove js from window scope.
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
        const textDiagram = new (function () {
          this.width = 500;
          this.height = 400;
          this._beforeUpdate = () => {};
          let lines = file.split("\\n");
          this.update = () => {
            this.ctx.save();
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.font = "40px Helvetica";
            this.ctx.fillStyle = "black";
            for (let n = 0; n < lines.length; n++) {
              let line = lines[n], i, j;
              if ((i = line.indexOf("<font")) >= 0 && (j = line.indexOf(">", i)) >= 0) {
                this.ctx.font = line.substring(i + 6, j);
                line = line.substring(j + 1);
              }
              centeredText(this.ctx, line, 250, 210 + 60 * (n - (lines.length - 1) / 2));
            }
            this.ctx.restore();
          };
        })();

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

  getSlide(idx) {
    return this.slides[idx ?? this.currentSlide]
  }

  draw(ctx, index) {
    const slide = this.getSlide(index);
    if (!slide) return;

    if (slide.type === 'diagram') {
        slide.content.ctx = ctx;
        slide.content._beforeUpdate();
        slide.content.update();
    } else if (slide.type === 'image') {
        ctx.drawImage(slide.content, this.left ?? 0, this.top ?? 0, this.width ?? 500, this.height ?? 500);
    } else if (slide.type === 'text') {
        slide.content.ctx = ctx;
        slide.content.update();
    }
  }
}
