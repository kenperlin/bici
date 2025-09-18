function CodeArea(x,y) {
   let codeArea = document.createElement('textArea');
   document.body.appendChild(codeArea);
   codeArea.spellcheck = false;
   codeArea.style.position = 'absolute';
   codeArea.style.left = x;
   codeArea.style.top = y;
   codeArea.style.backgroundColor = 'rgba(255,255,255,.6)';
   codeArea.style.fontSize = fontSize + 'px';
   codeArea.style.overflowY = 'scroll';
   codeArea.addEventListener('keyup', event => {
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
