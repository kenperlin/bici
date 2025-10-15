// BEZIER CURVE EDITOR
function Diagram() {
   let info = '', nDrags = 0;
   let I = -1; 
   let X = [ -.5,-.1, .8, .8, .8, -.2, -.2 ];
   let Y = [ -.1,-.4,-.2, .4, .6,   0,  .2 ];
   let M = [ [-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t) + Vi(V,1,t) + Vi(V,2,t) + Vi(V,3,t);
   let norm = V => Math.sqrt(V[0]*V[0] + V[1]*V[1]);
   _.BX = X;
   _.BY = Y;
   let align = (a,b,c) => {
      let r1 = norm([ X[b] - X[c], Y[b] - Y[c] ]);
      let r2 = norm([ X[a] - X[b], Y[a] - Y[b] ]);
      X[a] = X[b] + (X[b] - X[c]) / r1 * r2;
      Y[a] = Y[b] + (Y[b] - Y[c]) / r1 * r2;
   }
   this.onDown = (x,y) => {
      nDrags = 0;
      I = -1;
      for (let i = 0 ; i < X.length ; i++)
         if (norm([ x-X[i], y-Y[i] ]) < .1)
	    I = i;
   }
   this.onDrag = (x,y) => {
      nDrags++;
      if (I >= 0) {
         let dx = x - X[I];
         let dy = y - Y[I];
	 switch (I % 3) {
         case 0:
            if (I > 0) X[I-1] += dx;
            if (I > 0) Y[I-1] += dy;
            if (I < X.length-1) X[I+1] += dx;
            if (I < X.length-1) Y[I+1] += dy;
	    break;
         case 1:
	    if (I > 0) align(I-2,I-1,I);
	    break;
         case 2:
	    if (I < X.length-2) align(I+2,I+1,I);
	    break;
         }
         X[I] += dx;
         Y[I] += dy;
      }
      let L = X.length-1;
      if (I == 1   && norm([X[L]-X[0],Y[L]-Y[0]]) == 0) align(L-1,0,1);
      if (I == L-1 && norm([X[L]-X[0],Y[L]-Y[0]]) == 0) align(1,0,L-1);
      isReloadScene = true;
   }
   this.onUp = (x,y) => {
      let L = X.length - 1;
      if (nDrags == 0) {
         if (I == -1) {
	    let i = X.length - 1;
	    let dx = X[i] - X[i-1];
	    let dy = Y[i] - Y[i-1];
	    let v = normalize([x - X[i], y - Y[i]]);
	    let d = v[0] * dx + v[1] * dy;
	    X.push(X[i] + dx, x + dx - 2 * d * v[0], x);
	    Y.push(Y[i] + dy, y + dy - 2 * d * v[1], y);
	 }
	 else if (I > 0 && I == X.length - 1) {
	    X.splice(X.length - 3);
	    Y.splice(Y.length - 3);
	 }
      }
      else if (I == L && norm([x-X[0],y-Y[0]]) < .1) {
         X[I] = X[0];
         Y[I] = Y[0];
	 align(I-1,0,1);
      }
      else if (I == 0 && norm([x-X[L],y-Y[L]]) < .1) {
         X[I] = X[L];
         Y[I] = Y[L];
	 align(1,0,L-1);
      }
      I = -1;
      isReloadScene = true;
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000080';
      this.line([-1,0],[1,0]);
      this.line([0,-1],[0,1]);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      for (let n = 0 ; n < X.length-1 ; n += 3)
         this.curve(50, t => [ C(X.slice(n,n+4), t), C(Y.slice(n,n+4), t) ]);
      ctx.lineWidth = 3;

      ctx.strokeStyle = '#0000ff' + (I>=0 ? '' : '40');
      for (let i = 1 ; i < X.length ; i++)
         this.line([X[i-1],Y[i-1]],[X[i],Y[i]]);

      ctx.strokeStyle = 'blue';
      for (let i = 0 ; i < X.length ; i++)
         this.dot([X[i],Y[i]]);
      ctx.strokeStyle = 'white';
      this.dot([X[X.length-1],Y[Y.length-1]], 5);

      ctx.font = '40px Courier';
      ctx.strokeStyle = '#0000ff';
      this.text(info, [0,.9]);
      ctx.font = '30px Helvetica';
   }
}

