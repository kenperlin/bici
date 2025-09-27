function Diagram() {
   let state = 0, isDown = false, theta = .1, phi = .05, xPrev = 0, yPrev = 0;
   let N = 5, nh = (N - 1) / 2, D = [], t2 = 0;
   let U = .3, V = .4, W = .5;
   let S = t => t * .8 / nh;
   for (let n = 0 ; n < N*N*N ; n++) {
      let x = 1, y = 1, z = 1;
      while (x*x + z*z > 1) {
         x = 2 * Math.random() - 1;
         y = 2 * Math.random() - 1;
         z = 2 * Math.random() - 1;
      }
      let s = Math.sqrt(x*x + y*y + z*z);
      D.push({x: x/s*N/10, y: y/s*N/10, z: z/s*N/10});
   }
   this.onDown = (x,y) => {
      isDown = true;
      xPrev = x;
      yPrev = y;
   }
   this.onDrag = (x,y) => {
      if (state >= 4) {
	 U = Math.max(0, Math.min(1, .5 * x + .5));
	 V = Math.max(0, Math.min(1, .5 * y + .5));
      }
      else {
         theta += x - xPrev;
         phi   -= y - yPrev;
      }
      xPrev = x;
      yPrev = y;
   }
   this.onUp = (x,y) => {
      isDown = false;
      if (y < .5)
         if (x > 0)
	    state = Math.min(state + 1, 4);
         else
            state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      let e = .05;
      let s = t => t * t * (3 - t - t);

      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      if (state >= 2)
         t2 = Math.min(t2+.03, 1);

      let m2 = S(N/2) * t2;
      let s2 = 1 + (N/2 - 1) * t2;
      this.move(m2,m2,m2);
      this.scale(s2);

      this.move(0,0,state>=2?-.5:0);
      this.turnY(theta);
      this.turnX(phi);
      this.move(0,0,state>=2?.5:0);
      this.scale(.7);

      if (state >= 3) {
         ctx.strokeStyle = 'blue';
         this.line([S( -nh),S(V-nh),S(W-nh)], [S(1-nh),S(V-nh),S(W-nh)]);
         this.line([S(U-nh),S( -nh),S(W-nh)], [S(U-nh),S(1-nh),S(W-nh)]);
         this.line([S(U-nh),S(V-nh),S( -nh)], [S(U-nh),S(V-nh),S(1-nh)]);
         this.dot ([S(U-nh),S(V-nh),S(W-nh)]);
      }

      let X = (x,y,z) => D[N*N * (x+nh) + N * (y+nh) + (z+nh)].x;
      let Y = (x,y,z) => D[N*N * (x+nh) + N * (y+nh) + (z+nh)].y;
      let Z = (x,y,z) => D[N*N * (x+nh) + N * (y+nh) + (z+nh)].z;

      let nn = state >= 2 ? -nh + 1 : nh;

      switch (state) {

      case 4:
      case 3:
      case 2:
      case 1:

      ctx.strokeStyle = 'red';
      for (let x = -nh ; x <= nn ; x++)
      for (let y = -nh ; y <= nn ; y++)
      for (let z = -nh ; z <= nn ; z++) {
         let dx = X(x,y,z);
         let dy = Y(x,y,z);
         let dz = Z(x,y,z);
         this.line( [ S(x),S(y),S(z) ] , [ S(x+dx),S(y+dy),S(z+dz) ], state==2 );
      }

      case 0:

      ctx.strokeStyle = '#808080';
      for (let z = -nh ; z <  nn ; z++)
      for (let x = -nh ; x <= nn ; x++)
      for (let y = -nh ; y <= nn ; y++)
         this.line([.8/nh*x,.8/nh*y,.8/nh*z],[.8/nh*x,.8/nh*y,.8/nh*(z+1)]);
      for (let y = -nh ; y <  nn ; y++)
      for (let z = -nh ; z <= nn ; z++)
      for (let x = -nh ; x <= nn ; x++)
         this.line([.8/nh*x,.8/nh*y,.8/nh*z],[.8/nh*x,.8/nh*(y+1),.8/nh*z]);
      for (let x = -nh ; x <  nn ; x++)
      for (let y = -nh ; y <= nn ; y++)
      for (let z = -nh ; z <= nn ; z++)
         this.line([.8/nh*x,.8/nh*y,.8/nh*z],[.8/nh*(x+1),.8/nh*y,.8/nh*z]);
      }
   }
}
