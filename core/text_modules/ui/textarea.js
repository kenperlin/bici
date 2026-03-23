import * as NumberString from "../math/numberString.js";

export class TextArea {
  constructor(textareaElement) {
    this.element = textareaElement;
    this.fontSize = 18;
    this.element.style.fontSize = this.fontSize + "px";
    this.isVisible = true;

    this.ey = 0;
    this.dial = 0;
    this.onValueChanged = () => {};

    this.initInteractions();

    this.mirror = document.getElementById("mirror");
    this.beforeNode = document.getElementById("before");
    this.highlightNode = document.getElementById("highlight");
    this.afterNode = document.getElementById("after");
    this.range = document.createRange();
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
    this.mirror.style.fontSize = this.fontSize + "px";
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
    const { left, right, top, bottom } = this.getRect();
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  pointToIndex(x, y) {
    const text = this.element.value;
    let left = 0;
    let right = text.length;

    while (left < right) {
      const mid = (left + right) >> 1;
      this.updateRange(mid, mid + 1);
      const rect = this.range.getBoundingClientRect();

      if (y < rect.top || (y >= rect.top && y <= rect.bottom && x < rect.left)) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return Math.max(0, left - 1);
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
        this.onValueChanged();
      }
      this.dial = 0;
    }
    this.ey = y;
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

    const gapX = this.element.scrollLeft + mirrorBox.left;
    const gapY = this.element.scrollTop + mirrorBox.top;

    const rects = new Array(rectList.length);
    for (let i = 0; i < rectList.length; i++) {
      const r = rectList[i];
      rects[i] = {
        x: r.left - gapX,
        y: r.top - gapY,
        width: r.width,
        height: r.height
      };
    }
    return rects;
  }

  drawRects(rects, color) {
    const boundingRect = this.element.getBoundingClientRect();

    OCTX.save();
    OCTX.fillStyle = color ?? "rgba(255,255,0,0.5)";
    OCTX.translate(boundingRect.left, boundingRect.top);
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      OCTX.fillRect(r.x, r.y, r.width, r.height);
    }
    OCTX.restore();
  }

  highlightRange(start, end, color) {
    if (start === end) {
      return;
    }
    this.updateRange(start, end);
    const rects = this.computeRangeRects();
    this.drawRects(rects, color);
  }

  highlightCharAt(x, y, color) {
    if(!this.contains(x, y)) return;

    const idx = this.pointToIndex(x, y);
    this.updateRange(idx, idx + 1);
    const rects = this.computeRangeRects();
    this.drawRects(rects, color);
  }
}
