function Diagram() {
   let theta=.1, phi=.1, xPrev=0, yPrev=0, mx=0, my=0, N=0;
   this.onMove = (x,y) => {
      mx = x;
      my = y;
   }
   this.onDown = (x,y) => {
      xPrev = x;
      yPrev = y;
   }
   this.onDrag = (x,y) => {
      theta += x - xPrev;
      phi   -= y - yPrev;
      xPrev = x;
      yPrev = y;
   }

   let nx = n => (n&15)/8 - .94;
   let ny = n => .95 - (n>>4)/8;

   this.update = ctx => {
      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      this.font('16px Helvetica');
      for (let n = 0 ; n < 256 ; n++) {
         let x = nx(n);
         let y = ny(n);
	 if ( mx >= x-.03 && mx < x + .03 &&
	      my >= y-.03 && my < y + .01 )
            N = n;
         this.drawColor(n == N ? 'black' : '#a0a0a0');
         this.text(n, [x, y]);
      }

      this.turnY(theta).turnX(phi).scale(.5);
      this.drawColor('black');
      let C = cubeVertices;
      for (let n = 0 ; n < cubeEdges.length ; n++)
         this.line(C[cubeEdges[n][0]], C[cubeEdges[n][1]]);

      for (let n = 0 ; n < 8 ; n++) {
         this.drawColor(N & (1<<n) ? 'blue' : 'red');
	 this.dot(C[n], .05);
      }

      let t = marching_cubes_table[N];
      let sgn = (a,b,d) => b == d ? 0 : (a & 1<<d) > 0 ? 1 : -1;
      this.drawColor('black');
      this.fillColor('#00000030');
      this.lineWidth(.008);
      for (let k = 0 ; k < t.length ; k += 6) {
         let a = t[k], b = t[k+1], c = t[k+2], d = t[k+3], e = t[k+4], f = t[k+5];
         let A = [sgn(a, b, 0), sgn(a, b, 1), sgn(a, b, 2)];
         let B = [sgn(c, d, 0), sgn(c, d, 1), sgn(c, d, 2)];
         let C = [sgn(e, f, 0), sgn(e, f, 1), sgn(e, f, 2)];
         this.line(A, B);
         this.line(B, C);
         this.line(C, A);
	 this.fillPolygon([A,B,C]);
      }
   }
}
