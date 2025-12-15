function Scene() {
   let R = .0, G = .0;
   let cube = Shape.cubeMesh();
   let ball = Shape.sphereMesh(20,10);
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;
   this.update = () => {
      drawObj(cube, mxm(headMatrix,scale(.3,.3,.01)));
      drawObj(ball, mxm(mxm(headMatrix,
		        move(eyeGazeX,eyeGazeY,0)),
		    scale(.07,.07*eyeOpen,.07)), [R,G,.5]);
   }
}

