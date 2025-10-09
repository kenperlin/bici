// ONE TRIANGLE
function Scene() {

//gotoFigure('triangle');

mesh = {
  data: new Float32Array([
       0, 1,0, 0,0,1,
      -1,-1,0, 0,0,1,
       1,-1,0, 0,0,1,
  ])
};

this.vertexShader = `\
#version 300 es
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
   vNor = aNor;
}`;

this.fragmentShader = `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   fragColor = vec4(vPos, 1.);
}`;

let startTime = Date.now()/1000;

this.update = () => { }

}

