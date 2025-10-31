function Diagram() {
   let theta=.1, phi=.1, xPrev=0, yPrev=0, mx=0, my=0, n=0;
   let order = [ [1,3],[2,3],[2,6],[4,6],[4,5],[1,5] ];
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
   this.onUp = (x,y) => {
      if (y > .5)
         n = (x>0 ? n+1 : n+5) % 6;
   }
   this.update = ctx => {
      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      this.turnY(theta);
      this.turnX(phi);

      this.fillColor('#0000ff20');
      this.drawColor('#0000ff');

      this.scale(.5);

      let C = cubeVertices;

      let a = order[n][0];
      let b = order[n][1];

      this.lineWidth(.016);
      for (let n = 0 ; n < cubeEdges.length ; n++)
         this.line(C[cubeEdges[n][0]], C[cubeEdges[n][1]]);
      for (let n = 0 ; n < C.length ; n++) {
         let isSelected = n==0 || n==a || n==b || n==7;
         this.drawColor(isSelected ? 'black' : 'blue');
         this.font((isSelected ? 'bold ' : '') + '30px Helvetica');
         this.text(n, [C[n][0]+.2*Math.sign(C[n][0]),C[n][1],C[n][2]]);
      }

      this.drawColor('black');

      this.lineWidth(.008);
      this.line(C[0],C[a]);
      this.line(C[0],C[b]);
      this.line(C[0],C[7]);
      this.line(C[a],C[b]);
      this.line(C[a],C[7]);
      this.line(C[b],C[7]);

      this.fillColor('#00000010');
      this.fillPolygon([C[0],C[a],C[7]]);
      this.fillPolygon([C[0],C[a],C[b]]);
      this.fillPolygon([C[0],C[b],C[7]]);
      this.fillPolygon([C[a],C[b],C[7]]);

      this.identity();
      this.scale(.5);

      this.font('bold 30px Helvetica');
      this.text('0      ' + a +  '      ' + b + '      7', [0,1.6]);
      this.line([-.65,1.6],[-.40,1.6],.5);
      this.line([-.15,1.6],[ .15,1.6],.5);
      this.line([ .40,1.6],[ .65,1.6],.5);
   }
}
