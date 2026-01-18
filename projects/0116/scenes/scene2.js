export function Scene() {
   let cube = Shape.cubeMesh(30,15);
   addTexture(0, 'fixed-width-font.png');
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;
   this.update = () => {
      setUniform('1i', 'uTexture', 0);
      drawObj(cube, scale(.25));
   }
}

