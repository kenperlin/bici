function Scene() {
   let red = .500;
   let green = .500;
   let x = .500;
   let y = .500;
   let ball = Shape.sphereMesh(30,15);
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;
   this.update = () => {
      drawObj(ball,
              mxm(move(2*x-1,2*y-1,0),
                  scale(.25)),
              [red,green,.5]);
   }
   this.onDrag = (x,y) => {
      codeArea.setVar('x', .5 + .5 * x);
      codeArea.setVar('y', .5 + .5 * y);
   }
}

