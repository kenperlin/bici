function Diagram() {
   let state = 0, x = .8, a = -.4, b = .3;
   this.onDrag = (x,y) => {
      if (x > 0)
         b = y;
      else
         a = y;
   }
   this.onUp = (x,y) => {
      if (y > .5 && x*x < .25)
         state = Math.max(0, Math.min(2, state + (x>0 ? 1 : -1)));
   }
   this.update = ctx => {
      this.font('30px Helvetica');
      this.fillColor('white').fillRect([-1,-1],[1,1]);

      let t = -a / (b-a);
      let tx = 2*x*t-x;

      if (state >= 1) {
         this.fillColor('#a0a0a0');
	 this.fillRect([tx-.05,a],[tx+.05,0]);
	 this.fillRect([.75,a],[.85,b]);
      }

      this.drawColor('black');
      if (t >= 0 && t <= 1) {
         this.dot([tx,0],.04);
         this.text('t', [tx,-.1]);
      }
      this.path([[-x,a],[-x,0],[x,0],[x,b],[-x,a]]);
      this.dot([-x,a],.05).drawColor('white').dot([-x,a],.04).drawColor('black');;
      this.dot([ x,b],.05).drawColor('white').dot([ x,b],.04).drawColor('black');;
      this.font('30px Helvetica');
      this.text('a', [-x-.1,a/2]);
      this.text('b', [ x+.1,b/2]);
      this.text('0', [-x + (a>0 ? 0 : .07), -.1]);
      this.text('1', [ x - (b>0 ? 0 : .07), -.1]);
      if (state == 2) {
         this.font('40px Helvetica');
         this.text('t = -a / (b-a)', [0,.7]);
      }
   }
}
