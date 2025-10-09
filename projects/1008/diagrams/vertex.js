function Diagram() {
   let state = 0;
   this.onUp = (x,y) => {
      state = x > 0 ? Math.min(1, state + 1)
                    : Math.max(0, state - 1);
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      switch (state) {
      case 0:
         ctx.font = '45px Helvetica';
         this.text('3 numbers:', [0,.5]);

         ctx.font = '35px Courier';
         this.text('vec3 aPos: px,py,pz', [0,0]);

         ctx.font = '35px Helvetica';
         this.text('(12 bytes per vertex)', [0,-.6]);
	 break;

      case 1:
         ctx.font = '45px Helvetica';
         this.text('6 numbers:', [0,.5]);

         ctx.font = '35px Courier';
         this.text('vec3 aPos: px,py,pz', [0,0]);
         this.text('vec3 aNor: nx,ny,nz', [0,-.2]);

         ctx.font = '35px Helvetica';
         this.text('(24 bytes per vertex)', [0,-.6]);
      }
   }
}
