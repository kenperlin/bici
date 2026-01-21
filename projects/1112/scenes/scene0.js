function Scene() {
   let cube = Shape.cubeMesh();
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;

   //tentative modifiable properties
   this.scaleValue = 0.3;
   this.color = [1, 1, 1];

    // Listen for AI commands
    window.addEventListener('sceneCommand', (event) => {
      const commands = event.detail;
      
      if (commands.scaleValue !== undefined) {
         this.scaleValue = commands.scaleValue;
         console.log('Updated scale to:', this.scaleValue);
      }
      
      if (commands.color !== undefined) {
         this.color = commands.color;
         console.log('Updated color to:', this.color);
      }
   });

   
   this.update = () => {
      let time = Date.now() / 1000;
      // drawObj(cube, mxm(turnY(time),scale(.3)));
      drawObj(cube, mxm(turnX(time), scale(this.scaleValue)), this.color);
   }
}

