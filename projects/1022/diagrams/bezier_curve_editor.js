// BEZIER CURVE EDITOR
function Diagram() {
   let info = '', nDrags = 0;
   let I = -1; 
   let X = [ -.5,-.1, .8, .8, .8, -.2, -.2 ];
   let Y = [ -.1,-.4,-.2, .4, .6,   0,  .2 ];
   _.BX = X;
   _.BY = Y;

   let align = (a,b,c) => {
      let r1 = norm([ X[b] - X[c], Y[b] - Y[c] ]);
      let r2 = norm([ X[a] - X[b], Y[a] - Y[b] ]);
      X[a] = X[b] + (X[b] - X[c]) / r1 * r2;
      Y[a] = Y[b] + (Y[b] - Y[c]) / r1 * r2;
   }
   let isLoop, dragDistance, dragDiff;
   this.onDown = (x,y) => {
      nDrags = 0;
      I = -1;
      for (let i = 0 ; i < X.length ; i++)
         if (norm([ x-X[i], y-Y[i] ]) < .1)
	    I = i;

      // IF THE SPLINE IS LOOPED, CHECK FOR A FAST DRAG THAT WILL BREAK IT

      let L = X.length-1;
      if (isLoop = (I == 0 || I == L) && norm([ X[0]-X[L], Y[0]-Y[L] ]) == 0) {
	 dragDistance = 0;
	 let K = I==0 ? L-1 : 1;
	 dragDiff = [ X[K] - X[I], Y[K] - Y[I] ];
      }
   }
   this.onDrag = (x,y) => {
      nDrags++;
      let L = X.length-1;

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
      if (I == 1   && norm([X[L]-X[0],Y[L]-Y[0]]) == 0) align(L-1,0,1);
      if (I == L-1 && norm([X[L]-X[0],Y[L]-Y[0]]) == 0) align(1,0,L-1);

      if (isLoop) {
         let J = I == 0 ? L : 0;
         dragDistance += norm([ x-X[J], y-Y[J] ]);

         // IF FAST DRAGGING A LOOP END POINT, BREAK THE LOOP

	 if (nDrags == 3 && dragDistance > .1)
	    isLoop = false;

	 // OTHERWISE, DRAG THE OTHER END OF THE LOOP CORRECTLY

	 if (nDrags > 5) {
	    X[J] = X[I];
	    Y[J] = Y[I];
	    let K = I==0 ? L-1 : 1;
	    X[K] = X[J] + dragDiff[0];
	    Y[K] = Y[J] + dragDiff[1];
	 }
      }

      isReloadScene = true;
   }
   this.onUp = (x,y) => {
      info = '';
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
         this.curve(50, t => [ evalBezier(X.slice(n,n+4), t),
	                       evalBezier(Y.slice(n,n+4), t) ]);
      ctx.lineWidth = 3;

      ctx.strokeStyle = '#0000ff' + (I>=0 ? '' : '40');
      for (let i = 1 ; i < X.length ; i++)
         this.line([X[i-1],Y[i-1]],[X[i],Y[i]]);

      ctx.strokeStyle = 'blue';
      for (let i = 0 ; i < X.length ; i++)
         this.dot([X[i],Y[i]], i%3 == 0 ? 10 : 7);
      ctx.strokeStyle = 'white';
      this.dot([X[X.length-1],Y[Y.length-1]], 5);

      ctx.font = '40px Courier';
      ctx.strokeStyle = '#0000ff';
      this.text(info, [0,.9]);
      ctx.font = '30px Helvetica';
   }
}

