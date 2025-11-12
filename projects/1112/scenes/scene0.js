function Scene() {
   let cube = Shape.cubeMesh();
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;
   this.update = () => {
      let time = Date.now() / 1000;
      drawObj(cube, mxm(turnY(time),scale(.3)));
   }
}

