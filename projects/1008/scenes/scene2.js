// OCTAHEDRON AS 8 TRIANGLES
function Scene() {

//gotoFigure('octahedron');

mesh = {
  data: new Float32Array([
  -1, 0, 0,-1,-1,-1,  0,-1, 0,-1,-1,-1,  0, 0,-1,-1,-1,-1,
   1, 0, 0, 1,-1,-1,  0,-1, 0, 1,-1,-1,  0, 0,-1, 1,-1,-1,
  -1, 0, 0,-1, 1,-1,  0, 1, 0,-1, 1,-1,  0, 0,-1,-1, 1,-1,
   1, 0, 0, 1, 1,-1,  0, 1, 0, 1, 1,-1,  0, 0,-1, 1, 1,-1,
  -1, 0, 0,-1,-1, 1,  0,-1, 0,-1,-1, 1,  0, 0, 1,-1,-1, 1,
   1, 0, 0, 1,-1, 1,  0,-1, 0, 1,-1, 1,  0, 0, 1, 1,-1, 1,
  -1, 0, 0,-1, 1, 1,  0, 1, 0,-1, 1, 1,  0, 0, 1,-1, 1, 1,
   1, 0, 0, 1, 1, 1,  0, 1, 0, 1, 1, 1,  0, 0, 1, 1, 1, 1,
  ])
};

this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-1.,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
}`;

this.fragmentShader = `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .1 + max(0., dot(vec3(.5),nor));
   fragColor = vec4(c,c,c, 1.);
}`;

let startTime = Date.now()/1000;

this.update = () => {
   vertexMap(['aPos', 3, 'aNor', 3]);
   let time = Date.now() / 1000 - startTime;
   let m = mxm(perspective(0,0,-.5),
           mxm(turnY(time),
	       scale(.5)));
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
}

}
