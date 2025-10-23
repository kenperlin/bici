// OPEN TUBE
function Diagram() {
   let V = [], N = 12;
   for (let n = 0 ; n < N ; n++) {
      let theta = 2 * Math.PI * 2*(n>>1) / N;
      V.push([Math.cos(theta), Math.sin(theta), n&1 ? .5 : -.5]);
   }

   let state = 0, isDown = false, theta = .1, phi = .1, xPrev = 0, yPrev = 0;
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
   this.onUp = (x,y) => state = x < 0 ? Math.max(0, state-1)
                                      : Math.min(V.length+1, state+1);
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      this.turnY(theta);
      this.turnX(phi);

      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000040';
      this.scale(.5);
      for (let n = 0 ; n < V.length ; n += 2) {
         this.line(V[n  ], V[(n+2) % N]);
         this.line(V[n+1], V[(n+3) % N]);
      }

      ctx.strokeStyle = '#0000ff';
      ctx.fillStyle = '#0000ff20';
      this.dot(V[state%N], .028);
      if (state > 0)
         for (let n = 0 ; n < state ; n++) {
            this.line(V[n%N],V[(n+1)%N]);
	    if (n > 0)
               this.fillPolygon([V[(n-1)%N],V[n%N],V[(n+1)%N]]);
         }
   }
}

