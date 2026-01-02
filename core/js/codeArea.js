function CodeArea(x,y) {
   let ey = 0, dial = 0;

   let codeArea = document.createElement('textArea');
   document.body.appendChild(codeArea);
   codeArea.spellcheck = false;
   codeArea.style.position = 'absolute';
   codeArea.style.left = x;
   codeArea.style.top = y;
   codeArea.style.backgroundColor = 'rgba(255,255,255,.6)';
   codeArea.style.fontSize = fontSize + 'px';

   let ox = 20, oy = 20, ow = 605, oh = screen.height;

   codeArea.style.overflowY = 'scroll';
   codeArea.addEventListener('mousemove', event => {
      if (window.isShift) {
         if (ey && Math.abs(dial += event.clientY-ey) >= 3) {
	    let i1 = codeArea.selectionStart;
	    let s0 = numberString.findNumberString(codeArea.value, i1);
	    if (s0) {
	       let i0 = i1 - s0.length;
	       let s1 = numberString.increment(s0, -Math.sign(dial));

	       if (codeArea.value.charAt(i0-1) == ' ' && s0.charAt(0) != '-' && s1.charAt(0) == '-')
	          i0--;
	       if (s0.charAt(0) == '-' && s1.charAt(0) != '-')
	          s1 = ' ' + s1;

	       codeArea.value = codeArea.value.substring(0,i0) + s1 + codeArea.value.substring(i1);
               codeArea.selectionStart = codeArea.selectionEnd = i0 + s1.length;

	       // Trigger input event to sync with Yjs
	       codeArea.dispatchEvent(new Event('input', { bubbles: true }));

	       if (this.callback)
	          this.callback();
            }
	    dial = 0;
	 }
         ey = event.clientY;
      }
   });
   codeArea.addEventListener('keydown', event => {
      if (event.key == 'Shift')
         window.isShift = true;
   });
   codeArea.addEventListener('keyup', event => {
      console.log(event.key);
      if (event.key == 'Shift') {
         window.isShift = false;
	 ey = 0;
      }
      if (this.callback && event.key == 'Meta') {
         window.isReloading = true;
         // Trigger input event to sync reload to other users via Yjs
         codeArea.dispatchEvent(new Event('input', { bubbles: true }));
         this.callback();
      }
      if (event.key == 'Control') {
         let i0 = codeArea.selectionStart;
         let i1 = codeArea.selectionEnd;
	 if (i0 < i1)
	    try {
	       let func = new Function('return ' + codeArea.value.substring(i0,i1));
	       let result = '' + func();
	       codeArea.value = codeArea.value.substring(0,i0)
	                      + result
			      + codeArea.value.substring(i1);
               codeArea.selectionStart = codeArea.selectionEnd = i0 + result.length;
            } catch (e) { console.log('error:', e); }
      }
   });

   this.getElement = () => codeArea;

   this.setVisible = isVisible => {
      this.isVisible = isVisible;
      codeArea.style.left = isVisible ? 20 : -2000;
   }

   this.containsPoint = (x,y) => {
      let col = xToCol(x);
      let row = yToRow(y);
      return col >= 0 && col < codeArea.cols+2 && row >= 0 && row < codeArea.rows;
   }

   let xToCol = x => (x - ox) / (0.60 * fontSize) + .35;
   let yToRow = y => (y - oy) / (1.15 * fontSize) + .15;

   let drawOverlayRect = (col,row,nCols,nRows) => {
      let charWidth  = 0.60 * fontSize;
      let charHeight = 1.15 * fontSize;
      octx.strokeRect(ox + charWidth * (col+.35), oy + charHeight * (row+.15), nCols * charWidth, nRows * charHeight);
   }

   let fillOverlayRect = (col,row,nCols,nRows) => {
      let charWidth  = 0.60 * fontSize;
      let charHeight = 1.15 * fontSize;
      octx.fillRect(ox + charWidth * (col+.35), oy + charHeight * (row+.15), nCols * charWidth, nRows * charHeight);
   }

   this.update = () => {
      codeArea.style.backgroundColor = isOpaque ? 'white' : 'rgba(255,255,255,.6)';
      codeArea.style.fontSize = (fontSize >> 0) + 'px';
      let lines = codeArea.value.split('\n');
      codeArea.rows = Math.min(790 / fontSize >> 0, lines.length);
      codeArea.cols = 0;
      for (let n = 0 ; n < lines.length ; n++)
         codeArea.cols = Math.max(codeArea.cols, lines[n].length-1);

      if (this.isVisible) {
         let highlightCharAt = (x,y,color) => {
	    if (this.containsPoint(x,y)) {
  	       octx.fillStyle = color;
               fillOverlayRect(xToCol(x)>>0, yToRow(y)>>0, 1, 1);
            }
         }

         highlightCharAt(pen.x, pen.y, '#00000060');

         for (let hand = 0 ; hand < 2 ; hand++)
            if (handPinch[hand].f) {
	       let col = xToCol(handPinch[hand].x) - 1;
	       let row = yToRow(handPinch[hand].y) - .5;
  	       octx.lineWidth = 2;
  	       octx.strokeStyle = 'black';
	       drawOverlayRect(col>>0, row>>0, 1, 1);
            }
      }
   }

   // Internal helper to apply a single var change to the text
   let applyVarToText = (text, name, value) => {
      let i = text.indexOf('let ' + name);
      if (i >= 0) {
         if (typeof value == 'number' && ! Number.isInteger(value))
            value = Math.sign(value) * (1000 * Math.abs(value) + .5 >> 0) / 1000;
         else if (Array.isArray(value))
            value = '[' + value + ']';

         let j = i + 4 + name.length;
         let k = text.indexOf(';', j);
         return text.substring(0,j) + ' = ' + value + text.substring(k);
      }
      return text;
   };

   // Auto-batching for setVar calls
   // Multiple setVar calls in the same execution frame are automatically batched
   // This prevents the "flash" bug in multiplayer where intermediate states cause visual glitches
   let pendingVars = {};
   let flushScheduled = false;

   let flushPendingVars = () => {
      flushScheduled = false;
      if (Object.keys(pendingVars).length === 0) return;

      // In multiplayer mode, only master should sync to Yjs
      // Secondary clients send batched vars to master via WebRTC
      if (typeof webrtcClient !== 'undefined' && webrtcClient && !webrtcClient.isMaster()) {
         webrtcClient.sendAction({
            type: 'setVars',
            vars: pendingVars
         });
         pendingVars = {};
         return;
      }

      // Master: apply all pending var changes atomically
      let text = codeArea.value;
      for (let name in pendingVars) {
         text = applyVarToText(text, name, pendingVars[name]);
      }
      codeArea.value = text;
      pendingVars = {};
         
      window.isReloading = true;
      codeArea.dispatchEvent(new Event('input', { bubbles: true }));
         
      window.isReloadScene = true;
   };

   this.setVar = (name, value) => {
      // Queue the var change - will be flushed after current synchronous code completes
      // This automatically batches multiple setVar calls in the same frame
      pendingVars[name] = value;

      if (!flushScheduled) {
         flushScheduled = true;
         // Use queueMicrotask to flush after all synchronous setVar calls complete
         queueMicrotask(flushPendingVars);
      }
   }

   // Explicit batch set (still available for clarity, but setVar auto-batches now)
   this.setVars = (vars) => {
      for (let name in vars) {
         pendingVars[name] = vars[name];
      }

      if (!flushScheduled) {
         flushScheduled = true;
         queueMicrotask(flushPendingVars);
      }
   }

   this.getVar = name => {
      let text = codeArea.value;
      let i = text.indexOf('let ' + name);
      if (i >= 0) {
         let j = i + 4 + name.length + 3;
	 let k = text.indexOf(';', j);
	 return text.substring(j, k);
      }
      return null;
   }

   this.changeFontSize = factor => {
      fontSize *= factor;
   }
}
