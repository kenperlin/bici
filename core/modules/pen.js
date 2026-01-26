export function Pen() {
  this.strokes = [];
  this.width = 7;
  this.isDown = false;

  let color = "#000000";
  let highlightSketches = false;

  this.position = { x: 0, y: 0 };

  this.setColor = (c) => (color = c);
  this.onStrokesChanged = () => {};

  this.down = () => {
    if (this.isDown) return;
    let stroke = [];
    stroke.color = color;
    stroke.lineWidth = this.width;
    stroke.xlo = stroke.ylo = 10000;
    stroke.xhi = stroke.yhi = -10000;

    this.strokes.push(stroke);
    this.isDown = true;
    this.onStrokesChanged();
  };

  this.move = (x, y) => {
    this.position.x = x;
    this.position.y = y;
    if (!this.isDown) return;

    let stroke = this.strokes[this.strokes.length - 1];
    stroke.push([x, y]);

    let r = stroke.lineWidth / 2;
    stroke.xlo = Math.min(stroke.xlo, x - r);
    stroke.ylo = Math.min(stroke.ylo, y - r);
    stroke.xhi = Math.max(stroke.xhi, x + r);
    stroke.yhi = Math.max(stroke.yhi, y + r);
    this.onStrokesChanged?.();
  };

  this.up = () => {
    if (!this.isDown) return;
    this.isDown = false;
    this.onStrokesChanged?.();
  };

  this.delete = () => this.strokes.pop();
  this.clear = () => (this.strokes = []);

  this.draw = (ctx, lineWidth) => {
    ctx.save();
    ctx.lineCap = "round";
    if (highlightSketches && ss.xlo) {
      ctx.fillStyle = "#0080ff40";
      ctx.fillRect(
        this.strokes.xlo,
        this.strokes.ylo,
        this.strokes.xhi - this.strokes.xlo,
        this.strokes.yhi - this.strokes.ylo
      );
    }
    for (const s of this.strokes) {
      ctx.lineWidth = lineWidth ?? s.lineWidth;
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      for (let i = 0; i < s.length; i++) {
         let [x, y] = s[i];
         ctx[i ? "lineTo" : "moveTo"](x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  window.addEventListener('mousedown', () => this.down())
  window.addEventListener('mousemove', (e) => this.move(e.x, e.y))
  window.addEventListener('mouseup', () => this.up())
}
