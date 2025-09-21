function Diagram() {
   let wx = .3, wy = .7;
   let lx = -.7, ly = .7;
   let isDown = 0;
   this.onDown = (x,y) => { lx = 2*x-1; ly = 2*y + 1; isDown = 1; }
   this.onDrag = (x,y) => { lx = 2*x-1; ly = 2*y + 1; }
   this.onUp   = (x,y) => { isDown = 0; }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      this.move(0,-.6,0).scale(1.5);

      let ls = Math.sqrt(lx*lx+ly*ly);
      let L = [.5 * lx / ls, .5 * ly / ls];

      _.x = L[0];
      _.y = L[1];

      let ws = Math.sqrt(wx*wx+wy*wy);
      let W = [.5 * wx / ws, .5 * wy / ws];

      if (isDown) {
         ctx.strokeStyle = '#ff000050';
	 this.line(L, [0,2*L[1]]);
	 this.line(L, [0,L[1]]);
         ctx.strokeStyle = 'red';
	 this.line([0,L[1]],[0,2*L[1]], true);
	 this.line([0,2*L[1]],[-L[0],L[1]], true);
      }

      ctx.strokeStyle = 'blue';
      this.line([0,0], L, true);
      this.text('L', [L[0]-.05,L[1]]);
      this.arc([0,0], 40, Math.atan2(lx,ly)-Math.PI/2,-Math.PI/2);

      ctx.strokeStyle = 'gray';
      this.line([0,0], [-L[0],L[1]], true);
      this.text('R', [-L[0]+.06,L[1]]);
      this.arc([0,0], 40, Math.atan2(wx,wy)-Math.PI/2,
                          Math.atan2(-lx,ly)-Math.PI/2);

      ctx.strokeStyle = 'black';

      this.line([-.5,0],[.5,0]);
      this.line([0,0],[0,.5], true);
      this.text('N', [.06,.5]);

      this.line([0,0], W, true);
      this.text('-W', [W[0]+.03,W[1]+.06]);

      if (isDown) {
         ctx.strokeStyle = 'red';
	 this.dot([0,L[1]]);
      }
   }
}
