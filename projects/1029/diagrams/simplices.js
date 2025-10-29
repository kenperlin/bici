function Diagram() {
   let state = 0, isDown = false, theta = .1, phi = .1, xPrev = 0, yPrev = 0;
   let order = [ [1,2],[2,1],[2,4],[4,2],[4,1],[1,4] ];
   this.onDown = (x,y) => {
      isDown = true;
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
      isDown = false;
      if (y > .5)
         if (x > 0)
	    state = Math.min(state + 1, 12);
         else
            state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      this.turnY(theta);
      this.turnX(phi);

      ctx.fillStyle = '#0000ff20';
      ctx.strokeStyle = '#0000ff';

      this.scale(.5);

      let C = cubeVertices;

      for (let n = 0 ; n < cubeEdges.length ; n++)
         this.line(C[cubeEdges[n][0]], C[cubeEdges[n][1]]);

      ctx.strokeStyle = 'black';

      let n = (Date.now() / 1000 >> 0) % 6;

      let a = order[n][0];
      let b = order[n][1];

      this.line(C[0],C[a]);
      this.line(C[0],C[a+b]);
      this.line(C[0],C[7]);
      this.line(C[a],C[a+b]);
      this.line(C[a],C[7]);
      this.line(C[a+b],C[7]);

      ctx.fillStyle = '#00000020';
      this.fillPolygon([C[0],C[a],C[7]]);
      this.fillPolygon([C[0],C[a],C[a+b]]);
      this.fillPolygon([C[0],C[a+b],C[7]]);
      this.fillPolygon([C[a],C[a+b],C[7]]);

      this.identity();
      this.scale(.5);

      this.text('0      ' + a +  '      ' + (a+b) + '      7', [0,1.6]);
      this.line([-.65,1.6],[-.40,1.6],.5);
      this.line([-.15,1.6],[ .15,1.6],.5);
      this.line([ .40,1.6],[ .65,1.6],.5);
   }
}
