// BUILDING AN OCTAHEDRON
function Diagram() {
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
   this.onUp = (x,y) => {
      isDown = false;
      if (y > .5)
         if (x > 0)
	    state = Math.min(state + 1, 8);
         else
            state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      this.turnY(theta);
      this.turnX(phi);

      ctx.strokeStyle = '#808080';
      this.line([-.9,0,0],[.9,0,0],1);
      this.line([0,-.9,0],[0,.9,0],1);
      this.line([0,0,-.9],[0,0,.9],1);
      this.text('X', [.9,.1,0]);
      this.text('Y', [.1,.9,0]);
      this.text('Z', [.1,0,.9]);

      ctx.fillStyle = '#0000ff20';
      ctx.strokeStyle = '#0000ff';

      let triangle = (a,b,c) => {
         this.fillPolygon([a,b,c]);
         this.line(a,b).line(b,c).line(c,a);
      }

      switch (state) {
      case 8: triangle([-.5,0,0],[0,-.5,0],[0,0,-.5]);
      case 7: triangle([ .5,0,0],[0,-.5,0],[0,0,-.5]);
      case 6: triangle([-.5,0,0],[0, .5,0],[0,0,-.5]);
      case 5: triangle([ .5,0,0],[0, .5,0],[0,0,-.5]);
      case 4: triangle([-.5,0,0],[0,-.5,0],[0,0, .5]);
      case 3: triangle([ .5,0,0],[0,-.5,0],[0,0, .5]);
      case 2: triangle([-.5,0,0],[0, .5,0],[0,0, .5]);
      case 1: triangle([ .5,0,0],[0, .5,0],[0,0, .5]);
      }
      if (state == 1) {
         let font = ctx.font;
         ctx.font = '20px Helvetica';
	 this.text('[1,0,0]', [.62,.10,0]);
	 this.text('[0,1,0]', [0,.57,0]);
	 this.text('[0,0,1]', [-.15,0,.5]);
	 ctx.font = font;
      }
   }
}
