function Scene() {
   let x1 = 0.2;
   let y1 = 0;
   let z1 = 0;
   let x2 = 0.8;
   let y2 = 0;
   let z2 = 0;

   let ball1 = Shape.sphereMesh(30,15);
   ball1.color = [1,0,0];

   let ball2 = Shape.sphereMesh(30,15);
   ball2.color = [0,.5,1];

   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;
   this.update = () => {
      drawObj(ball1, mxm(move(2*x1-1,2*y1-1,2*z1-1),
                         scale(.4+.3*z1)));
      drawObj(ball2, mxm(move(2*x2-1,2*y2-1,2*z2-1),
                         scale(.4+.3*z2)));
   }
   this.onDrag = (x,y,z,id) => {

      x = 2*x+1-canvas3D_x()/canvas3D.width;
      y = 2*y+1-canvas3D_y()/canvas3D.width-.1;

      if (id.indexOf('left') >= 0) {
         x1 = (x + 1) / 2;
         y1 = (y + 1) / 2;
         z1 = (z + 1) / 2;
      }
      else {
         x2 = (x + 1) / 2;
         y2 = (y + 1) / 2;
         z2 = (z + 1) / 2;
      }
   }
}
