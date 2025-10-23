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
         ctx.font = '19px Courier';
         this.text('2                 2            2', [-.08,.92]);
         ctx.font = '25px Courier';
         this.text('Ax+Bxy+Cxz+Dx+Ey+Fyz+Gy+Hz+Iz+J', [0,.85]);
      }

      switch (state) {
      case 0:
         showEquation();
         break;

      case 1:
         showEquation();

	 this.move(0,.2,0);

         ctx.strokeStyle = '#ff00ff';
         this.text('           A  B  C  D     ', [-.11, .18]);
         this.text('                          ', [-.11, .09]);
         this.text('           0  E  F  G     ', [-.11, .00]);
         this.text('                          ', [-.11,-.09]);
         this.text('           0  0  H  I     ', [-.11,-.18]);
         this.text('                          ', [-.11,-.27]);
         this.text('           0  0  0  J     ', [-.11,-.36]);
         this.drawRect([-.28,-.46],[.41,.26]);

	 this.move(0,-.1,0);

         ctx.strokeStyle = 'black';
         this.text('                        ', [-.18, .18]);
         this.text('                        ', [-.18, .09]);
         this.text('x y z 1                 ', [-.18, .00]);
         this.text('                        ', [-.18,-.09]);
         this.text('                        ', [-.18,-.18]);
         this.text('                        ', [-.18,-.27]);
         this.text('                        ', [-.18,-.36]);

         this.drawRect([-.94,-.10],[-.43,.08]);
         this.drawRect([.56,-.36],[.74,.36]);
	 this.dot([-.36,-.01],.016);
	 this.dot([.48,-.01],.016);

	 this.move(.15,.1,0);

         ctx.strokeStyle = 'black';
         this.text('                       x', [-.19, .18]);
         this.text('                        ', [-.19, .09]);
         this.text('                       y', [-.19, .00]);
         this.text('                        ', [-.19,-.09]);
         this.text('                       z', [-.19,-.18]);
         this.text('                        ', [-.19,-.27]);
         this.text('                       1', [-.19,-.36]);

	 break;

      case 2:
         showEquation();

         ctx.font = '25px Courier';
         this.text('GET SURFACE NORMAL FROM', [0, .47]);
         this.text('PARTIAL DERIVATIVES:', [0, .33]);
         this.text('2Ax + By + Cz + D', [0, .0]);
         this.text('Bx + 2Ey + Fz + G', [0,-.2]);
         this.text('Cx + Fy + 2Hz + I', [0,-.4]);

	 break;
      }
   }
}
