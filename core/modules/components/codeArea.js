import * as NumberString from "../numberString.js";
import { webrtcClient } from "../yjs/yjs.js";

const offsetX = 20;
const offsetY = 20;
const charWidthFactor = 0.6;
const charHeightFactor = 1.14;
const charWidthOffset = 0.35;
const charHeightOffset = 0.15;

export class CodeArea {
  constructor(textareaElement) {
    this.textarea = textareaElement;
    this.fontSize = 18;

    this.textarea.style.fontSize = this.fontSize + "px";

    this.isVisible = false;
    this.ey = 0;
    this.dial = 0;
    this.isReloadScene = false;
    this.lastReloadTime = 0;
    this.onReloadScene = () => {}

    this._varsToFlush = {};
    this._isFlushScheduled = false;

    this.initInteractions();
  }

  _xToCol(x) { 
    return (x - offsetX) / (charWidthFactor * this.fontSize) + charWidthOffset;
  }
  _yToRow(y) {
    return (y - offsetY) / (charHeightFactor * this.fontSize) + charHeightOffset;
  }

  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.textarea.style.left = `${isVisible ? 20 : -2000}px`;
  };

  containsPoint(x, y) {
    let col = this._xToCol(x);
    let row = this._yToRow(y);
    return (
      col >= 0 && col < this.textarea.cols + 2 && row >= 0 && row < this.textarea.rows
    );
  };

  drawOverlayRect(col, row, nCols, nRows, octx, isFill) {
    let charWidth = charWidthFactor * this.fontSize;
    let charHeight = charHeightFactor * this.fontSize;
    
    let drawFn = isFill ? octx.fillRect : octx.strokeRect;
    drawFn(
      offsetX + charWidth * (col + charWidthOffset),
      offsetY + charHeight * (row + charHeightOffset),
      nCols * charWidth,
      nRows * charHeight
    );
  };

  update(time = Date.now() / 1000) {
    let lines = this.textarea.value.split("\n");
    this.textarea.rows = Math.min((790 / this.fontSize) >> 0, lines.length);
    this.textarea.cols = lines.reduce((acc, cur) => Math.max(acc, cur.length - 1), 0)

    if (this.isReloadScene && time - this.lastReloadTime > 0.1) {
      try {
        // Remove zero-width space markers (\u200B) added by Yjs sync before eval
        this.textarea.value = this.textarea.value.replace(/\u200B/g, "");

        // Replace imports with absolute URLs for scene reloading
        const code = this.textarea.value.replace(
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

    // if (this.isVisible) {
    //   let highlightCharAt = (x, y, color) => {
    //     if (this.containsPoint(x, y)) {
    //       octx.fillStyle = color;
    //       fillOverlayRect(xToCol(x) >> 0, yToRow(y) >> 0, 1, 1);
    //     }
    //   };

    //   highlightCharAt(pen.x, pen.y, "#00000060");

    //   for (const h in gestureTracker.activeGestures) {
    //     const gesture = gestureTracker.activeGestures[h];
    //     if (gesture?.id === "indexPinch") {
    //       let x = gesture.state[h].x * screen.width;
    //       let y = gesture.state[h].y * screen.height;
    //       if (!this.containsPoint(x, y)) continue;

    //       let col = xToCol(x) - 1;
    //       let row = yToRow(y) - 0.5;
    //       octx.lineWidth = 2;
    //       octx.strokeStyle = "black";
    //       drawOverlayRect(col >> 0, row >> 0, 1, 1);
    //     }
    //   }
    // }
  };

  initInteractions() {
    this.textarea.addEventListener("mousemove", (ev) => {
      if (!ev.shiftKey) return;
      
      if (this.ey && Math.abs((this.dial += ev.clientY - this.ey)) >= 3) {
        let i1 = this.textarea.selectionStart;
        let s0 = NumberString.findNumberString(this.textarea.value, i1);
        if (s0) {
          let i0 = i1 - s0.length;
          let s1 = NumberString.increment(s0, -Math.sign(this.dial));

          if (
            this.textarea.value.charAt(i0 - 1) == " " &&
            s0.charAt(0) != "-" &&
            s1.charAt(0) == "-"
          )
            i0--;
          if (s0.charAt(0) == "-" && s1.charAt(0) != "-") s1 = " " + s1;

          this.textarea.value =
            this.textarea.value.substring(0, i0) + s1 + this.textarea.value.substring(i1);
          this.textarea.selectionStart = this.textarea.selectionEnd = i0 + s1.length;

          // Trigger input event to sync with Yjs
          this.textarea.dispatchEvent(new Event("input", { bubbles: true }));

          this.isReloadScene = true;
        }
        this.dial = 0;
      }
      ey = ev.clientY;
    });

    this.textarea.addEventListener("keyup", (event) => {
      if (event.key == "Shift") {
        this.ey = 0;
      }
      if (event.key == "Meta") {
        // window.isReloading = true;
        // Trigger input event to sync reload to other users via Yjs
        this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
        this.isReloadScene = true;
      }
      if (event.key == "Control") {
        let i0 = this.textarea.selectionStart;
        let i1 = this.textarea.selectionEnd;
        if (i0 < i1)
          try {
            let func = new Function(
              "return " + this.textarea.value.substring(i0, i1)
            );
            let result = "" + func();
            this.textarea.value =
              this.textarea.value.substring(0, i0) +
              result +
              this.textarea.value.substring(i1);
            this.textarea.selectionStart = this.textarea.selectionEnd =
              i0 + result.length;
          } catch (e) {
            console.log("error:", e);
          }
      }
    });
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
        vars: pendingVars
      });
      pendingVars = {};
      return;
    }

    // Master: apply all pending var changes atomically
    let newText = this.textarea.value;
    
    for (let name in vars) {
      newText = this._applyVarToText(newText, name, vars[name]);
    }

    this.textarea.value = newText;
    this._varsToFlush = {};

    // window.isReloading = true;
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    this.isReloadScene = true;
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
    let text = this.textarea.value;
    let i = text.indexOf("let " + name);
    if (i >= 0) {
      let j = i + 4 + name.length + 3;
      let k = text.indexOf(";", j);
      return text.substring(j, k);
    }
    return null;
  };
}
