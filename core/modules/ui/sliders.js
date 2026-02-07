export function Sliders(diagram,x,y,w,h,names) {''
   let sliders = [], S = null;
   const codeArea = diagram.context.codeArea
   for (let n = 0 ; n < names.length ; n++) {
      codeArea.setVar(names[n], .5);
      sliders.push({ x: x, y: y, w: w, h: h, name: names[n], value: .5 });
      y -= 1.2 * h;
   }
   let drawSlider = S => {
      let e = S.h / 20, v = S.w * S.value;
      diagram.fillColor('black'  ).fillRect([S.x-S.w/2-e,S.y-S.h/2-e],[S.x+S.w/2+e,S.y+S.h/2+e])
             .fillColor('white'  ).fillRect([S.x-S.w/2  ,S.y-S.h/2  ],[S.x+S.w/2  ,S.y+S.h/2  ])
             .fillColor('#b0b0b0').fillRect([S.x-S.w/2  ,S.y-S.h/2  ],[S.x-S.w/2+v,S.y+S.h/2  ])
             .drawColor('black'  ).font(200 * S.h + 'px Helvetica').text(S.name, [S.x, S.y]);
   }
   this.onDown = (x,y) => {
      for (let n = 0 ; n < sliders.length ; n++)
         if (Math.abs(y - sliders[n].y) < sliders[n].h / 2) {
            S = sliders[n];
            S.value = Math.max(0, Math.min(1, .5 + (x - S.x) / S.w));
         }
   }
   this.onUp = (x,y) => S = null;
   this.onDrag = (x,y) => {
      if (S)
         S.value = Math.max(0, Math.min(1, .5 + (x - S.x) / S.w));
   }
   this.update = () => {
      for (let n = 0 ; n < sliders.length ; n++) {
         if (sliders[n] == S)
            codeArea.setVar(S.name, S.value);
         else
            sliders[n].value = parseFloat(codeArea.getVar(names[n]));
         drawSlider(sliders[n]);
      }
   }
}
