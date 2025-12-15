function Scene() {
   this.onDrag = (x,y) => {
      let text = codeArea.getElement().value;
      let i = text.indexOf('red') + 7;
      let n = 10 * (.5 + .5 * x) >> 0;
      text = text.subtring(0,i) + n + text.substring(i+1);
      codeArea.getElement().value = text;
      eval(codeArea.getElement().value);
   }
   let red = .0;
   let cube = Shape.cubeMesh();
   let ball = Shape.sphereMesh(20,10);
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;
   this.update = () => {
      drawObj(cube, mxm(headMatrix,scale(.3,.3,.01)));
      drawObj(ball, mxm(mxm(headMatrix,move(eyeGazeX,eyeGazeY,0)),scale(.07,.07*eyeOpen,.07)), [red,0,0]);
   }
}

