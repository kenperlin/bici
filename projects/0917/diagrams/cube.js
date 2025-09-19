function Diagram() {
   let M = new M4();
   let P = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
   let m = { x: this.width/2, y : this.height/2 }, theta = 0, phi = 0;
   this.mouseDown = (x,y) => m = { x: x, y: y };
   this.mouseDrag = (x,y) => {
      theta += 4 * (x - m.x) / this.width; m.x = x;
      phi   += 4 * (y - m.y) / this.width; m.y = y;
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
      ctx.lineWidth = this.w2p(.015);
      ctx.lineCap = 'round';

      let p = [];
      for (let n = 0 ; n < P.length ; n++)
         p.push(M.transform([P[n][0],P[n][1],P[n][2],1]).slice(0,2));

      let line = (i,j) => {
         let x = px => (.5 + .25 * px) * this.width;
         let y = py => (.5 - .25 * py) * this.width;
         ctx.beginPath();
         ctx.moveTo(this.x2p(p[i][0]/2), this.y2p(p[i][1]/2));
         ctx.lineTo(this.x2p(p[j][0]/2), this.y2p(p[j][1]/2));
         ctx.stroke();
      }
      line(0,1); line(2,3); line(4,5); line(6,7);
      line(0,2); line(1,3); line(4,6); line(5,7);
      line(0,4); line(1,5); line(2,6); line(3,7);
   }
}

