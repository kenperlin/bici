function Diagram() {
   let state = 0, mx = 0, my = 0;
   this.onDrag = (x,y) => { mx = x; my = y; }
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(4, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      let d = state < 4 ? .1 : .1/4;

      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      if (state < 3) {
         this.drawColor('#c0c0c0');
         this.dot([ 0, 0],.5);
         this.dot([mx,my],.5);
      }

      this.lineWidth(state < 4 ? .012 : .004);
      this.drawColor('#0080ff80');
      for (let x = -1 ; x < 1 ; x += d)
         this.line([x,-1],[x,1]);
      for (let y = -1 ; y < 1 ; y += d)
         this.line([-1,y],[1,y]);

      let mb = r => {
         r = Math.abs(r);
         return .7*(r < 1/3 ? 1 - 3*r*r : r < 1 ? 1.5*(1-r)*(1-r) : 0);
      }

      let fxy = (x,y) => {
         let x1 = x;
         let x2 = x - mx;
         let y1 = y;
         let y2 = y - my;
	 let f1 = mb(2.27 * Math.sqrt(x1*x1 + y1*y1));
	 let f2 = mb(2.27 * Math.sqrt(x2*x2 + y2*y2));
	 return f1 + f2 - .1;
      }

      this.drawColor('black');
      if (state < 3) {
         this.fillColor('#00000080');
         for (let x = -1 ; x < 1 ; x += 1/200)
         for (let y = -1 ; y < 1 ; y += 1/200) {
	    let f = fxy(x,y);
	    if (f > 0) {
	       let r = .01 * (1.3 - f);
	       r = 20 * r * r;
	       this.fillRect([x-r,y-r],[x+r,y+r]);
            }
         }
      }

      if (state < 1)
         return;

      this.lineWidth(.024);
      this.font('20px Courier');
      for (let x0 = -1 ; x0 < 1 ; x0 += d)
      for (let y0 = -1 ; y0 < 1 ; y0 += d) {
         let x1 = x0 + d;
         let y1 = y0 + d;
	 let f00 = fxy(x0,y0);
	 let f10 = fxy(x1,y0);
	 let f01 = fxy(x0,y1);
	 let f11 = fxy(x1,y1);
	 let s = (f00>0) + ((f10>0)<<1) + ((f01>0)<<2) + ((f11>0)<<3);
	 let hex = '0123456789abcdef'.charAt(s);

         if (state < 2) {
            this.drawColor('#000080');
	    this.text(hex, [x0+.05,y0+.065]);
	    continue;
         }

	 let I = (t0,t1,f0,f1) => t0 - (t1-t0) * f0 / (f1-f0);

	 let edge = e => {
	    switch (e) {
	    case 'x0': return [x0,I(y0,y1,f00,f01)];
	    case 'x1': return [x1,I(y0,y1,f10,f11)];
	    case 'y0': return [I(x0,x1,f00,f10),y0];
	    case 'y1': return [I(x0,x1,f01,f11),y1];
	    }
	 }

	 let connect = (a,b) => this.line(edge(a), edge(b));

	 if (s >= 8)
	    s = 15 - s;

         this.drawColor('black');
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

