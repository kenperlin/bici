function Scene() {
   let a = Shape.sphereMesh(30,15);
   let b = Shape.tubeMesh(30);
   let c = Shape.cubeMesh();
   let R = .08, r = .016;
   this.update = () => {
      let t = Date.now() / 1000;
      let m = mxm(mxm(mxm(turnX(1.1 * t), turnY(1.2 * t)), turnZ(1.3 * t)),scale(3));
/*
      drawObj(a, mxm(m,mxm(move(-.3,-.3,0),scale(.05))));
      drawObj(a, mxm(m,mxm(move( .3,-.3,0),scale(.05))));
      drawObj(a, mxm(m,mxm(move(-.3, .3,0),scale(.05))));
      drawObj(a, mxm(m,mxm(move( .3, .3,0),scale(.05))));
      drawObj(b, mxm(m,mxm(mxm(move(-.3,0,0),turnX(Math.PI/2)),scale(.05,.05,.3))));
      drawObj(b, mxm(m,mxm(mxm(move( .3,0,0),turnX(Math.PI/2)),scale(.05,.05,.3))));
      drawObj(b, mxm(m,mxm(mxm(move(0,-.3,0),turnY(Math.PI/2)),scale(.05,.05,.3))));
      drawObj(b, mxm(m,mxm(mxm(move(0, .3,0),turnY(Math.PI/2)),scale(.05,.05,.3))));
      drawObj(c, mxm(m,scale(.3,.3,.05)));
*/
      drawObj(a, mxm(m,mxm(move(-R,-R, R),scale(r))));
      drawObj(a, mxm(m,mxm(move( R,-R, R),scale(r))));
      drawObj(a, mxm(m,mxm(move(-R, R, R),scale(r))));
      drawObj(a, mxm(m,mxm(move( R, R, R),scale(r))));
      drawObj(a, mxm(m,mxm(move(-R,-R,-R),scale(r))));
      drawObj(a, mxm(m,mxm(move( R,-R,-R),scale(r))));
      drawObj(a, mxm(m,mxm(move(-R, R,-R),scale(r))));
      drawObj(a, mxm(m,mxm(move( R, R,-R),scale(r))));

      drawObj(b, mxm(m,mxm(mxm(move(0,-R,-R),turnY(Math.PI/2)),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(mxm(move(0,-R, R),turnY(Math.PI/2)),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(mxm(move(0, R,-R),turnY(Math.PI/2)),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(mxm(move(0, R, R),turnY(Math.PI/2)),scale(r,r,R))));

      drawObj(b, mxm(m,mxm(mxm(move(-R,0,-R),turnX(Math.PI/2)),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(mxm(move(-R,0, R),turnX(Math.PI/2)),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(mxm(move( R,0,-R),turnX(Math.PI/2)),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(mxm(move( R,0, R),turnX(Math.PI/2)),scale(r,r,R))));

      drawObj(b, mxm(m,mxm(move(-R,-R,0),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(move(-R, R,0),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(move( R,-R,0),scale(r,r,R))));
      drawObj(b, mxm(m,mxm(move( R, R,0),scale(r,r,R))));

      drawObj(c, mxm(m,scale(R,R,R+r)));
      drawObj(c, mxm(m,scale(R,R+r,R)));
      drawObj(c, mxm(m,scale(R+r,R,R)));
   }
}

