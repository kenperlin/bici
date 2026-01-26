function Widgets(diagram,x,y,w,h,names) {
   let widgets = [], W = null;
   let isButtonName = name => name.substring(0,2) == 'b:';
   let isButton = W => isButtonName(W.name);
   for (let n = 0 ; n < names.length ; n++) {
      codeArea.setVar(names[n], .5);
      widgets.push({ x: x, y: y, w: w, h: h, name: names[n], value: isButtonName(names[n]) ? -1 : .5 });
      y -= 1.2 * h;
   }
   let drawWidget = W => {
      let e = W.h / 20, v = W.w * W.value;
      if (isButton(W)) {
         let bgColor = W.value == -1 ? 'white' : W.value == 1 ? 'black' : '#b0b0b0';
         let fgColor = W.value == 1 ? 'white' : 'black';
         let label = W.name.substring(2);
         diagram.fillColor('black').fillRect([W.x-W.w/2-e,W.y-W.h/2-e],[W.x+W.w/2+e,W.y+W.h/2+e],5*e)
                .fillColor(bgColor).fillRect([W.x-W.w/2  ,W.y-W.h/2  ],[W.x+W.w/2  ,W.y+W.h/2  ],5*e)
                .drawColor(fgColor).font(200 * W.h + 'px Helvetica').text(label,   [ W.x, W.y  ]);
      }
      else
         diagram.fillColor('black'  ).fillRect([W.x-W.w/2-e,W.y-W.h/2-e],[W.x+W.w/2+e,W.y+W.h/2+e])
                .fillColor('white'  ).fillRect([W.x-W.w/2  ,W.y-W.h/2  ],[W.x+W.w/2  ,W.y+W.h/2  ])
                .fillColor('#b0b0b0').fillRect([W.x-W.w/2  ,W.y-W.h/2  ],[W.x-W.w/2+v,W.y+W.h/2  ])
                .drawColor('black'  ).font(200 * W.h + 'px Helvetica').text(W.name, [W.x, W.y]);
   }
   this.onDown = (x,y) => {
      for (let n = 0 ; n < widgets.length ; n++)
         if (Math.abs(y - widgets[n].y) < widgets[n].h / 2) {
            W = widgets[n];
	    if (isButton(W))
	       W.value *= 2;
            else
               W.value = Math.max(0, Math.min(1, .5 + (x - W.x) / W.w));
         }
   }
   this.onUp = (x,y) => {
      if (W && isButton(W))
         W.value = -Math.sign(W.value);
      W = null;
   }
   this.onDrag = (x,y) => {
      if (W && ! isButton(W))
         W.value = Math.max(0, Math.min(1, .5 + (x - W.x) / W.w));
   }
   this.update = () => {
      for (let n = 0 ; n < widgets.length ; n++) {
         if (widgets[n] == W)
            codeArea.setVar(W.name, W.value);
         else if (! isButton(widgets[n]))
            widgets[n].value = parseFloat(codeArea.getVar(names[n]));
         drawWidget(widgets[n]);
      }
   }
}
