function Scene() {

let ball = Shape.sphereMesh(20,10);
let tube = Shape.tubeMesh(20);

this.vertexShader = Shader.defaultVertexShader;
this.fragmentShader = Shader.defaultFragmentShader;

autodraw = false;

let M = new Matrix();

let draw = (mesh, matrix, color) => {
   let m = mxm(perspective(0,0,-.5),matrix??M.get());
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   setUniform('3fv', 'uColor', color ?? [1,1,1]);
   drawMesh(mesh);
   return this;
}

this.update = () => {
   let stem = () => {
   }
   let N = 16, a = _.x ?? 0, r = .05, l = .05;
   M.push().scale(.7).move(0,-.9,0);
   for (let n = 0 ; n < N ; n++) {
      M.push().move(0,2*l,0).turnZ(a/2);
      draw(ball, mxm(M.get(), scale(r)),[0,1,0]);
      draw(tube, mxm(M.get(),
                 mxm(move(0,l,0),
		 mxm(turnX(Math.PI/2),
		     scale(r,r,l)))), [0,1,0]);
   }
   draw(ball, mxm(M.get(), scale(.25)), [1,0,0]);
   for (let n = 0 ; n < N ; n++)
      M.pop();
   M.pop();
}

}

