function Diagram() {
   let px = 0, py = 0;
   this.onDrag = (x,y) => {
      let text = codeArea.getElement().value;
      let setValue = (S, t) => {
         let i = text.indexOf(S);
	 if (i >= 0) {
            text = text.substring(0,i+5) + (10*t>>0) + text.substring(i+6);
	    isReloadScene = true;
	 }
      }
      setValue('R', .5 + .5 * x);
      setValue('G', .5 + .5 * y);
      if (isReloadScene)
         codeArea.getElement().value = text;
      px = x;
      py = y;
   }
   this.update = ctx => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      this.line([-.5,0],[.5,0],1);
      this.line([0,-.5],[0,.5],1);
      this.fillColor('black').fillRect([px-.05, py-.05],
                                       [px+.05, py+.05]);
   }
}

