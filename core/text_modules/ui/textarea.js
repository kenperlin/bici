import * as NumberString from "../math/numberString.js";

const offsetX = 20;
const offsetY = 20;
const charWidthFactor = 0.6;
const charHeightFactor = 1.14;
const charWidthOffset = 0.35;
const charHeightOffset = 0.15;

export class TextArea {
  constructor(textareaElement) {
    this.element = textareaElement;
    this.isVisible = true;

    this.ey = 0;
    this.dial = 0;
    this.isReloadScene = false;
    this.lastReloadTime = 0;
    this.onReloadScene = () => {};
    this.onValueChanged = () => {};

    this.initInteractions();

    this.mirror = document.getElementById("mirror");
    this.beforeNode = document.getElementById("before");
    this.highlightNode = document.getElementById("highlight");
    this.afterNode = document.getElementById("after");
    this.range = document.createRange();
  }

  _xToCol(x) {
    return (x - offsetX) / (charWidthFactor * this.fontSize) + charWidthOffset;
  }
  _yToRow(y) {
    return (y - offsetY) / (charHeightFactor * this.fontSize) + charHeightOffset;
  }

  toggleVisible() {
    this.setVisible(!this.isVisible);
  }
  setVisible(val) {
    this.isVisible = val;
    this.element.style.left = `${this.isVisible ? 20 : -2000}px`;
  }

  setFontSize(size) {
    this.fontSize = size;
    this.element.style.fontSize = this.fontSize + "px";
  }
  increaseFontSize() {
    this.setFontSize(this.fontSize * 1.1);
  }
  decreaseFontSize(size) {
    this.setFontSize(this.fontSize / 1.1);
  }

  getRect() {
    return this.element.getBoundingClientRect();
  }

  contains(x, y) {
    let col = this._xToCol(x);
    let row = this._yToRow(y);
    return col >= 0 && col < this.element.cols + 2 && row >= 0 && row < this.element.rows;
  }

  pointToIndex(x, y) {
    const text = this.element.value;

    const mirrorBox = mirror.getBoundingClientRect();

    const targetX = x + textarea.scrollLeft + mirrorBox.left;
    const targetY = y + textarea.scrollTop + mirrorBox.top;

    let left = 0;
    let right = text.length;

    while (left < right) {
      const mid = (left + right) >> 1;

      beforeNode.textContent = text.slice(0, mid);
      highlightNode.textContent = text[mid] || "";
      afterNode.textContent = text.slice(mid + 1);

      range.selectNodeContents(highlightNode);

      const rect = range.getBoundingClientRect();

      if (
        targetY < rect.top ||
        (targetY >= rect.top && targetY <= rect.bottom && targetX < rect.left)
      ) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return Math.max(0, left - 1);
  }

  drawOverlayRect(col, row, nCols, nRows, isFill) {
    let charWidth = charWidthFactor * this.fontSize;
    let charHeight = charHeightFactor * this.fontSize;

    let drawFn = isFill ? OCTX.fillRect : OCTX.strokeRect;
    drawFn(
      offsetX + charWidth * (col + charWidthOffset),
      offsetY + charHeight * (row + charHeightOffset),
      nCols * charWidth,
      nRows * charHeight
    );
  }

  update(time = Date.now() / 1000) {
    let lines = this.element.value.split("\n");
    if (this.isReloadScene && time - this.lastReloadTime > 0.1) {
      this.lastReloadTime = time;
      this.isReloadScene = false;
    }

    if (!this.isVisible) return;
  }

  initInteractions() {
    this.element.addEventListener("mousemove", (ev) => {
      if (!ev.shiftKey) return;
      this.slideValue(ev.clientY);
    });

    this.element.addEventListener("keyup", (event) => {
      if (event.key == "Shift") this.ey = 0;
    });
  }

  slideValue(y) {
    if (this.ey && Math.abs((this.dial += y - this.ey)) >= 3) {
      let i1 = this.element.selectionStart;
      let s0 = NumberString.findNumberString(this.element.value, i1);
      if (s0) {
        let i0 = i1 - s0.length;
        let s1 = NumberString.increment(s0, -Math.sign(this.dial));

        if (this.element.value.charAt(i0 - 1) == " " && s0.charAt(0) != "-" && s1.charAt(0) == "-")
          i0--;
        if (s0.charAt(0) == "-" && s1.charAt(0) != "-") s1 = " " + s1;

        this.element.value =
          this.element.value.substring(0, i0) + s1 + this.element.value.substring(i1);
        this.element.selectionStart = this.element.selectionEnd = i0 + s1.length;

        // Trigger input event to sync with Yjs
        this.isReloadScene = true;
        this.onValueChanged();
      }
      this.dial = 0;
    }
    this.ey = y;
  }

  highlightCharAt(x, y, color = "#00000060") {
    if (!this.contains(x, y)) return;

    OCTX.save();
    OCTX.fillStyle = color;
    this.drawOverlayRect(xToCol(x) >> 0, yToRow(y) >> 0, 1, 1, true);
    OCTX.restore();
  }

  updateRange(start, end) {
    const text = this.element.value;
    this.beforeNode.textContent = text.slice(0, start);
    this.highlightNode.textContent = text.slice(start, end);
    this.afterNode.textContent = text.slice(end);

    this.range.selectNodeContents(this.highlightNode);
  }

  computeRangeRects() {
    const rectList = this.range.getClientRects();
    const mirrorBox = this.mirror.getBoundingClientRect();

    const scrollLeft = this.element.scrollLeft;
    const scrollTop = this.element.scrollTop;

    const rects = new Array(rectList.length);
    for (let i = 0; i < rectList.length; i++) {
      const r = rectList[i];
      rects[i] = {
        x: r.left - mirrorBox.left - scrollLeft,
        y: r.top - mirrorBox.top - scrollTop,
        width: r.width,
        height: r.height
      };
    }
    return rects;
  }

  drawRects(rects) {
    const boundingRect = this.element.getBoundingClientRect();

    OCTX.save();
    OCTX.fillStyle = "rgba(255,255,0,0.5)";
    OCTX.translate(boundingRect.left, boundingRect.top);
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      OCTX.fillRect(r.x, r.y, r.width, r.height);
    }
    OCTX.restore();
  }

  highlightRange(start, end) {
    if (start === end) {
      return;
    }
    this.updateRange(start, end);
    const rects = this.computeRangeRects();
    this.drawRects(rects);
  }
}
