import * as NumberString from "../math/numberString.js";
import { webrtcClient } from "../yjs/yjs.js";

const offsetX = 20;
const offsetY = 20;
const charWidthFactor = 0.6;
const charHeightFactor = 1.14;
const charWidthOffset = 0.35;
const charHeightOffset = 0.15;

export class CodeArea {
  constructor(textareaElement) {
    this.element = textareaElement;
    this.fontSize = 18;
    this.element.style.fontSize = this.fontSize + "px";
    this.element.style.left = "-2000px"
    this.isVisible = false;

    this.ey = 0;
    this.dial = 0;
    this.isReloadScene = false;
    this.lastReloadTime = 0;
    this.onReloadScene = () => {}
    
    this._varsToFlush = {};
    this._isFlushScheduled = false;
    this.onValueChanged = () => {}

    this.initInteractions();
  }

  _xToCol(x) { 
    return (x - offsetX) / (charWidthFactor * this.fontSize) + charWidthOffset;
  }
  _yToRow(y) {
    return (y - offsetY) / (charHeightFactor * this.fontSize) + charHeightOffset;
  }

  toggleVisible() {
    this.isVisible = !this.isVisible;
    this.element.style.left = `${this.isVisible ? 20 : -2000}px`;
  };

  setFontSize(size) {
    this.fontSize = size;
    this.element.style.fontSize = this.fontSize + "px";
  }
  increaseFontSize() {
    this.setFontSize(this.fontSize * 1.1)
  }
  decreaseFontSize(size) {
    this.setFontSize(this.fontSize / 1.1)
  }

  getRect() {
    return this.element.getBoundingClientRect();
  }

  contains(x, y) {
    let col = this._xToCol(x);
    let row = this._yToRow(y);
    return (
      col >= 0 && col < this.element.cols + 2 && row >= 0 && row < this.element.rows
    );
  };

  pointToIndex(x,y) {
    let s = this.textarea.value;
    let col = 0, row = 0;
    let cw = charWidthFactor * this.fontSize;
    let ch = charHeightFactor * this.fontSize;

    for (let n = 0 ; n < s.length ; n++)
        if (col*cw <= x-ox && row*ch <= y-oy && col*cw+cw > x-ox && row*ch+ch > y-oy)
          return n;
        else
          switch (s.charAt(n)) {
          case '\n': row++; col = 0; break;
          case '\t': col += 8 - col % 8; break;
          default  : col++; break;
          }
    return -1;
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
  };

  update(time = Date.now() / 1000) {
    let lines = this.element.value.split("\n");
    this.element.rows = Math.min((790 / this.fontSize) >> 0, lines.length);
    this.element.cols = lines.reduce((acc, cur) => Math.max(acc, cur.length - 1), 0)
    if (this.isReloadScene && time - this.lastReloadTime > 0.1) {
      try {
        // Remove zero-width space markers (\u200B) added by Yjs sync before eval
        this.element.value = this.element.value.replace(/\u200B/g, "");

        // Replace imports with absolute URLs for scene reloading
        const code = this.element.value.replace(
          /from\s+['"]([^'"]+)['"]/g,
          (_, spec) => {
            const url = new URL(spec, import.meta.url).href;
            return `from '${url}'`;
          }
        );
        this.onReloadScene(code)
      } catch (e) {
        console.error("Scene code error:", e);
      }
      this.lastReloadTime = time;
      this.isReloadScene = false;
    }

    if (!this.isVisible) return;

    // this.highlightCharAt(pen.x, pen.y, "#00000060");

    // for (const h in gestureTracker.activeGestures) {
    //   const gesture = gestureTracker.activeGestures[h];
    //   if (gesture?.id === "indexPinch") {
    // isPinch = true;
    //       let p = { x: gesture.state[h].x * screen.width,
    //                 y: gesture.state[h].y * screen.height };

    //       if (isShadowAvatar())
    //         toShadowAvatar(p);

    //       if(!this.contains(p.x, p.y)) continue;

    //       let col = xToCol(p.x) - 1;
    //       let row = yToRow(p.y);
    //       octx.lineWidth = 2;
    //       octx.strokeStyle = 'black';
    //       drawOverlayRect(col>>0, row>>0, 1, 1);
    // if (! wasPinch) {
    //         let index = this.pointToIndex(p.x, p.y);
    //         if (index >= 0)
    //             codeArea.selectionStart = codeArea.selectionEnd = index + 1;
    //       }
    // slideValue(p.x, p.y);
    //   }
  };

