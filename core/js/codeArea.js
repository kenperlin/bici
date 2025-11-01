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
      if (event.key == 'Shift') {
         window.isShift = false;
	 ey = 0;
      }
      if (this.callback && event.key == '`') {
         let i = codeArea.selectionStart - 1;
         codeArea.value = codeArea.value.substring(0,i) + codeArea.value.substring(i+1);
         codeArea.selectionStart = codeArea.selectionEnd = i;
         this.callback();
      }
   });

   this.getElement = () => codeArea;

   this.update = () => {
      codeArea.style.fontSize = (fontSize >> 0) + 'px';
      let lines = codeArea.value.split('\n');
      codeArea.rows = Math.min(790 / fontSize >> 0, lines.length);
      codeArea.cols = 0;
      for (let n = 0 ; n < lines.length ; n++)
         codeArea.cols = Math.max(codeArea.cols, lines[n].length-1);
   }

   this.changeFontSize = factor => {
      fontSize *= factor;
   }
}
