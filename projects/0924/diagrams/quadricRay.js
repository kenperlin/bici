
function Diagram() {
   let A = {x:-.9,y:.1}, B = {x:.9,y:.1}, Y = -.5, S = 1;

   this.onDrag = (x,y) => {
      if (y > .5) {
         S = x + 1.5;
      }
      else if (x < -.3) {
         A.x = x;
	 A.y = y;
      }
      else if (x > .3) {
         B.x = x;
	 B.y = y;
      }
      else
         Y = y;
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
      this.curve(50, t => {
         t = .9 * (2 * t - 1);
	 return [ t, S * t * t + Y ];
      })

      ctx.strokeStyle = 'red';
      this.dot([A.x,A.y], .04);
      this.line([A.x,A.y], [B.x,B.y], 1);

      ctx.strokeStyle = 'blue';
      let V = {x:A.x, y:A.y};
      let dx = B.x - A.x, dy = B.y - A.y;
      let ds = Math.sqrt(dx*dx + dy*dy);
      let W = {x:dx/ds, y:dy/ds};

      let eq = rayEq(V, W, S,0,0,0,-1,Y);
      let tt = findRoots(eq);
      if (tt) {
         let A = [V.x + tt[0] * W.x, V.y + tt[0] * W.y];
         let B = [V.x + tt[1] * W.x, V.y + tt[1] * W.y];
	 this.dot(A, .028);
	 this.dot(B, .028);
      }

      ctx.strokeStyle = 'black';
      this.text('y = ax + b', [.6,.82]);
      this.text('2', [.68,.9]);

   }
}