  initInteractions() {
    this.element.addEventListener("mousemove", (ev) => {
      if (!ev.shiftKey) return;
      this.slideValue(ev.clientY)
    });

    this.element.addEventListener("keyup", (event) => {
      if (event.key == "Shift") {
        this.ey = 0;
      }
      if (event.key == "Meta") {
        // Trigger input event to sync reload to other users via Yjs
        this.isReloadScene = true;
        this.onValueChanged()
      }
      if (event.key == "Control") {
        let i0 = this.element.selectionStart;
        let i1 = this.element.selectionEnd;
        if (i0 < i1)
          try {
            let func = new Function(
              "return " + this.element.value.substring(i0, i1)
            );
            let result = "" + func();
            this.element.value =
              this.element.value.substring(0, i0) +
              result +
              this.element.value.substring(i1);
            this.element.selectionStart = this.element.selectionEnd =
              i0 + result.length;
          } catch (e) {
            console.log("error:", e);
          }
      }
    });
    this.element.addEventListener("input", () => {
      this.onValueChanged();
    })
  }
  // Internal helper to apply a single var change to the text
  _applyVarToText(text, name, value) {
    let i = text.indexOf("let " + name);
    if (i >= 0) {
      if (typeof value == "number" && !Number.isInteger(value))
        value =
          (Math.sign(value) * ((1000 * Math.abs(value) + 0.5) >> 0)) / 1000;
      else if (Array.isArray(value)) value = "[" + value + "]";

      let j = i + 4 + name.length;
      let k = text.indexOf(";", j);
      return text.substring(0, j) + " = " + value + text.substring(k);
    }
    return text;
  };

  _scheduleFlush() {
    // Use queueMicrotask to flush after all synchronous setVar calls complete
    if(this._isFlushScheduled) return;
    this._isFlushScheduled = true;
    queueMicrotask(() => this._flushPendingVars())
  }

  _flushPendingVars() {
    this._isFlushScheduled = false;
    let vars = this._varsToFlush;

    if (Object.keys(vars).length === 0) return;

    // In multiplayer mode, only master should sync to Yjs
    // Secondary clients send batched vars to master via WebRTC
    if (!webrtcClient.isMaster()) {
      webrtcClient.sendAction({
        type: "setVars",
        vars
      });
      this._varsToFlush = {};
      return;
    }

    // Master: apply all pending var changes atomically
    let newText = this.element.value;
    
    for (let name in vars) {
      newText = this._applyVarToText(newText, name, vars[name]);
    }

    this.element.value = newText;
    this._varsToFlush = {};

    this.isReloadScene = true;
    this.onValueChanged();
  };

  setVar(name, value) {
    this._varsToFlush[name] = value;
    this._scheduleFlush();
  };

  setVars(vars) {
    Object.assign(this._varsToFlush, vars);
    this._scheduleFlush();
  };

  getVar(name) {
    let text = this.element.value;
    let i = text.indexOf("let " + name);
    if (i >= 0) {
      let j = i + 4 + name.length + 3;
      let k = text.indexOf(";", j);
      return text.substring(j, k);
    }
    return null;
  };

  slideValue(y) {
    if (this.ey && Math.abs((this.dial += y - this.ey)) >= 3) {
      let i1 = this.element.selectionStart;
      let s0 = NumberString.findNumberString(this.element.value, i1);
      if (s0) {
        let i0 = i1 - s0.length;
        let s1 = NumberString.increment(s0, -Math.sign(this.dial));

        if (
          this.element.value.charAt(i0 - 1) == " " &&
          s0.charAt(0) != "-" &&
          s1.charAt(0) == "-"
        )
          i0--;
        if (s0.charAt(0) == "-" && s1.charAt(0) != "-") s1 = " " + s1;

        this.element.value =
          this.element.value.substring(0, i0) + s1 + this.element.value.substring(i1);
        this.element.selectionStart = this.element.selectionEnd = i0 + s1.length;

        // Trigger input event to sync with Yjs
        this.isReloadScene = true;
        this.onValueChanged()
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
}
