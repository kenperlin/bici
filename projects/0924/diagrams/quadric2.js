function Diagram() {
   let state = 0;
   this.onDown = (x,y) => { }
   this.onUp = (x,y) => {
      if (x > 0)
         state = Math.min(7, state + 1);
      else
         state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      let showEquation = () => {
         ctx.font = '20px Courier';
         this.text('2                      2', [-.22,.90]);
         ctx.font = '29px Courier';
         this.text('Ax + Bxy + Cx + Dy + Ey + F', [0,.85]);
      }

      switch (state) {
      case 0:
         showEquation();
         break;

      case 1:
         showEquation();

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         A  B  C        ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('         0  D  E        ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0  F        ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

	 break;

      case 2:
         ctx.strokeStyle = '#00000080';
         showEquation();
         ctx.strokeStyle = 'black';
         ctx.font = '20px Courier';
         this.text('2                      2', [-.22,.75]);
         ctx.font = '29px Courier';
         this.text(' x       +       y    -   1', [0,.7]);

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         1  0  0    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1    0  1  0    y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0 -1    1   ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

         ctx.strokeStyle = '#a0a0a0';
	 this.line([-.9,-.7],[-.1,-.7], true);
	 this.line([-.5,-1.1],[-.5,-.3], true);

         ctx.strokeStyle = 'black';
	 this.text('Circle', [.4,-.7]);
	 this.curve(50, t => [ .25 * Math.cos(2*Math.PI*t) - .5,
	                       .25 * Math.sin(2*Math.PI*t) - .7]);

	 break;

      case 3:
         ctx.strokeStyle = '#00000080';
         showEquation();
         ctx.strokeStyle = 'black';
         ctx.font = '20px Courier';
         this.text('2                      2', [-.22,.75]);
         ctx.font = '29px Courier';
         this.text(' x      +       2y    -   1', [0,.7]);

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         1  0  0    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1    0  2  0    y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0 -1    1   ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

         ctx.strokeStyle = '#a0a0a0';
	 this.line([-.9,-.7],[-.1,-.7], true);
	 this.line([-.5,-1.1],[-.5,-.3], true);

         ctx.strokeStyle = 'black';
	 this.text('Ellipse', [.4,-.7]);
	 this.curve(50, t => [ .25  * Math.cos(2*Math.PI*t) - .5,
	                       .125 * Math.sin(2*Math.PI*t) - .7]);

	 break;

      case 4:
         ctx.strokeStyle = '#00000080';
         showEquation();
         ctx.strokeStyle = 'black';
         ctx.font = '20px Courier';
         this.text('2                       ', [-.22,.75]);
         ctx.font = '29px Courier';
         this.text(' x          -         y    ', [0,.7]);

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         1  0  0    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1    0  0 -1    y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0  0    1   ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

         ctx.strokeStyle = '#a0a0a0';
	 this.line([-.9,-.7],[-.1,-.7], true);
	 this.line([-.5,-1.1],[-.5,-.3], true);

         ctx.strokeStyle = 'black';
	 this.text('Parabola', [.4,-.7]);
	 this.curve(50, t => [ .25 * (2*t-1) - .5,
	                       .25 * (2*t-1)*(2*t-1) - .7]);

	 break;

      case 5:
         ctx.strokeStyle = '#00000080';
         showEquation();
         ctx.strokeStyle = 'black';
         ctx.font = '20px Courier';
         this.text('2                       ', [-.22,.75]);
         ctx.font = '29px Courier';
         this.text(' x       -       y    -   1', [0,.7]);

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         1  0  0    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1    0 -1  0    y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0 -1    1   ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

         ctx.strokeStyle = '#a0a0a0';
	 this.line([-.9,-.7],[-.1,-.7], true);
	 this.line([-.5,-1.1],[-.5,-.3], true);

         ctx.strokeStyle = 'black';
	 this.text('Hyperbola', [.4,-.7]);
	 this.curve(50, t => [ .25 / Math.cos(1.5*t-.75) - .5,
	                       .25 * Math.tan(1.5*t-.75) - .7]);
	 this.curve(50, t => [-.25 / Math.cos(1.5*t-.75) - .5,
	                       .25 * Math.tan(1.5*t-.75) - .7]);
	 break;

      case 6:
         ctx.strokeStyle = '#00000080';
         showEquation();
         ctx.strokeStyle = 'black';
         ctx.font = '20px Courier';
         this.text('                        ', [-.22,.75]);
         ctx.font = '29px Courier';
         this.text('            x    -    y    ', [0,.7]);

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         0  0  1    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1    0  0 -1    y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0  0    1   ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

         ctx.strokeStyle = '#a0a0a0';
	 this.line([-.9,-.7],[-.1,-.7], true);
	 this.line([-.5,-1.1],[-.5,-.3], true);

         ctx.strokeStyle = 'black';
	 this.text('Line', [.4,-.7]);
	 this.curve(50, t => [ .25 * (2*t-1) - .5,
	                       .25 * (2*t-1) - .7]);

	 break;

      case 7:
         ctx.strokeStyle = '#00000080';
         showEquation();
         ctx.strokeStyle = 'black';
         ctx.font = '20px Courier';
         this.text('2                       ', [-.22,.75]);
         ctx.font = '29px Courier';
         this.text(' x           -            1', [0,.7]);

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('         1  0  0    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1    0  0  0    y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('         0  0 -1    1   ', [0,-.18]);
         this.drawRect([-.29,-.30],[.36,.29]);

         ctx.strokeStyle = 'black';
         this.text('                    x   ', [0, .18]);
         this.text('                        ', [0, .09]);
         this.text('x y 1               y   ', [0, .00]);
         this.text('                        ', [0,-.09]);
         this.text('                    1   ', [0,-.18]);

         this.drawRect([-.89,-.10],[-.43,.08]);
         this.drawRect([.50,-.30],[.68,.29]);
	 this.dot([-.36,0],8);
	 this.dot([.43,0],8);

         ctx.strokeStyle = '#a0a0a0';
	 this.line([-.9,-.7],[-.1,-.7], true);
	 this.line([-.5,-1.1],[-.5,-.3], true);

         ctx.strokeStyle = 'black';
	 this.text('Parallel', [.4,-.64]);
	 this.text('lines'   , [.4,-.76]);
	 this.curve(50, t => [ .25           - .5,
	                       .25 * (2*t-1) - .7]);
	 this.curve(50, t => [-.25           - .5,
	                       .25 * (2*t-1) - .7]);

	 break;
      }
   }
}
