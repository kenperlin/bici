function Diagram() {
   let state = 0, upTime;
   this.onUp = (x,y) => {
      state = x > 0 ? Math.min(3, state + 1)
                    : Math.max(0, state - 1);
      upTime = Date.now() / 1000;
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      ctx.strokeStyle = 'black';

      let nx, dx, px;

      switch (state) {
      case 0:
         ctx.font = '35px Helvetica';
         this.text('Transformations must', [0,.8]);
         this.text('preserve the relationship', [0,.65]);
         this.text('betw position and normal:', [0,.5]);

         ctx.font = '35px Helvetica';

	 nx =  .5;
	 dx =  .275;
	 px = -.2;

	 this.text('px', [nx, .1]);
	 this.text('py', [nx,-.1]);
	 this.text('pz', [nx,-.3]);
	 this.text('1' , [nx,-.5]);

	 this.dot([dx,-.2]);

	 this.text('nx ny nz 0', [px,-.2]);

	 this.drawRect([nx-.1,-.6],[nx+.1,.2]);
	 this.drawRect([px-.35,-.3],[px+.35,-.1]);

         break;

      case 1:
         let t = Date.now() / 1000 - upTime;
	 t = Math.min(1, t);
	 t = t * t * (3 - t - t);

         ctx.font = '35px Helvetica';
         this.text('Transformations must', [0,.8]);
         this.text('preserve the relationship', [0,.65]);
         this.text('betw position and normal:', [0,.5]);

         ctx.font = '35px Helvetica';

	 nx =  .5 + .2 * t;
	 dx =  .275;
	 px = -.2 - .27 * t;

	 this.text('px', [nx, .1]);
	 this.text('py', [nx,-.1]);
	 this.text('pz', [nx,-.3]);
	 this.text('1' , [nx,-.5]);

	 this.dot([dx,-.2]);

	 this.text('nx ny nz 0', [px,-.2]);

	 this.drawRect([nx-.1,-.6],[nx+.1,.2]);
	 this.drawRect([px-.35,-.3],[px+.35,-.1]);

         if (t == 1) {
            ctx.strokeStyle = 'blue';
            ctx.font = '45px Helvetica';
	    this.text('M', [dx-.28,-.23]);
	    this.text('M', [dx+.20,-.23]);
            ctx.font = '30px Helvetica';
	    this.text('-1', [dx-.15,-.12]);

	    this.drawRect([nx-.35,-.65],[nx+.15,.25]);
	    this.drawRect([px-.40,-.35],[px+.67,-.05]);
         }

	 break;

      case 2:
         ctx.font = '30px Courier';

         this.text('vec4 pos = vec4(aPos,1.);', [0,.5]);
         this.text('vec4 nor = vec4(aNor,0.);', [0,.3]);
         break;

      case 3:
         ctx.font = '30px Courier';

         this.text('vec4 pos = vec4(aPos,1.);', [0,.5]);
         this.text('vec4 nor = vec4(aNor,0.);', [0,.3]);

         this.text('pos = uMF * pos;', [0,-.1]);
         this.text('nor = nor * uMI;', [0,-.3]);
         break;
      }
   }
}
