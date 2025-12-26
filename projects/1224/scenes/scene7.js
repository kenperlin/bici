function Scene() {
   let mesh = Shape.roundedBox(.1, .2, .3, .05, 2);
   this.update = () => {
      let t = Date.now() / 1000;
      drawObj(mesh, mxm(turnX(t), turnY(1.3 * t)));
   }
}

