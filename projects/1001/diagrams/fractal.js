function Diagram() {
   let state = 0;
   this.onDrag = (x,y) => {
   }
   this.onUp = (x,y) => {
      if (x > 0)
         state = Math.min(state + 1, 16);
      else
         state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      let N = state >> 1;

      ctx.strokeStyle = 'black';
      this.curve(this.width, t => {
         let v = 0, f = 1;
         for (let i = 0 ; i < N ; i++) {
	    v += noise(5*f*t, .5, .5 + 100*f) / f * 2;
	    f *= 2;
         }
         return [ 2*t-1, -.3 + .3 * v ];
      });

      if (state & 1) {
         ctx.strokeStyle = '#808080';
         this.curve(this.width, t => {
            let f = 1 << N;
            return [ 2*t-1, .3 + noise(5*f*t, .5, .5 + 100*f) / f / 2 ];
         });
      }
   }
}
