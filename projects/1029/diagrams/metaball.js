function Diagram() {
   let state = 0, mx = 0;
   this.onDrag = (x,y) => mx = x;
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(5, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      let y = .2;

      let mb = r => {
         r = Math.abs(r);
         return .7*(r < 1/3 ? 1 - 3*r*r : r < 1 ? 1.5*(1-r)*(1-r) : 0);
      }
      ctx.fillStyle = 'white';
      this.fillRect([-1,-1],[1,1]);

      if (state >= 2 && state < 5) {
         ctx.fillStyle = '#c0c0ff';
         this.fillRect([-1,y],[1,y+.1]);
      }

      if (state >= 3 && state < 5) {
         ctx.lineWidth = 1;
         ctx.strokeStyle = 'black';
         this.curve(40, t => {
            t = 2 * t - 1;
            return [t, y+mb(2*t)/2];
         });
         this.curve(40, t => {
            t = 2 * t - 1;
            return [t, y+mb(2*(t-mx))/2];
         });
      }

      let f = t => y+mb(2*t)/2+mb(2*(t-mx))/2;

      if (state >= 4 && state < 5) {
         ctx.lineWidth = 2;
         this.curve(40, t => {
            t = 2 * t - 1;
            return [t, f(t)];
         });
      }

      if (state >= 4 && state < 5) {
         for (let x = -1 ; x <= 1 ; x += 1/100) {
            let a = f(x-.01) < y+.1;
            let b = f(x+.01) < y+.1;
	    if (a != b)
	       this.dot([x,y+.1],.02);
         }
      }

      if (state >= 2 && state < 5) {
         ctx.strokeStyle = 'blue';
	 this.line([-1,-.4,],[1,-.4]);
      }

      if (state == 0) {
         ctx.strokeStyle = 'black';
         this.arc([ 0,-.4],.35);
         this.arc([mx,-.4],.35);
      }
      else {
         if (state >= 1 && state < 5) {
            ctx.fillStyle = '#ececff';
	    this.fillRect([-1,-1],[1,.2]);

            ctx.strokeStyle = '#ceceec';
	    this.dot([ 0,-.4],.5);
	    this.dot([mx,-.4],.5);
         }

         ctx.fillStyle = 'black';
         for (let x = -1 ; x <  1 ; x += 1/200)
         for (let y = -1 ; y < .1 ; y += 1/200) {
            let x1 = x;
            let x2 = x - mx;
            let y1 = y + .4;
            let y2 = y + .4;
	    let f1 = mb(2.27 * Math.sqrt(x1*x1 + y1*y1));
	    let f2 = mb(2.27 * Math.sqrt(x2*x2 + y2*y2));
	    let f = state < 4 ? Math.max(f1,f2) : f1 + f2;
	    if (f > .1) {
	       let r = .01 * (1.3 - f);
	       r = 20 * r * r;
	       this.fillRect([x-r,y-r],[x+r,y+r]);
            }
         }
      }

      if (state >= 2 && state < 5) {
         ctx.lineWidth = 1;
         ctx.strokeStyle = 'blue';
	 this.line([-1,-.4,],[1,-.4]);
      }

      ctx.font = '30px Helvetica';
      ctx.strokeStyle = 'black';
      switch (state) {
      case 0: this.text("Let's blend two shapes together.", [0,.75]); break;
      case 1: this.text("Think of them as islands in the sea.", [0,.75]); break;
      case 2: this.text("Let's look at one slice in profile.", [0,.75]); break;
      case 3: this.text("Instead of choosing the taller peak", [0,.75]); break;
      case 4: this.text("let's try summing their heights.", [0,.75]); break;
      case 5: this.text("The blended shape is the boundary.", [0,.75]); break;
      }
   }
}

