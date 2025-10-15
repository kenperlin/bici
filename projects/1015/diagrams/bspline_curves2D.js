function Diagram() {
   let isHighlight = false, I = -1; 
   let X = [ -.9,-.6,-.3, 0, .3, .6, .9 ];
   let Y = [ -.5, .5,-.5,.5,-.5, .5,-.5 ];
   let M = [[-1,3,-3,1],[3,-6,0,4],[-3,3,3,1],[1,0,0,0]];
   let T = (a,t) => (a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3]) / 6;
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t) + Vi(V,1,t) + Vi(V,2,t) + Vi(V,3,t);
   let norm = V => Math.sqrt(V[0]*V[0] + V[1]*V[1]);
   this.onDown = (x,y) => {
      if (x < -.9 && y < -.9) {
         isHighlight = true;
	 return;
      }
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
   this.onUp = (x,y) => { isHighlight = false ; I = -1; }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000080';
      this.line([-1,0],[1,0]);
      this.line([0,-1],[0,1]);

      ctx.strokeStyle = 'black';
      for (let i = -1 ; i < X.length ; i++) {
         let Xi = [], Yi = [];
         for (let j = i-1 ; j < i+3 ; j++) {
	    let k = Math.max(0, Math.min(X.length-1, j));
	    Xi.push(X[k]);
	    Yi.push(Y[k]);
	 }
	 ctx.lineWidth = 6;
	 if (isHighlight)
	    ctx.strokeStyle = colors[(i&1) << 1];
         this.curve(50, t => [ C(Xi, t), C(Yi, t) ]);
	 ctx.lineWidth = 3;
      }

      ctx.strokeStyle = '#0000ff' + (I>=0 ? '' : '40');
      for (let i = 0 ; i < X.length ; i++)
         this.dot([X[i],Y[i]]);
      for (let i = 1 ; i < X.length ; i++)
         this.line([X[i-1],Y[i-1]],[X[i],Y[i]]);
   }
}

