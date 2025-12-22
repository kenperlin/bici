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

   let codeOverlay = document.createElement('canvas');
   document.body.appendChild(codeOverlay);
   codeOverlay.style.position = 'absolute';
   codeOverlay.style.left = 20;
   codeOverlay.style.top = 20;
   codeOverlay.style.pointerEvents = 'none';
   codeOverlay.width = 605;
   codeOverlay.height = screen.height;
   let ctx = codeOverlay.getContext('2d');

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

   let xToCol = x => (x - parseInt(codeOverlay.style.left)) / (0.60 * fontSize) + .35;
   let yToRow = y => (y - parseInt(codeOverlay.style.top )) / (1.15 * fontSize) + .15;

   let drawOverlayRect = (col,row,nCols,nRows) => {
      let charWidth  = 0.60 * fontSize;
      let charHeight = 1.15 * fontSize;
      ctx.strokeRect(charWidth * (col+.35), charHeight * (row+.15), nCols * charWidth, nRows * charHeight);
   }

   let fillOverlayRect = (col,row,nCols,nRows) => {
      let charWidth  = 0.60 * fontSize;
      let charHeight = 1.15 * fontSize;
      ctx.fillRect(charWidth * (col+.35), charHeight * (row+.15), nCols * charWidth, nRows * charHeight);
   }

   this.update = () => {
      codeArea.style.backgroundColor = isOpaque ? 'white' : 'rgba(255,255,255,.6)';
      codeArea.style.fontSize = (fontSize >> 0) + 'px';
      let lines = codeArea.value.split('\n');
      codeArea.rows = Math.min(790 / fontSize >> 0, lines.length);
      codeArea.cols = 0;
      for (let n = 0 ; n < lines.length ; n++)
         codeArea.cols = Math.max(codeArea.cols, lines[n].length-1);

      ctx.clearRect(0,0,codeOverlay.width,codeOverlay.height);
      if (this.isVisible && this.isOverlay) {
         if (this.isVisible) {
	    ctx.lineWidth = 1;
            ctx.strokeStyle = '#00000080';
/*
	    for (let row = 0 ; row < codeArea.rows ; row++)
	    for (let col = 0 ; col < codeArea.cols + 2 ; col++)
	       if ((row & 1) && (col & 1))
                  drawOverlayRect(col, row, 1, 1);
*/
            for (let n = 0 ; n < lines.length ; n++)
	    for (let i = 0, col = 0 ; i < lines[n].length ; i++, col++) {
	       let ch = lines[n].charAt(i);
	       if (ch == ' ')
	          drawOverlayRect(col, n, 1, 1);
	       else if (ch == '\t') {
	          let nc = 8 - col % 8;
	          drawOverlayRect(col, n, nc, 1);
	          col += nc - 1;
                }
            }
         }

         let highlightCharAt = (x,y,color) => {
	    let col = xToCol(x);
	    let row = yToRow(y);
	    if (col >= 0 && col < codeArea.cols+2 && row >= 0 && row < codeArea.rows) {
	       ctx.fillStyle = color;
               fillOverlayRect(col>>0, row>>0, 1, 1);
            }
         }

         highlightCharAt(pen.x, pen.y, '#00000060');

         for (let hand = 0 ; hand < 2 ; hand++)
            if (handPinch[hand].f) {
	       let col = xToCol(handPinch[hand].x) - 1;
	       let row = yToRow(handPinch[hand].y) - 1;
	       ctx.lineWidth = 2;
	       ctx.strokeStyle = 'black';
	       drawOverlayRect(col>>0, row>>0, 1, 1);
            }
      }
   }

   this.setVar = (name, value) => {
      let text = codeArea.value;
      let i = text.indexOf('let ' + name);
      if (i >= 0) {
	 if (typeof value == 'number' && ! Number.isInteger(value))
	    value = Math.sign(value) * (1000 * Math.abs(value) + .5 >> 0) / 1000;

         let j = i + 4 + name.length;
         let k = text.indexOf(';', j);
         codeArea.value = text.substring(0,j) + ' = ' + value + text.substring(k);
         
         window.isReloading = true;
         codeArea.dispatchEvent(new Event('input', { bubbles: true }));
         
         isReloadScene = true;
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
