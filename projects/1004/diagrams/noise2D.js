function Diagram() {
   let state = 0, isDown = false, theta = .1, phi = .9, xPrev = 0, yPrev = 0;
   let N = 5, nh = (N - 1) / 2, D = [];
   for (let n = 0 ; n < N*N ; n++) {
      let x = 1, z = 1;
      while (x*x + z*z > 1) {
         x = 2 * Math.random() - 1;
         z = 2 * Math.random() - 1;
      }
      let s = Math.sqrt(x*x + z*z);
      D.push({x: x/s*N/10, z: z/s*N/10});
   }
   this.onDown = (x,y) => {
      isDown = true;
      xPrev = x;
      yPrev = y;
   }
   this.onDrag = (x,y) => {
      theta += x - xPrev;
      phi   -= y - yPrev;
      xPrev = x;
      yPrev = y;
   }
   this.onUp = (x,y) => {
      isDown = false;
      if (y < .5)
         if (x > 0)
	    state = Math.min(state + 1, 3);
         else
            state = Math.max(0, state - 1);
   }
   this.update = ctx => {
      let e = .05;
      let s = t => t * t * (3 - t - t);

      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      this.turnY(theta);
      this.turnX(phi);

      let X = (x,z) => D[N * (x+nh) + (z+nh)].x;
      let Z = (x,z) => D[N * (x+nh) + (z+nh)].z;

      switch (state) {

      case 3:
      case 2:

      ctx.strokeStyle = 'black';
      ctx.lineWidth = .5;
      for (let x = -nh ; x < nh ; x++)
      for (let z = -nh ; z < nh ; z++) {

         let x00 = X(x   ,z  );
         let x10 = X(x+1 ,z  );
         let x01 = X(x   ,z+1);
         let x11 = X(x+1 ,z+1);

         let z00 = Z(x   ,z  );
         let z10 = Z(x+1 ,z  );
         let z01 = Z(x   ,z+1);
         let z11 = Z(x+1 ,z+1);

	 for (let u = 0 ; u < 1 ; u += .05) {
           this.curve(10, t => {
	      let y = s(1-t) * s(1-u) * (   t   * x00 +   u   * z00 )
	            + s( t ) * s(1-u) * ( (t-1) * x10 +   u   * z10 )
	            + s(1-t) * s( u ) * (   t   * x01 + (u-1) * z01 )
	            + s( t ) * s( u ) * ( (t-1) * x11 + (u-1) * z11 );
	      return [ .8/nh * (x + t), y, .8/nh * (z + u) ];
           });
           this.curve(10, t => {
	      let y = s(1-t) * s(1-u) * (   t   * x00 +   u   * z00 )
	            + s( t ) * s(1-u) * ( (t-1) * x01 +   u   * z01 )
	            + s(1-t) * s( u ) * (   t   * x10 + (u-1) * z10 )
	            + s( t ) * s( u ) * ( (t-1) * x11 + (u-1) * z11 );
	      return [ .8/nh * (x + u), y, .8/nh * (z + t) ];
           });
         }
      }
      ctx.lineWidth = 5;
      if (state == 3)
         break;

      case 1:

      ctx.strokeStyle = 'red';
      for (let x = -nh ; x <= nh ; x++)
      for (let z = -nh ; z <= nh ; z++) {
         let yx = 2 * X(x,z);
         let yz = 2 * Z(x,z);
         this.line( [.8/nh*x-e,-e*yx,.8/nh*z  ] , [.8/nh*x+e,e*yx,.8/nh*z  ] );
         this.line( [.8/nh*x  ,-e*yz,.8/nh*z-e] , [.8/nh*x  ,e*yz,.8/nh*z+e] );
      }

      case 0:

      ctx.strokeStyle = '#808080';
      for (let z = -nh ; z <  nh ; z++)
      for (let x = -nh ; x <= nh ; x++)
         this.line([.8/nh*x,0,.8/nh*z],[.8/nh*x,0,.8/nh*(z+1)]);
      for (let x = -nh ; x <  nh ; x++)
      for (let z = -nh ; z <= nh ; z++)
         this.line([.8/nh*x,0,.8/nh*z],[.8/nh*(x+1),0,.8/nh*z]);
      }
   }
}
