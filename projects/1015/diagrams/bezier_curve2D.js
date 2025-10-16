function Diagram() {
   let I = -1; 
   let X = [ -.5,-.1, .8, .8 ];
   let Y = [ -.1,-.4,-.4, .4 ];
   let M = [ [-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t) + Vi(V,1,t) + Vi(V,2,t) + Vi(V,3,t);
   this.onDown = (x,y) => {
      I = -1;
      for (let i = 0 ; i < X.length ; i++) {
         let dx = x - X[i], dy = y - Y[i];
	 if (Math.sqrt(dx*dx + dy*dy) < .1)
	    I = i;
      }
   }
   this.onDrag = (x,y) => {
      if (I >= 0) {
         X[I] = x;
         Y[I] = y;
      }
   }
   this.onUp = (x,y) => I = -1;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000080';
      this.line([-1,0],[1,0]);
      this.line([0,-1],[0,1]);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      this.curve(50, t => [ C(X, t), C(Y, t) ]);
      ctx.lineWidth = 3;

      ctx.strokeStyle = '#0000ff' + (I>=0 ? '' : '40');
      for (let i = 0 ; i < X.length ; i++)
         this.dot([X[i],Y[i]], i%3==0 ? 10 : 7);
      for (let i = 1 ; i < X.length ; i++)
         this.line([X[i-1],Y[i-1]],[X[i],Y[i]]);
   }
}

