import { pca } from "../math/pca.js";

export class PCAFilter {
  constructor() {
    this.history = []
  }

  // USE PRINCIPAL COMPONENT ANALYSIS TO DETECT AND THEN STEADY FIXATIONS
  steadyFixations(eLo, eHi) {
    let p = pca(this.history);
    let t = (p.eigenvalues[0] - eLo) / (eHi - eLo);
    t = Math.max(0, Math.min(1, t));
    return [ p.mean[0] * (1-t) + this.history[this.history.length-1][0] * t,
             p.mean[1] * (1-t) + this.history[this.history.length-1][1] * t ];
  }

  filter(x, y) {
    this.history.push([x, y]);
    if (this.history.length > 16) {
        this.history.shift();
        return this.steadyFixations(100, 2000);
    }
    return [x, y]
  }
}

export class LowPassFilter {
  constructor(factor) {
    this.factor = factor;
    this.lastX = null;
    this.lastY = null;
  }
  
  filter(x, y) {
    if(this.lastX && this.lastY) {
      x = this.lastX * this.factor + x * (1 - this.factor);
      y = this.lastY * this.factor + y * (1 - this.factor);
    }
    this.lastX = x;
    this.lastY = y;
    return [x, y]
  }
}
