function Diagram() {
   let state = 0, mx = 0, my = 0;
   this.onMove = (x,y) => { mx = x; my = y; }
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(4, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      this.fillRect([-1,-1],[1,1]);

      let sign = (x,y,pos) => {
         if (pos) {
            ctx.strokeStyle = 'blue';
            this.drawRect([x-.04 ,y-.04 ],[x+.04 ,y+.04 ]);
            this.fillRect([x-.032,y-.032],[x+.032,y+.032]);
            this.line([x-.015,y],[x+.015,y]);
            this.line([x,y-.015],[x,y+.015]);
         }
	 else {
            ctx.strokeStyle = 'red';
            this.drawRect([x-.04 ,y-.04 ],[x+.04 ,y+.04 ]);
            this.fillRect([x-.032,y-.032],[x+.032,y+.032]);
            this.line([x-.015,y],[x+.015,y]);
	 }
      }

      ctx.font = '60px Helvetica';
      for (let row = 0 ; row < 4 ; row++)
      for (let col = 0 ; col < 4 ; col++) {

         let x = -.72 + .48*col;
         let y = -.72 + .48*row;
	 let x0 = x-1/6, y0 = y-1/6;
	 let x1 = x+1/6, y1 = y+1/6;

	 let highlight = x0<mx && x1>mx && y0<my&& y1>my;

         ctx.lineWidth = highlight ? 4 : 2;
         ctx.strokeStyle = 'black';
         this.drawRect([x0,y0], [x1,y1]);
         ctx.lineWidth = 2.5;
	 sign(x0, y0, col & 1);
	 sign(x1, y0, col & 2);
	 sign(x0, y1, row & 1);
	 sign(x1, y1, row & 2);

	 let s = ((col&1)>0?1:0)
	       + ((col&2)>0?2:0)
	       + ((row&1)>0?4:0)
	       + ((row&2)>0?8:0);

         if (state >= 1) {
            ctx.strokeStyle = '#00000080';
	    let hex = '0123456789abcdef'.charAt(4 * row + col);
	    this.text(hex, [x0+.16,y0+.12]);
         }

	 if (state < 2)
	    continue;

	 if (s >= 8)
	    s = 15 - s;

	 let edge = e => {
	    switch (e) {
	    case 'x0': return [x0,(y0+y1)/2];
	    case 'x1': return [x1,(y0+y1)/2];
	    case 'y0': return [(x0+x1)/2,y0];
	    case 'y1': return [(x0+x1)/2,y1];
	    }
	 }
	 let connect = (a,b) => {
	    let ea = edge(a);
	    let eb = edge(b);
	    this.line(ea, eb);
	    if (highlight) {
	       this.dot(ea, .03);
	       this.dot(eb, .03);
	    }
         }

         ctx.strokeStyle = 'black';
	 ctx.lineWidth = highlight ? 6 : 2;
	 switch (s) {
	 case 1    : connect('x0','y0'); break;
	 case 2    : connect('x1','y0'); break;
	 case 1+2  : connect('x0','x1'); break;
	 case     4: connect('x0','y1'); break;
	 case 1 + 4: connect('y0','y1'); break;
	 case   2+4: connect('x0','y0');
	             connect('x1','y1'); break;
	 case 1+2+4: connect('x1','y1'); break;
	 }
      }
   }
}


