function Diagram() {
   let names = 'red,green,x,y'.split(',');
   let sy = n => .9 - .18 * n, sliders = [];
   for (let n = 0 ; n < names.length ; n++) {
      codeArea.setVar(names[n], .5);
      sliders.push({ name: names[n], value: .5 });
   }
   let slider = (x,y,w, name, t) => {
      this.fillColor('black'  ).fillRect([x-w/2-.01,y-.08],[x+w/2+.01,y+.08])
          .fillColor('white'  ).fillRect([x-w/2    ,y-.07],[x+w/2    ,y+.07])
          .fillColor('#b0b0b0').fillRect([x-w/2    ,y-.07],[x-w/2+w*t,y+.07])
          .drawColor('black'  ).text(name, [x, y]);
   }
   this.onDrag = (x,y) => {
      for (let n = 0 ; n < sliders.length ; n++)
         if (Math.abs(y - sy(n)) < .08) {
	    sliders[n].value = Math.max(0, Math.min(1, (.4 + x) / .8));
	    codeArea.setVar(sliders[n].name, sliders[n].value);
	 }
   }
   this.update = ctx => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      for (let n = 0 ; n < sliders.length ; n++) {
         sliders[n].value = parseFloat(codeArea.getVar(names[n]));
         slider(0, sy(n), .8, sliders[n].name, sliders[n].value);
      }
   }
}
