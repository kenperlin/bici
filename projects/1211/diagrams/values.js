function Diagram() {
   let px = 0, py = 0;
   this.onDrag = (x,y) => {
      let setValue = (name, t) => {
         let text = codeArea.getElement().value;
         let i = text.indexOf(name);
	 if (i >= 0) {
	    let j = i + name.length;
            text = text.substring(0,j+4) + (10*t>>0) + text.substring(j+5);
            codeArea.getElement().value = text;
	    isReloadScene = true;
	 }
      }
      codeArea.setValue('red'  , .5 + .5 * x);
      codeArea.setValue('green', .5 + .5 * y);
      px = x;
      py = y;
   }
   this.update = ctx => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      this.drawColor('red').line([-.5,0],[.5,0],1);
      this.drawColor('green').line([0,-.5],[0,.5],1);
      this.fillColor('black').fillRect([px-.05, py-.05],
                                       [px+.05, py+.05]);
   }
}

