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
      x = (_x + 1) / 2;
      y = (_y + 1) / 2;
      z = (_z + 1) / 2;
   }
}
