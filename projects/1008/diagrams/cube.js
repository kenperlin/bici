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
	    state = Math.min(state + 1, 12);
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

      this.scale(.5);
      switch (state) {
      case 12: triangle([-1,-1,-1],  [ 1,-1,-1],  [ 1, 1,-1]);
      case 11: triangle([ 1, 1,-1],  [-1, 1,-1],  [-1,-1,-1]);
      case 10: triangle([-1,-1, 1],  [ 1,-1, 1],  [ 1, 1, 1]);
      case  9: triangle([ 1, 1, 1],  [-1, 1, 1],  [-1,-1, 1]);

      case  8: triangle([-1,-1,-1],  [ 1,-1,-1],  [ 1,-1, 1]);
      case  7: triangle([ 1,-1, 1],  [-1,-1, 1],  [-1,-1,-1]);
      case  6: triangle([-1, 1,-1],  [ 1, 1,-1],  [ 1, 1, 1]);
      case  5: triangle([ 1, 1, 1],  [-1, 1, 1],  [-1, 1,-1]);

      case  4: triangle([-1,-1,-1],  [-1, 1,-1],  [-1, 1, 1]);
      case  3: triangle([-1, 1, 1],  [-1,-1, 1],  [-1,-1,-1]);
      case  2: triangle([ 1,-1,-1],  [ 1, 1,-1],  [ 1, 1, 1]);
      case  1: triangle([ 1, 1, 1],  [ 1,-1, 1],  [ 1,-1,-1]);
      }
   }
}
