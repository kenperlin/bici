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
         isReloading = true;
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

   this.update = () => {
      codeArea.style.backgroundColor = isOpaque ? 'white' : 'rgba(255,255,255,.6)';
      codeArea.style.fontSize = (fontSize >> 0) + 'px';
      let lines = codeArea.value.split('\n');
      codeArea.rows = Math.min(790 / fontSize >> 0, lines.length);
      codeArea.cols = 0;
      for (let n = 0 ; n < lines.length ; n++)
         codeArea.cols = Math.max(codeArea.cols, lines[n].length-1);

      let ctx = codeOverlay.getContext('2d');
      ctx.clearRect(0,0,codeOverlay.width,codeOverlay.height);
      if (this.isOverlay) {
         let charWidth  = 0.60 * fontSize;
         let charHeight = 1.15 * fontSize;
         if (this.isVisible) {
            ctx.strokeStyle = '#00000080';
	    for (let row = 0 ; row < codeArea.rows ; row++)
	    for (let col = 0 ; col < codeArea.cols + 2 ; col++)
	       if ((row & 1) && (col & 1))
                  ctx.strokeRect(charWidth * (col+.35), charHeight * (row+.15), charWidth, charHeight);
         }
      }
   }

   this.setValue = (name, t) => {
      t = Math.max(0, Math.min(.9999, t));
      let text = codeArea.value;
      let i = text.indexOf(name);
      if (i >= 0) {
         let j = i + name.length;
	 let v = '' + (1000*t>>0);
	 v = v.length==1 ? '00' + v : v.length==2 ? '0' + v : v;
         text = text.substring(0,j+4) + v + text.substring(j+7);
         codeArea.value = text;
         isReloadScene = true;
      }
   }

   this.changeFontSize = factor => {
      fontSize *= factor;
   }
}
