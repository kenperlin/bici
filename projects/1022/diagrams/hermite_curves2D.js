function Diagram() {
   let I = -1; 
   let X = [ -.5,-.1, .8, .8, .8, -.2, -.2, -.2 ];
   let Y = [ -.1,-.4,-.2, .4, .6,   0,  .2,  .4 ];
   let M = [ [2,-3,0,1], [-2,3,0,0], [1,-2,1,0], [1,-1,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t) + Vi(V,1,t) + Vi(V,2,t) + Vi(V,3,t);
   let norm = V => Math.sqrt(V[0]*V[0] + V[1]*V[1]);
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
         let dx = x - X[I];
         let dy = y - Y[I];
	 if (I % 3 == 0) {
	    if (I > 0) {
               X[I-1] += dx;
               Y[I-1] += dy;
	    }
            X[I+1] += dx;
            Y[I+1] += dy;
	 }
         if (I == 2 || I == 4) {
	    let J = 6 - I;
	    let r1 = norm([ X[3] - X[I], Y[3] - Y[I] ]);
	    let r2 = norm([ X[J] - X[3], Y[J] - Y[3] ]);
            X[J] = X[3] + (X[3] - X[I]) / r1 * r2;
            Y[J] = Y[3] + (Y[3] - Y[I]) / r1 * r2;
         }
         X[I] += dx;
         Y[I] += dy;
      }
   }
   this.onUp = (x,y) => I = -1;
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000080';
      this.line([-1,0],[1,0]);
      this.line([0,-1],[0,1]);

      let hermite = (X,Y) => {
         let HX = [ X[0], X[3], X[1]-X[0], X[4]-X[3] ];
         let HY = [ Y[0], Y[3], Y[1]-Y[0], Y[4]-Y[3] ];
	 this.curve(50, t => [ C(HX,t), C(HY,t) ]);
      }

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      hermite(X, Y);
      hermite(X.slice(3), Y.slice(3));
      ctx.lineWidth = 3;

      ctx.strokeStyle = '#0000ff' + (I>=0 ? '' : '40');
      this.dot([X[0],Y[0]]);
      this.dot([X[3],Y[3]]);
      this.dot([X[6],Y[6]]);
      this.line([X[0],Y[0]],[X[1],Y[1]],1);
      this.line([X[3],Y[3]],[X[4],Y[4]],1);
      this.line([X[6],Y[6]],[X[7],Y[7]],1);
   }
}

