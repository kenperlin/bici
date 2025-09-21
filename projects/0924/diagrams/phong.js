function Diagram() {
   let wx = .3, wy = .7;
   let lx = -.5, ly = .5;
   let isDown = 0;
   this.onDown = (x,y) => { lx = 2*x-1; ly = y + 1; isDown = 1; }
   this.onDrag = (x,y) => { lx = 2*x-1; ly = y + 1; }
   this.onUp   = (x,y) => { isDown = 0; }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      this.move(0,-.65,0).scale(1.5);

      let ls = Math.sqrt(lx*lx+ly*ly);
      let L = [.5 * lx / ls, .5 * ly / ls];

      let ws = Math.sqrt(wx*wx+wy*wy);
      let W = [.5 * wx / ws, .5 * wy / ws];

      if (isDown) {
         ctx.strokeStyle = 'red';
	 this.line([0,L[1]],[0,2*L[1]], true);
	 this.line(L, [0,L[1]]);
	 this.line([0,2*L[1]],[-L[0],L[1]], true);
      }

      ctx.strokeStyle = 'black';

      this.line([-.5,0],[.5,0]);
      this.line([0,0],[0,.5], true);
      this.text('N', [.06,.5]);

      this.line([0,0], L, true);
      this.text('L', [L[0]-.05,L[1]]);

      this.line([0,0], W, true);
      this.text('-W', [W[0]+.03,W[1]+.06]);

      ctx.strokeStyle = 'blue';

      this.line([0,0], [-L[0],L[1]], true);
      this.text('R', [-L[0]+.06,L[1]]);

      if (isDown) {
         ctx.strokeStyle = 'red';
	 this.dot([0,L[1]]);
      }
   }
}
