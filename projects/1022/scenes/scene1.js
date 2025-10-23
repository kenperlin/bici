// BALLS, TUBES, CUBES, AIM, SIMPLE HIERARCHY

function Scene() {

let ball = Shape.sphereMesh(20,10);
let tube = Shape.tubeMesh(20);
let cube = Shape.cubeMesh();

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

/*
let aim = Z => {
   Z = normalize(Z);
   let X = Z[0]*Z[0] < Z[1]*Z[1] ? [1,0,0] :
           Z[1]*Z[1] < Z[2]*Z[2] ? [0,1,0] : [0,0,1];
   let Y = normalize(cross(Z,X));
   X = normalize(cross(Y,Z));
   return [ X[0],X[1],X[2], 0,
            Y[0],Y[1],Y[2], 0,
	    Z[0],Z[1],Z[2], 0,
	       0,   0,   0, 1 ];
}
*/

this.update = () => {
   let time = Date.now() / 1000 / 10;

   let P = [ Math.sin(10 * time),
             Math.sin(12 * time),
	     Math.sin(14 * time) ];
   P = resize(normalize(P), .2);

   M.push().move(P).scale(.1);
      draw(ball);
   M.pop();

   M.push().move(resize(P,-1)).scale(.1);
      draw(ball);
   M.pop();

   M.push().aim(P).scale(.05,.05,norm(P)/2);
      draw(tube);
   M.pop();

   M.push().move([0,.5,0]).scale(.1);
      draw(cube, M.get(), [1,0,0]);
   M.pop();
}

}

