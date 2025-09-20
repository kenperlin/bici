function Diagram() {
   let P = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
   let L = [0,1, 2,3, 4,5, 6,7, 0,2, 1,3, 4,6, 5,7, 0,4, 1,5, 2,6, 3,7];
   let cx = 0, cy = 0, theta = 0, phi = 0;

   this.onDown = (x,y) => { cx = x; cy = y; }
   this.onDrag = (x,y) => {
      theta += x - cx; cx = x;
      phi   -= y - cy; cy = y;
   }
   this.height = 400;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      for (let n = 0 ; n < 20 ; n++)
         this.turnY(theta/20).turnX(phi/20);
      this.scale(.5);

      ctx.strokeStyle = 'black';
      for (let n = 0 ; n < L.length ; n += 2)
         this.line(P[L[n]], P[L[n+1]]);

      ctx.strokeStyle = 'red';
      this.text('Corner', P[0]);
   }
}
