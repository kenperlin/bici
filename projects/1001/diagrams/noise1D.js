function Diagram() {
   let state = 0;
   let N = 8, R = [], T = 1, isDown = false;
   for (let n = 0 ; n <= N ; n++)
      R.push(Math.sin(1000 * Math.sin(1000 * n)));
   this.onDown = (x,y) => isDown = true;
   this.onDrag = (x,y) => {
      if (state == 6)
         T = x;
   }
   this.onUp = (x,y) => {
      isDown = false;
      if (state < 6)
         if (x > 0)
            state = Math.min(state + 1, 6);
         else
            state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#808080';
      this.line([-.9,0],[.9,0]);
      let s = t => t * t * (3 - t - t);
      let e = .05;
      switch (state) {
      case 6:
         ctx.strokeStyle = 'black';
	 this.curve(20, t => {
	    t = 2 * t - 1;
	    let w = t > 0 ? s(1-t) : s(1+t);
	    return [ .9 * t, .7 * w * t * T ];
	 });
	 if (isDown) {
            ctx.strokeStyle = 'red';
	    this.line([-.9,-.7*T],[.9,.7*T]);
         }
	 break;
      case 5:
         ctx.strokeStyle = 'red';
	 this.line([-.9,-.7],[.9,.7]);
      case 4:
         ctx.strokeStyle = 'black';
	 this.curve(20, t => {
	    t = 2 * t - 1;
	    let w = t > 0 ? s(1-t) : s(1+t);
	    return [ .9 * t, .7 * w ];
	 });
         break;
      case 3:
         ctx.strokeStyle = 'black';
         for (let n = 0 ; n < N ; n++) {
	    let x0 = .9 * (2 * ( n   /N) - 1);
	    let x1 = .9 * (2 * ((n+1)/N) - 1);
	    this.curve(10, t => {
	       let x = x0 + t * (x1 - x0);
	       let a = .2 *  t    * R[n];
	       let b = .2 * (t-1) * R[n+1];
	       return [ x, a * s(1-t) + b * s(t) ];
	    });
	 }
      case 2:
         ctx.strokeStyle = 'blue';
         for (let n = 0 ; n < N ; n++) {
	    let x = .9 * (2 * (n/N) - 1);
	    this.line([x-e, -e*R[n]], [x+e, e*R[n]]);
	 }
      case 1:
         ctx.strokeStyle = 'red';
         for (let n = 0 ; n < N ; n++) {
	    let x = .9 * (2 * (n/N) - 1);
	    this.line([x,0],[x,.2 * R[n]]);
	 }
         break;
      }
   }
}
