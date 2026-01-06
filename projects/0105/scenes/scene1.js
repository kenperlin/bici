function Scene() {
   let x = 0;
   let y = 0;
   let z = 0;
   let ball = Shape.sphereMesh(30,15);
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;
   this.update = () => {
      drawObj(ball, mxm(move(2*x-1,2*y-1,2*z-1),scale(.4+.3*z)),[1,0,0]);
   }
   this.onDrag = (_x,_y,_z) => {


/*
let X = canvas3D_x(), Y = canvas3D_y(), W = canvas3D.width;

_x = (_x + 1) / 2 * W + X;
_x = 2 * (2 * _x - 1.5 * X - X) / W - 1;

_y = (1 - _y) / 2 * W + Y;
_y = 1 - 2 * (2 * _y - 1.5 * Y - 40 - Y) / W;
*/

      _x = 2 * _x + 1 - canvas3D_x() / canvas3D.width;
      _y = 2 * _y + 1 - canvas3D_y() / canvas3D.width - .1;

      x = (_x + 1) / 2;
      y = (_y + 1) / 2;
      z = (_z + 1) / 2;
   }
}
