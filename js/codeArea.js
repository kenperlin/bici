function CodeArea(x,y) {
   let codeArea = document.createElement('textArea');
   document.body.appendChild(codeArea);
   codeArea.spellcheck = false;
   codeArea.style.position = 'absolute';
   codeArea.style.left = x;
   codeArea.style.top = y;
   codeArea.style.backgroundColor = 'rgba(255,255,255,.33)';
   codeArea.style.fontSize = '20px';
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
      let lines = codeArea.value.split('\n');
      codeArea.rows = lines.length;
      codeArea.cols = 0;
      for (let n = 0 ; n < codeArea.rows ; n++)
         codeArea.cols = Math.max(codeArea.cols, lines[n].length-1);
   }
}
