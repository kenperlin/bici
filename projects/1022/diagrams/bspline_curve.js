function Diagram() {
   let M = [[-1,3,-3,1],[3,-6,0,4],[-3,3,3,1],[1,0,0,0]];
   let dot = (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let P = -1, C = [-.5,.5,0,0];
   this.onDown = (x,y) => P = 2*x+2>>0;
   this.onDrag = (x,y) => C[P] = y;
   this.onUp   = (x,y) => P = -1;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#808080';
      this.line([-1,0],[1,0]);
      for (let x = -.5, p = 0 ; x < 1.01 ; x += .5, p++) {
         ctx.fillStyle = '#0000ff20';
	 this.fillRect([x-.5,-1],[x,C[p]]);
         ctx.strokeStyle = '#0000ff';
         this.line([x,-1],[x,1]);
	 this.text('P', [x-.27,.9]);
	 ctx.font = '20px Helvetica';
	 this.text(p+1, [x-(p<2?.22:.23),.85]);
	 ctx.font = '30px Helvetica';
	 this.text((100*C[p]>>0)/100, [x-.25,-.9]);
	 ctx.font = '40px Helvetica';
	 if (P==-1) {
            ctx.strokeStyle = colors[p];
	    for (let y = .6, q = 0 ; q < 4 ; y -= .4, q++)
	       this.text(M[p][q], [x-.25+.01*Math.sign(M[p][q]),y]);
	 }
	 else {
            ctx.strokeStyle = colors[p] + (P==p ? '' : '80');
	    for (let y = .6, q = 0 ; q < 4 ; y -= .4, q++)
	       if (P==p) {
	          this.text(M[p][q] + (q<3?'t':''), [x-.25+.01*Math.sign(M[p][q]),y]);
	          ctx.font = '30px Helvetica';
	          this.text(q==0 ? '3' : q==1 ? '2' : '', [x-.12,y+.05]);
	          ctx.font = '40px Helvetica';
               }
	       else
	          this.text(M[p][q], [x-.25+.01*Math.sign(M[p][q]),y]);
         }
	 ctx.font = '30px Helvetica';
      }
      if (P >= 0) {
         ctx.strokeStyle = colors[P];
         this.curve(50, t => [ 2*t-1, C[P] * T(M[P],t) / 6 ]);
      }
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      this.curve(50, t => [ 2*t-1, (C[0]*T(M[0],t)+C[1]*T(M[1],t)+C[2]*T(M[2],t)+C[3]*T(M[3],t))/6 ]);
      ctx.lineWidth = 3;
   }
}
