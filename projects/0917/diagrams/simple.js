function Diagram() {
   let cx = 250, cy = 250;
   this.mouseDrag = (x,y) => { cx = x; cy = y; }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(cx-20, cy-20, 40, 40);
   }
}

