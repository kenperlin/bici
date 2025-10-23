
function Diagram() {
   let A = {x:-.9,y:.1}, B = {x:.9,y:.1}, S = .3, state = 0, xPrev;

   this.onDown = (x,y) => {
      if (state == 3)
         xPrev = x;
   }
   this.onDrag = (x,y) => {
      if (state == 3) {
         S += .3 * (x - xPrev);
	 xPrev = x;
      }
      else if (y > .5 && x > -.3 && x < .3)
         ;
      else if (x < 0) {
         A.x = x;
	 A.y = y;
      }
      else {
         B.x = x;
	 B.y = y;
      }
   }

   this.onUp = (x,y) => {
      if (y > .5 && x > -.3 && x < .3)
         state = Math.min(state + 1, 4);
   }

   let rayEq = (V, W, A,B,C,D,E,F) => {

      let a = A*W.x*W.x + B* W.x*W.y + D*W.y*W.y;
 
      let b = 2*A*V.x*W.x + B*V.x*W.y + C*W.x +
              2*D*V.y*W.y + B*V.y*W.x + E*W.y ;

      let c = A*V.x*V.x + B*V.x*V.y + C*V.x +
              D*V.y*V.y + E*V.y + F ;

      return {a:a,b:b,c:c};
   }
   let findRoots = e => {
      let a = e.a, b = e.b, c = e.c;
      let d = b*b - 4*a*c;
      if (d < 0)
         return null;
      d = Math.sqrt(d)
      return [ (-b - d) / (2*a), (-b + d) / (2*a) ];
   }

   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      ctx.strokeStyle = '#a0a0a0';
      this.line([-.9,0],[.9,0], true);
      this.line([0,-.9],[0,.9], true);

      ctx.strokeStyle = 'black';
      this.line([-S,-.9],[-S,.9]);
      this.line([ S,-.9],[ S,.9]);

      if (state >= 1) {
         this.line([-.9,-S],[.9,-S]);
         this.line([-.9, S],[.9, S]);
      }

      ctx.strokeStyle = 'red';
      this.dot([A.x,A.y], .04);
      this.line([A.x,A.y], [B.x,B.y], 1);

      ctx.strokeStyle = 'blue';
      let V = {x:A.x, y:A.y};
      let dx = B.x - A.x, dy = B.y - A.y;
      let ds = Math.sqrt(dx*dx + dy*dy);
      let W = {x:dx/ds, y:dy/ds};

      let A0 = [0,0], B0 = [0,0], tA0, tB0,
          A1 = [0,0], B1 = [0,0], tA1, tB1;
      let eq = rayEq(V, W, 1,0,0,0,0,-S*S);
      let tt = findRoots(eq);
      if (tt) {
         tA0 = tt[0];
         tB0 = tt[1];
         A0 = [V.x + tt[0] * W.x, V.y + tt[0] * W.y];
         B0 = [V.x + tt[1] * W.x, V.y + tt[1] * W.y];
         ctx.strokeStyle = 'blue';
	 this.dot(A0, .028);
	 this.dot(B0, .028);

         ctx.strokeStyle = 'black';
	 this.line([.68,.77], [.74,.77]);
	 this.text('x < r', [.7,.82]);
	 this.text('2    2', [.77,.9]);
      }

      if (state == 0) {
         ctx.fillStyle = '#0040f050';
	 this.fillRect([-S,-.9],[S,.9]);
      }
      if (state >= 1) {
         ctx.fillStyle = '#0040f050';
	 this.fillRect([-S,-S],[S,S]);
      }

      if (state >= 1) {
         let eq = rayEq(V, W, 0,0,0,1,0,-S*S);
         let tt = findRoots(eq);
         if (tt) {
            tA1 = tt[0];
            tB1 = tt[1];
            A1 = [V.x + tt[0] * W.x, V.y + tt[0] * W.y];
            B1 = [V.x + tt[1] * W.x, V.y + tt[1] * W.y];
            ctx.strokeStyle = 'blue';
	    this.dot(A1, .028);
	    this.dot(B1, .028);

            ctx.strokeStyle = 'black';
	    this.line([.68,.52], [.74,.52]);
	    this.text('y < r', [.7,.57]);
	    this.text('2    2', [.77,.65]);
         }
      }

      if (state >= 2 && Math.max(tA0, tA1) < Math.min(tB0, tB1)) {
         let A = tA0 > tA1 ? A0 : A1;
         let B = tB0 < tB1 ? B0 : B1;
         ctx.strokeStyle = 'blue';
         let saveLineWidth = ctx.lineWidth;
         ctx.lineWidth = 14;
         this.line(A, B);
         ctx.lineWidth = saveLineWidth;
      }
   }
}
