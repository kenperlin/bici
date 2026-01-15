function Scene() {
   let cube = Shape.cubeMesh();
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;

   //tentative modifiable properties
   this.scaleValue = 0.3;
   this.color = [1, 1, 1];

   this.update = () => {
      let time = Date.now() / 1000;

      drawObj(cube, mxm(turnX(time), scale(this.scaleValue)), this.color);
   }
}

