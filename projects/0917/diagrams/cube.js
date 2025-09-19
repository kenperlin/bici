function Diagram() {
   let M = new M4();
   M.perspective(0,0,-10);
   let P = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
   let cx = 0, cy = 0, theta = 0, phi = 0;
   this.mouseDown = (x,y) => { cx = x; cy = y; }
   this.mouseDrag = (x,y) => {
      theta += x - cx; cx = x;
      phi   -= y - cy; cy = y;
      M.identity();
      M.perspective(0,0,-10);
      for (let n = 0 ; n < 20 ; n++) {
         M.rotateY(theta / 20);
         M.rotateX(phi / 20);
      }
   }
   this.height = 400;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = this.sp(.015);
      ctx.lineCap = 'round';

      let p = [];
      for (let n = 0 ; n < P.length ; n++)
         p.push(M.transform([P[n][0],P[n][1],P[n][2],1]).slice(0,2));

      let line = (i,j) => {
         ctx.beginPath();
         ctx.moveTo(this.xp(p[i][0]/2), this.yp(p[i][1]/2));
         ctx.lineTo(this.xp(p[j][0]/2), this.yp(p[j][1]/2));
         ctx.stroke();
      }
      line(0,1); line(2,3); line(4,5); line(6,7);
      line(0,2); line(1,3); line(4,6); line(5,7);
      line(0,4); line(1,5); line(2,6); line(3,7);
   }
}
