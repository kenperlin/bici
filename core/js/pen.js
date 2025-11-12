
function Pen() {

   this.strokes = [];
   this.width = 7;
   let isDown = false;
   let ctx;
   let color = '#000000';
   let onStrokesChanged = null;

   this.setColor = c => color = c;

   this.setOnStrokesChanged = callback => onStrokesChanged = callback;

   this.down = () => {
      if ( ! isDown) {
         let stroke = [];
         stroke.color = color;
         stroke.lineWidth = this.width;
         stroke.xlo = stroke.ylo =  10000;
         stroke.xhi = stroke.yhi = -10000;
         this.strokes.push(stroke);
         if (onStrokesChanged) onStrokesChanged();
      }
      isDown = true;
   }

   this.move = (x,y) => {
      this.x = x;
      this.y = y;
      if (isDown) {
         let stroke = this.strokes[this.strokes.length-1];
         stroke.push([x,y]);
         stroke.xlo = Math.min(stroke.xlo, x - stroke.lineWidth/2);
         stroke.ylo = Math.min(stroke.ylo, y - stroke.lineWidth/2);
         stroke.xhi = Math.max(stroke.xhi, x + stroke.lineWidth/2);
         stroke.yhi = Math.max(stroke.yhi, y + stroke.lineWidth/2);
         if (onStrokesChanged) onStrokesChanged();
      }
   }

   this.up = () => {
      isDown = false;
      if (onStrokesChanged) onStrokesChanged();
   }
   
   this.setContext = _ctx => {
      ctx = _ctx;
      ctx.strokeStyle = 'black';
      ctx.lineCap = 'round';
   }
   
   this.delete = () => this.strokes.splice(this.strokes.length-1, 1);

   this.clear = () => this.strokes = [];

   let highlightSketches = false;
   
   this.draw = (ss, lineWidth) => {
      if (highlightSketches && ss.xlo) {
         ctx.fillStyle = '#0080ff40';
	 ctx.fillRect(ss.xlo, ss.ylo, ss.xhi-ss.xlo, ss.yhi-ss.ylo);
      }
      for (let n = 0 ; n < ss.length ; n++) {
         let s = ss[n];
         ctx.lineWidth = lineWidth ?? s.lineWidth;
         ctx.strokeStyle = s.color;
         ctx.beginPath();
         for (let i = 0 ; i < s.length ; i++)
            ctx[i==0 ? 'moveTo' : 'lineTo'](s[i][0],s[i][1]);
         ctx.stroke();
      }
   }
}

let isPenDown = false;

let penDown = () => {
   if (isPenDown)
      return;
   isPenDown = true;

   if (isInfo) {
      let slide = slides[slideIndex];
      if (D.isIn()) {
         if (slide.mouseMove || slide.mouseDown || slide.mouseDrag || slide.mouseUp) {
            if (slide.mouseDown)
               slide.mouseDown(D.x, D.y);
            D.isDown = true;
            return;
         }
         if (slide.onMove || slide.onDown || slide.onDrag || slide.onUp) {
            if (slide.onDown)
               slide.onDown(slide._px(D.x), slide._py(D.y));
            D.isDown = true;
            return;
         }
      }
   }

   // Secondary clients send pen action to master
   if (typeof webrtcClient !== 'undefined' && !webrtcClient.isMasterClient) {
      console.log('Secondary sending penDown to master, pos:', pen.x, pen.y);
      webrtcClient.sendAction({
         type: 'penDown',
         x: pen.x,
         y: pen.y,
         width: pen.width
      });
      return;
   }

   pen.down();
}

let penUp = () => {
   isPenDown = false;

   if (isInfo) {
      let slide = slides[slideIndex];
      if (D.isDown) {

         if (slide.mouseUp)
            slide.mouseUp(D.x, D.y);
         if (slide.onUp)
            slide.onUp(slide._px(D.x), slide._py(D.y));

         D.isDown = false;
         return;
      }
   }

   // Secondary clients send pen action to master
   if (typeof webrtcClient !== 'undefined' && !webrtcClient.isMasterClient) {
      webrtcClient.sendAction({
         type: 'penUp'
      });
      return;
   }

   pen.up();
}

let penMove = (x,y) => {
   if (isInfo) {
      D.x = x - D.left;
      D.y = y - D.top;
      let slide = slides[slideIndex];
      if (D.isDown) {

         if (slide.mouseDrag)
            slide.mouseDrag(D.x, D.y);
         if (slide.onDrag)
            slide.onDrag(slide._px(D.x), slide._py(D.y));

         return;
      }
      if (D.isIn()) {

         if (slide.mouseMove)
            slide.mouseMove(D.x, D.y);
         if (slide.onMove)
            slide.onMove(slide._px(D.x), slide._py(D.y));

         return;
      }
   }

   // Secondary clients send pen action to master
   if (typeof webrtcClient !== 'undefined' && !webrtcClient.isMasterClient) {
      webrtcClient.sendAction({
         type: 'penMove',
         x: x,
         y: y,
         isMove: isMove,
         isDrag: isDrag
      });
      return;
   }

   pen.move(x,y);
   if (isMove)
      chalktalk.move(x,y);
   if (isDrag)
      chalktalk.drag(x,y);
}

document.addEventListener('mousemove', e => penMove(e.x,e.y));

