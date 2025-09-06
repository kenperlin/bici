
function Pen() {

   this.strokes = [];
   this.width = 10;
   let isDown = false;
   let ctx;
   
   this.down = () => {
      if ( ! isDown) {
         let stroke = [];
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

   let highlightSketches = false;
   
   this.draw = (ss, lineWidth) => {
      if (highlightSketches && ss.xlo) {
         ctx.fillStyle = '#0080ff40';
	 ctx.fillRect(ss.xlo, ss.ylo, ss.xhi-ss.xlo, ss.yhi-ss.ylo);
      }
      for (let n = 0 ; n < ss.length ; n++) {
         let s = ss[n];
         ctx.lineWidth = lineWidth ?? s.lineWidth;
         ctx.beginPath();
         for (let i = 0 ; i < s.length ; i++)
            ctx[i==0 ? 'moveTo' : 'lineTo'](s[i][0],s[i][1]);
         ctx.stroke();
      }
   }
}

