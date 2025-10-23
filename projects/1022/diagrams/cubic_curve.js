function Diagram() {
   let P = -1, C = [.5,-.5,.5,-.5];
   let I = x => 4 * (.5-x*.5) >> 0;
   this.onDown = (x,y) => { flag = true; C[P = I(x)] = y; }
   this.onDrag = (x,y) => C[P] = y;
   this.onUp   = (x,y) => P = -1;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#808080';
      this.line([-1,0],[1,0]);
      ctx.strokeStyle = '#0000ff';
      for (let x = 1, p = 0 ; x > -.9 ; x -= .5, p++) {

         ctx.fillStyle = '#0000ff20';
         this.fillRect([x-.5,-1],[x,C[p]]);
         ctx.strokeStyle = '#0000ff';

         this.line([x,-1],[x,1]);
	 this.text(p, [x-.24,.9]);
	 this.text('t', [x-.30,.85]);
	 this.text((100*C[p]>>0)/100, [x-.25,-.9]);
      }
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      this.curve(50, t => [ 2*t-1, C[3]*t*t*t + C[2]*t*t + C[1]*t + C[0] ]);
      ctx.lineWidth = 3;
      if (P >= 0) {
         ctx.strokeStyle = '#ff000080';
         this.curve(50, t => [ 2*t-1, P==3 ? C[3]*t*t*t :
	                              P==2 ? C[2]*t*t :
				      P==1 ? C[1]*t : C[0] ]);
      }
   }
}
