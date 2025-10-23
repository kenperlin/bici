function Diagram() {
   let I = -1; 
   let X = [ -.5, .5, -.25, .75 ];
   let Y = [   0,  0, .25, .25 ];
   let M = [ [2,-3,0,1], [-2,3,0,0], [1,-2,1,0], [1,-1,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t) + Vi(V,1,t) + Vi(V,2,t) + Vi(V,3,t);
   this.onDown = (x,y) => {
      I = -1;
      for (let i = 0 ; i < 4 ; i++) {
         let dx = x - X[i], dy = y - Y[i];
	 if (Math.sqrt(dx*dx + dy*dy) < .1)
	    I = i;
      }
   }
   this.onDrag = (x,y) => {
      if (I >= 0) {
	 if (I < 2) {
	    X[I+2] += x - X[I];
	    Y[I+2] += y - Y[I];
	 }
         X[I] = x;
         Y[I] = y;
      }
   }
   this.onUp   = (x,y) => I = -1;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000080';
      this.line([-1,0],[1,0]);
      this.line([0,-1],[0,1]);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      this.curve(50, t => [ C([X[0],X[1],X[2]-X[0],X[3]-X[1]], t),
	                    C([Y[0],Y[1],Y[2]-Y[0],Y[3]-Y[1]], t) ]);
      ctx.lineWidth = 3;

      ctx.strokeStyle = '#0000ff' + (I>=0 ? '' : '40');
      for (let i = 0 ; i < 4 ; i++)
         switch (i) {
	 case 0: this.dot([X[0],Y[0]]); break;
	 case 1: this.dot([X[1],Y[1]]); break;
	 case 2: this.line([X[0],Y[0]],[X[2],Y[2]],1); break;
	 case 3: this.line([X[1],Y[1]],[X[3],Y[3]],1); break;
      }
   }
}
