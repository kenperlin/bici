export function Pen() {
  this.strokes = [];
  this.allStrokes = [];
  this.width = 7;

  let color = "#000000";
  let highlightSketches = false;

  this.position = { x: 0, y: 0 };

  this.setColor = (c) => (color = c);
  this.onStrokesChanged = () => {};

  this.isDown = {};

  this.onDown = (x, y, z, id) => {
    if (this.isDown[id]) return;

    let stroke = {};
    stroke.points = [];
    stroke.color = color;
    stroke.lineWidth = this.width;
    stroke.xlo = stroke.ylo = 10000;
    stroke.xhi = stroke.yhi = -10000;
    
    this.strokes.push(stroke);
    this.isDown[id] = this.strokes.length - 1;
    this.onStrokesChanged();
  };

  this.onMove = (x, y, z, id) => {
    this.position.x = x;
    this.position.y = y;

    const strokeIdx = this.isDown[id]
    if (strokeIdx == null) return;
    
    let stroke = this.strokes[strokeIdx];
    stroke.points.push([x, y]);

    let r = stroke.lineWidth / 2;
    stroke.xlo = Math.min(stroke.xlo, x - r);
    stroke.ylo = Math.min(stroke.ylo, y - r);
    stroke.xhi = Math.max(stroke.xhi, x + r);
    stroke.yhi = Math.max(stroke.yhi, y + r);
    this.onStrokesChanged?.();
  };

  this.onUp = (x, y, z, id) => {
    this.isDown[id] = null;
    this.onStrokesChanged?.();
  };

  this.delete = () => {
    this.strokes.pop();
    this.onStrokesChanged();
  }
  this.clear = () => {
    this.strokes.length = 0;
    this.onStrokesCleared();
  };

  this.draw = (ctx, lineWidth) => {
    ctx.save();
    ctx.lineCap = "round";
    if (highlightSketches && ss.xlo) {
      ctx.fillStyle = "#0080ff40";
      ctx.fillRect(
        this.allStrokes.xlo,
        this.allStrokes.ylo,
        this.allStrokes.xhi - this.allStrokes.xlo,
        this.allStrokes.yhi - this.allStrokes.ylo
      );
    }
    for (const s of this.allStrokes) {
      ctx.lineWidth = lineWidth ?? s.lineWidth;
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      for (let i = 0; i < s.points.length; i++) {
         let [x, y] = s.points[i];
         ctx[i ? "lineTo" : "moveTo"](x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
}
