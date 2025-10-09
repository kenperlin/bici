// GLUING MESHES
function Diagram() {
   let state = 0, upTime, N = 5;
   this.onUp = (x,y) => {
      state = x > 0 ? Math.min(2, state + 1)
                    : Math.max(0, state - 1);
      upTime = Date.now() / 1000;
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      let drawVertex = (A,s,x,y) => {
         this.drawRect([x-.1,y-.16],[x+.1,y+.1]);
	 if (s == '...') {
            ctx.font = '30px Helvetica';
            this.text(s, [x,y]);
         }
         else {
            ctx.font = '27px Helvetica';
            this.text(A, [x-.03,y]);
            ctx.font = '20px Helvetica';
            this.text('' + s, [x+.04,y-.07]);
         }
      }

      this.scale(.8);

      switch (state) {

      case 2:

      ctx.strokeStyle = 'blue';
      this.line([-.1,-1.1],[-.1,-.85],1);

      ctx.strokeStyle = 'green';
      this.line([.1,-1.1],[.1,-.85],1);

      case 1:

      ctx.font = '33px Helvetica';
      ctx.strokeStyle = 'black';
      this.text('Gluing two triangle strip meshes', [0,-.2]);

      ctx.strokeStyle = 'blue';
      for (let n = 0 ; n <= N ; n++)
         drawVertex('A', n<3 ? n : n<N-1 ? '...' : 'n', -1.1+.2*n,-.6);

      ctx.strokeStyle = 'green';
      for (let n = 0 ; n <= N ; n++)
         drawVertex('B', n<3 ? Math.max(0,n-1) : n<N ? '...' : 'n', .1+.2*n,-.6);

      case 0:

      ctx.font = '33px Helvetica';
      ctx.strokeStyle = 'black';
      this.text('Gluing two triangles meshes', [0,.8]);

      ctx.strokeStyle = 'blue';
      for (let n = 0 ; n < N ; n++)
         drawVertex('A', n<3 ? n : n<N-1 ? '...' : 'n', -.9+.2*n,.4);

      ctx.strokeStyle = 'green';
      for (let n = 0 ; n < N ; n++)
         drawVertex('B', n<3 ? n : n<N-1 ? '...' : 'n', .1+.2*n,.4);
      }
   }
}
