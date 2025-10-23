
function Pen() {

   this.strokes = [];
   this.width = 7;
   let isDown = false;
   let ctx;
   let color = '#000000';

   this.setColor = c => color = c;
   
   this.down = () => {
      if ( ! isDown) {
         let stroke = [];
         stroke.color = color;
         stroke.lineWidth = this.width;
         stroke.xlo = stroke.ylo =  10000;
         stroke.xhi = stroke.yhi = -10000;
         this.strokes.push(stroke);
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
      }
   }
   
   this.up = () => isDown = false;
   
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
      let figure = figures[figureIndex];
      if (D.isIn()) {
         if (figure.mouseMove || figure.mouseDown || figure.mouseDrag || figure.mouseUp) {
            if (figure.mouseDown)
               figure.mouseDown(D.x, D.y);
            D.isDown = true;
            return;
         }
         if (figure.onMove || figure.onDown || figure.onDrag || figure.onUp) {
            if (figure.onDown)
               figure.onDown(figure._px(D.x), figure._py(D.y));
            D.isDown = true;
            return;
         }
      }
   }

   pen.down();
}

let penUp = () => {
   isPenDown = false;

   if (isInfo) {
      let figure = figures[figureIndex];
      if (D.isDown) {

         if (figure.mouseUp)
            figure.mouseUp(D.x, D.y);
         if (figure.onUp)
            figure.onUp(figure._px(D.x), figure._py(D.y));

         D.isDown = false;
         return;
      }
   }

   pen.up();
}

let penMove = (x,y) => {
   if (isInfo) {
      D.x = x - D.left;
      D.y = y - D.top;
      let figure = figures[figureIndex];
      if (D.isDown) {

         if (figure.mouseDrag)
            figure.mouseDrag(D.x, D.y);
         if (figure.onDrag)
            figure.onDrag(figure._px(D.x), figure._py(D.y));

         return;
      }
      if (D.isIn()) {

         if (figure.mouseMove)
            figure.mouseMove(D.x, D.y);
         if (figure.onMove)
            figure.onMove(figure._px(D.x), figure._py(D.y));

         return;
      }
   }

   pen.move(x,y);
   if (isMove)
      chalktalk.move(x,y);
   if (isDrag)
      chalktalk.drag(x,y);
}

document.addEventListener('mousemove', e => penMove(e.x,e.y));

