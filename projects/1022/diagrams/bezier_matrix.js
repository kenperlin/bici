function Diagram() {
   let state = 5;
   this.onUp = (x,y) => state = Math.max(0,Math.min(6, x < 0 ? state-1 : state+1));
   let M = [[-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0]];
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = 'black';

      switch (state) {
      case 0:
         this.text('a t + b t + c t + d', [0,0]);
         this.text('3    2', [-.15,.1]);
	 break;
      case 1:
         this.text('t    t    t   1', [-.2,0]);
         this.text('3   2', [-.32,.1]);
	 this.dot([.2,0]);
         for (let row = 0 ; row < 4 ; row++)
            this.text('abcd'.charAt(row), [.4,(1.5-row)/6]);
	 break;
      case 2:
         this.move(.1,0,0);
         for (let row = 0 ; row < 4 ; row++)
            this.text('abcd'.charAt(row), [-.7,(1.5-row)/6]);
	 this.text('MATRIX', [0,0]);
	 this.drawRect([-.35,0-.35],[+.35,0+.35]);
	 this.line([-.4,0],[-.6,0],1);
         for (let row = 0 ; row < 4 ; row++)
            this.text('ABCD'.charAt(row), [+.5,(1.5-row)/6]);
	 break;
      case 3:
         this.text('t    t    t   1', [-.2-.4,0]);
         this.text('3   2', [-.32-.4,.1]);
	 this.dot([-.2,0]);
	 this.text('MATRIX', [.3,0]);
	 this.drawRect([.3-.35,0-.35],[.3+.35,0+.35]);
         for (let row = 0 ; row < 4 ; row++)
            this.text('ABCD'.charAt(row), [.4+.4,(1.5-row)/6]);
	 break;
      case 4:
         this.text('t    t    t   1', [-.2-.4,0]);
         this.text('3   2', [-.32-.4,.1]);
	 this.dot([-.2,0]);
	 this.drawRect([.3-.35,0-.35],[.3+.35,0+.35]);
         for (let row = 0 ; row < 4 ; row++) {
            this.text('P', [.4-.03+.4,(1.58-row)/5]);
	    ctx.font = '20px Helvetica';
            this.text('1234'.charAt(row), [.45-.03+.4,(1.58-row)/5-.05]);
	    ctx.font = '30px Helvetica';
         }
         ctx.strokeStyle = '#ff0000a0';
	 ctx.font = '100px Helvetica';
	 this.text('?', [.3,-.1]);
	 ctx.font = '30px Helvetica';
	 break;
      case 6:
         for (let p = 0 ; p < 4 ; p++) {
	    let x = (p-1.5)/2;
	    let y = -.7;
            ctx.strokeStyle = '#00000080';
	    this.line([x-.2,y-.2],[x+.2,y-.2]);
	    this.line([x-.2,y-.2],[x-.2,y+.2]);
            ctx.strokeStyle = colors[p];
	    let m = M[p];
	    this.curve(20, t => [x-.2+.4*t, y-.2 + .4*(m[0]*t*t*t+m[1]*t*t+m[2]*t+m[3])]);
	 }
         ctx.strokeStyle = 'black';
      case 5:
         this.text('t    t    t   1', [-.2-.4,0]);
         this.text('3   2', [-.32-.4,.1]);
	 this.dot([-.2,0]);
	 this.drawRect([.3-.35,0-.35],[.3+.35,0+.35]);
         for (let row = 0 ; row < 4 ; row++) {
            this.text('P', [.4-.03+.4,(1.58-row)/5]);
	    ctx.font = '20px Helvetica';
            this.text('0234'.charAt(row), [.45-.03+.4,(1.58-row)/5-.05]);
	    ctx.font = '30px Helvetica';
         }
	 for (let col = 0 ; col < 4 ; col++) {
	    ctx.strokeStyle = colors[col];
	    for (let row = 0 ; row < 4 ; row++)
	       this.text(M[col][row], [.3+.17*(col-1.5),.17*(1.5-row)]);
         }
	 ctx.strokeStyle = 'black';
	 this.text('BEZIER MATRIX', [0,.8]);
	 break;
      }
   }
}

