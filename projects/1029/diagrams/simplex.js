function Diagram() {
   let state = 0, theta = .1, phi = .1, xPrev = 0, yPrev = 0;
   let order = [ [1,2],[2,1],[2,4],[4,2],[4,1],[1,4] ];
   this.onDown = (x,y) => {
      xPrev = x;
      yPrev = y;
   }
   this.onDrag = (x,y) => {
      theta += x - xPrev;
      phi   -= y - yPrev;
      xPrev = x;
      yPrev = y;
   }
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(2, state + (x>0?1:-1)));
   }
   this.update = ctx => {
      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      this.turnY(theta);
      this.turnX(phi);

      this.fillColor('#0000ff20');
      this.drawColor('#0000ff');

      this.scale(.5);

      let A = cubeVertices[0];
      let B = cubeVertices[3];
      let C = cubeVertices[5];
      let D = cubeVertices[6];

      this.lineWidth(.008);
      this.drawColor('black');
      this.line(A,B).line(A,C).line(A,D);
      this.line(B,C).line(B,D).line(C,D);

      this.fillColor('#00000010');
      this.fillPolygon([A,B,C]);
      this.fillPolygon([A,B,D]);
      this.fillPolygon([A,C,D]);
      this.fillPolygon([B,C,D]);

      this.lineWidth(.016);
      this.fillColor('#00000040');
      let AB, AC, AD, BC, BD;
      switch (state) {
      case 1:
         AB = mix(A,B,.5);
         AC = mix(A,C,.6);
         AD = mix(A,D,.7);
         this.fillPolygon([AB,AC,AD]);
         this.line(AB,AC).line(AC,AD).line(AD,AB);
	 this.drawColor('blue');
	 this.dot(A,.05);
	 this.drawColor('red');
	 this.dot(B,.05).dot(C,.05).dot(D,.05);
         break;
      case 2:
         AC = mix(A,C,.3);
         AD = mix(A,D,.5);
         BC = mix(B,C,.7);
         BD = mix(B,D,.4);
         this.fillPolygon([AC,AD,BD]);
         this.fillPolygon([AC,BC,BD]);
         this.line(AC,AD).line(AD,BD).line(BD,BC).line(BC,AC).line(AC,BD);
	 this.drawColor('blue');
	 this.dot(A,.05).dot(B,.05);
	 this.drawColor('red');
	 this.dot(C,.05).dot(D,.05);
         break;
      }
   }
}
