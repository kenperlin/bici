function Diagram() {
   let mx = 250, my = 250;
   this.mouseDrag = (x,y) => { mx = x; my = y; }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,500,500);
      ctx.fillStyle = 'black';
      ctx.fillRect(mx-25,my-25,50,50);
   }
}

