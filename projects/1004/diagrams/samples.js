/*
   Exaplanation of choosing the samples
   for the Monte-Carlo part of noise.
*/
function Diagram() {
   let state = 0, theta = .1, phi = .1, cx, cy;
   let P = [];
   this.onDown = (x,y) => { cx = x; cy = y; }
   this.onDrag = (x,y) => {
      theta += x - cx;
      phi   -= y - cy;
      cx = x;
      cy = y;
   }
   this.onUp = (x,y) => {
      if (y > .5) {
         state = Math.min(state+1, 2);
	 if (state == 2) {
            for (let n = 0 ; n < P.length ; n++) {
               let p = P[n], x = p[0], y = p[1], z = p[2];
               let rr = x*x + y*y + z*z;
	       if (rr > 1)
	          P.splice(n--, 1);
            }
	 }
      }
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      this.turnX(phi);
      this.turnY(theta);
      this.scale(.6);
      ctx.strokeStyle = 'gray';
      for (let z = -1 ; z <  1 ; z += 2)
      for (let x = -1 ; x <= 1 ; x += 2)
      for (let y = -1 ; y <= 1 ; y += 2) {
         this.line([x,y,z],[x,y,z+2]);
         this.line([z,x,y],[z+2,x,y]);
         this.line([y,z,x],[y,z+2,x]);
      }
      this.arc([0,0,0],.6,0,2*Math.PI);
      if (state < 2 && P.length < 256)
         P.push([ 2*Math.random()-1,
	          2*Math.random()-1,
		  2*Math.random()-1 ]);
      ctx.strokeStyle = 'blue';
      if (state == 2) {
         for (let i = 0 ; i < P.length - 1 ; i++)
         for (let j = i+1 ; j < P.length ; j++) {
	    let a = P[i];
	    let b = P[j];
	    let d = [ b[0] - a[0], b[1] - a[1], b[2] - a[2] ];
	    let s = d[0]*d[0] + d[1]*d[1] + d[2]*d[2];
	    if (s < .5) {
	       s = .001 / (.001 + s);
	       P[i] = [ a[0]-d[0]*s, a[1]-d[1]*s, a[2]-d[2]*s ];
	       P[j] = [ b[0]+d[0]*s, b[1]+d[1]*s, b[2]+d[2]*s ];
            }
	 }
	 let M = this.getMatrix();
	 let Z = [ M[8], M[9], M[10] ];
         for (let n = 0 ; n < P.length ; n++) {
            let p = P[n], x = p[0], y = p[1], z = p[2];
            let r = Math.sqrt(x*x + y*y + z*z);
	    P[n] = [x/r,y/r,z/r];
	    ctx.strokeStyle = x*Z[0] + y*Z[1] + z*Z[2] > 0 ? 'blue' : '#a0a0ff';
	    this.dot(P[n],.016);
         }
      }
      else
         for (let n = 0 ; n < P.length ; n++) {
            let p = P[n], x = p[0], y = p[1], z = p[2];
            let rr = x*x + y*y + z*z;
	    if (state == 1 && rr <= 1) {
	       let r = Math.sqrt(rr);
	       x /= r;
	       y /= r;
	       z /= r;
	    }
	    if (state < 2)
	       ctx.strokeStyle = rr <= 1 ? 'blue' : (state==0 ? 'red' : '#ffa0a0');
	    this.dot([x,y,z],.016);
         }
   }
}

