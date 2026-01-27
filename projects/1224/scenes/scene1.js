function Scene() {
   let cube = Shape.cubeMesh();

   let sphere = Shape.sphereMesh(30,15);
   let red = .500;
   let green = .500;
   let scal = 0.500;


   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;
   this.update = () => {
      let time = Date.now() / 1000;
      drawObj(cube, mxm(turnY(time),scale(.3)));

      drawObj(sphere, mxm(move(0,0.3+scal,0),scale(scal)),[red,green,.5]);
   

   }
}

