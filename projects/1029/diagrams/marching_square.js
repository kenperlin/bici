function Diagram() {
   let state = 0, mx = 0, my = 0;
   this.onMove = (x,y) => { mx = x; my = y; }
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(2, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      this.fillRect([-1,-1],[1,1]);

      let N = state == 0 ? 7 : state == 1 ? 20 : 40;

      let f = (x,y) => .87 - (2*x*x + 2*y*y) + noise(2*x,2*y,0) * .5;

      ctx.fillStyle = 'black';
      for (let x = -1 ; x <= 1 ; x += .01)
      for (let y = -1 ; y <= 1 ; y += .01) {
         let t = f(x,y);
         if (t > 0) {
	    t = Math.max(0, 1 - t) / 200;
	    if (t > 0)
	       this.fillRect([x-t,y-t],[x+t,y+t]);
         }
      }
      ctx.fillStyle = 'white';

      let sign = (x,y) => {
         if (f(x,y) > 0) {
	    if (N > 10) {
	       let r = N < 30 ? .015 : .01;
               ctx.fillStyle = 'blue';
	       this.fillRect([x-r,y-r],[x+r,y+r]);
            }
            else {
               ctx.strokeStyle = 'blue';
               this.drawRect([x-.04 ,y-.04 ],[x+.04 ,y+.04 ]);
               this.fillRect([x-.032,y-.032],[x+.032,y+.032]);
               this.line([x-.015,y],[x+.015,y]);
               this.line([x,y-.015],[x,y+.015]);
            }
         }
	 else {
	    if (N > 10) {
	       let r = N < 30 ? .015 : .01;
               ctx.fillStyle = 'red';
	       this.fillRect([x-r,y-r],[x+r,y+r]);
            }
            else {
               ctx.strokeStyle = 'red';
               this.drawRect([x-.04 ,y-.04 ],[x+.04 ,y+.04 ]);
               this.fillRect([x-.032,y-.032],[x+.032,y+.032]);
               this.line([x-.015,y],[x+.015,y]);
	    }
	 }
      }

      ctx.font = '60px Helvetica';
      ctx.lineWidth = N < 10 ? 2 : N < 30 ? 1 : .5;
      ctx.strokeStyle = 'black';
      for (let n = 0 ; n <= N ; n++) {
         let t = -1 + 2*n/N;
         this.line([t,-1],[t,1]);
         this.line([-1,t],[1,t]);
      }

      let x = (N/2*(mx+1) >> 0) / (N/2) - 1;
      let y = (N/2*(my+1) >> 0) / (N/2) - 1;
      ctx.lineWidth = 6;
      this.drawRect([x,y],[x+2/N,y+2/N]);

      ctx.lineWidth = 2.5;
      for (let row = 0 ; row <= N ; row++)
      for (let col = 0 ; col <= N ; col++) {
         let x = -1 + 2*col/N;
         let y = -1 + 2*row/N;
	 sign(x, y);
      }
   }
}


