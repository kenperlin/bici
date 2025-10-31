function Diagram() {
   let state = 5, mx = .5;
   this.onDrag = (x,y) => mx = x;
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(6, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      let y = .2;

      let mb = r => {
         r = Math.abs(r);
         return .7*(r < 1/3 ? 1 - 3*r*r : r < 1 ? 1.5*(1-r)*(1-r) : 0);
      }
      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      if (state >= 2 && state < 5) {
         this.fillColor('#c0c0ff');
         this.fillRect([-1,y],[1,y+.1]);

         this.lineWidth(.004);
         this.drawColor('black');
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
         this.lineWidth(.008);
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
         this.drawColor('blue');
	 this.line([-1,-.4,],[1,-.4]);
      }

      if (state == 0) {
         this.drawColor('black');
         this.arc([ 0,-.4],.35);
         this.arc([mx,-.4],.35);
      }
      else {
         if (state >= 1 && state < 5) {
            this.fillColor('#ececff');
	    this.fillRect([-1,-1],[1,.2]);

            this.drawColor('#ceceec');
	    this.dot([ 0,-.4],.5);
	    this.dot([mx,-.4],.5);
         }

         this.fillColor('black');
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
	       if (state == 6) {
	          let t = 255 * f2 / (f1 + f2);
		  this.fillColor('rgb(' + (255-t >> 0) + ',0,' + (t >> 0) + ')');
	       }
	       this.fillRect([x-r,y-r],[x+r,y+r]);
            }
         }
      }

      if (state >= 2 && state < 5) {
         this.lineWidth(.004);
         this.drawColor('blue');
	 this.line([-1,-.4,],[1,-.4]);
      }

      this.font('30px Helvetica');
      this.drawColor('black');
      switch (state) {
      case 0: this.text("How do we blend shapes together?", [0,.75]); break;
      case 1: this.text("Think of them as islands in the sea.", [0,.75]); break;
      case 2: this.text("Let's look at one slice in profile.", [0,.75]); break;
      case 3: this.text("Instead of choosing the taller peak", [0,.75]); break;
      case 4: this.text("let's try summing their heights.", [0,.75]); break;
      case 5: this.text("We can use the different weights", [0,.75]); break;
      case 6: this.text("to blend various properties.", [0,.75]); break;
      }
   }
}

