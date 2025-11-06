function Diagram() {

/*
   state == 0
      Two ellipsoids

   state == 1
      Add equations of two ellipsoids

   state == 2
      Plot S and R

   state == 3
      Plot 1-R and S-R

   state == 4
      Plot (1-R) / (S-R)

   state == 5
      Plot max(0, (1-R) / (S-R))

   state == 6
      Plot max(0, (1-R) / (S-R)) ^ 2

   state == 7
      f0 + f1 + ... = 1

   state == 8
      Show blending of f0, f1, etc.
*/

   let state = 0;
   let a = .45, b = .25, r = .29, y = -.4, e = .005;

   this.onUp = (x,y) => {
      state = Math.max(0, Math.min(8, state + (x>0 ? 1 : -1)));
   }

   this.update = ctx => {
      this.font('30px Helvetica');

      this.fillColor('white').fillRect([-1,-1],[1,1]);

      let fraction = (d, a, x) => {
         this.move(d,0,0);
         this.font('20px Helvetica');
         this.text(x, [.12,.265]);
         this.text(a, [.12,.16]);
         this.text('2', [.25,.3]);
         this.line([.07,.2],[.17,.2]);
         this.font('30px Helvetica');
         this.move(-d,0,0);
      }

      if (state == 0 || state == 6) {
         this.drawColor(state == 0 ? '#000000' : 'ff0000');
	 let y = state == 0 ?  .8 : -.35;
	 let x = state == 0 ? -.6 : -.4;
	 if (state == 0) {
            this.text('WHAT WE WANT:'      , [-.8  ,y    ], 1);
            this.text('WHAT WE WANT:'      , [-.805,y    ], 1);
            this.dot([x-.07,y-.2 ],.025);
            this.dot([x-.07,y-.35],.025);
            this.dot([x-.07,y-.5 ],.025);
         }
         this.text('Value at S = 1'     , [x  ,y-.2 ], 1);
         this.text('Value at R = 0'     , [x  ,y-.35], 1);
         this.text('Derivative at R = 0', [x  ,y-.5 ], 1);
      }

      if (state <= 1) {
         this.drawColor('#0080ff');

         this.curve(30, t => {
            let theta = 2 * Math.PI * t;
            return [(a+r) * c(theta), (b+r) * s(theta) + y ];
         });
	 this.text('R', [.8,y]);

         if (state == 1) {
            this.line([e  ,y+.70],[a+r,y+.70]);
            this.line([e  ,y+.70],[e  ,y+.65]);
            this.line([a+r,y+.70],[a+r,y+.65]);

            this.text('a+r', [(a+r)/2,y+.65]);

            this.line([-a-r-.15,y+e  ],[-a-r-.15,y+b+r ]);
            this.line([-a-r-.15,y+e  ],[-a-r-.10,y+e  ]);
            this.line([-a-r-.15,y+b+r],[-a-r-.10,y+b+r]);

            this.text('b+r', [-a-r-.04,y+(b+r)/2]);
         }

         this.drawColor('black');
         this.curve(30, t => {
            let theta = 2 * Math.PI * t;
            return [a * c(theta), b * s(theta) + y ];
         });
	 this.text('S', [.37,y]);

         if (state == 1) {
            this.line([-e,y+.70],[-a,y+.70]);
            this.line([-e,y+.70],[-e,y+.65]);
            this.line([-a,y+.70],[-a,y+.65]);

            this.text('a', [-a/2,y+.65]);

            this.line([-a-r-.15,y-e],[-a-r-.15,y-b ]);
            this.line([-a-r-.15,y-e],[-a-r-.10,y-e]);
            this.line([-a-r-.15,y-b],[-a-r-.10,y-b]);

            this.text('b', [-a-r-.10,y-b/2]);
         }
      }

      if (state == 1 || state == 2) {
         this.drawColor('#0080ff');
         this.move(.5,.6,0);
         this.text('R = (     ) + (     )', [0,.2]);
         fraction(-.198, 'a+r', 'x');
         fraction( .190, 'b+r', 'y');
         this.move(-.5,-.6,0);

         this.drawColor('#000000');
         this.move(-.55,.6,0);
         this.text('S = (    ) + (    )', [0,.2]);
         fraction(-.182, 'a', 'x');
         fraction( .163, 'b', 'y');
         this.move(.55,-.6,0);
      }

      if (state >= 2 && state <= 6) {
         let y1 = state == 2 ? .57 : state == 3 ? .62 : 1;

         this.drawColor('#00000080');
         this.line([-a,-1],[-a,y1]);
         this.line([ a,-1],[ a,y1]);

         this.drawColor('#0080ff80');
         this.line([-a-r,-1],[-a-r,y1]);
         this.line([ a+r,-1],[ a+r,y1]);

         this.drawColor('#a0a0a0');
	 this.text('0', [-.95,y]);
	 this.text('1', [-.95,y+.5]);
         this.line([-.87,y],[.9,y]);
         this.line([-.87,y+.5],[.9,y+.5]);

         switch (state) {
	 case 2:
            this.drawColor('#0080ff');
            this.curve(30, t => {
               let R = 3 * (t-.5);
	       R = .33 * R * R;
               return [.9 * (2*t-1), y + R];
            });
	    this.text('R', [.58,y+.2]);

            this.drawColor('black');
            this.curve(30, t => {
	       t = Math.max(.15, Math.min(.85, t));
               let S = 3 * (t-.5);
	       S = .88 * S * S;
               return [.9 * (2*t-1), y + S];
            });
	    this.text('S', [.2,y+.2]);
	    break;

         case 3:
            this.drawColor('#0080ff');
            this.curve(30, t => {
               let R = 3 * (t-.5);
	       let I_R = .5 - .33 * R * R;
               return [.9 * (2*t-1), y + I_R];
            });
	    this.text('1-R', [0,y+.6]);

	    this.font('20px Helvetica');
	    this.text('R=1', [ a+r,.7]);
	    this.text('R=1', [-a-r,.7]);
	    this.font('30px Helvetica');

            this.drawColor('black');
            this.curve(30, t => {
               let S = 3 * (t-.5);
	       S = .88 * S * S;
               let R = 3 * (t-.5);
	       R = .33 * R * R;
               return [.9 * (2*t-1), y + S-R];
            });
	    this.text('S-R', [0,y-.1]);

	    this.font('20px Helvetica');
	    this.text('S=1', [ a,.7]);
	    this.text('S=1', [-a,.7]);
	    this.font('30px Helvetica');

	    break;
        }
     }

     if (state >= 4 && state <= 6) {
         this.drawColor('red');
         this.text('1 - R', [0,.5]);
         this.line([-.15,.4],[.15,.4]);
         this.text('S - R', [0,.3]);
	 if (state >= 5) {
            this.curve(20, t => [-.1-.1*c(2*t-1), .25+.3*t]);
            this.curve(20, t => [ .1+.1*c(2*t-1), .25+.3*t]);
	    this.font('20px Helvetica');
	    this.text('max 0', [.3,.26]);
	    this.font('30px Helvetica');
         }
	 if (state >= 6) {
            this.text('2', [.25,.55]);
            this.text('f =', [-.32,.4]);
         }

         this.curve(100, t => {
            let S = 3 * (t-.5);
	    S = .5 - .89 * S * S;
            let R = 3 * (t-.5);
	    R = .5 - .33 * R * R;
            let f = R / (R - S);
	    if (state >= 5)
               f = Math.max(0, f);
            return [.9 * (2*t-1), y + .5 * (state<6 ? f : f * f)];
         });
      }

      if (state >= 7) {
         this.drawColor('black');
         this.font('40px Helvetica');
         this.text('f  + f  + ... = 1', [0,0]);
         this.font('30px Helvetica');
         this.text('0      1', [-.26,-.06]);
      }
   }
}
