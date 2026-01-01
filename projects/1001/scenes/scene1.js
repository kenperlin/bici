// NOISE TEXTURE
function Scene() {

mesh = { data: new Float32Array([-1, 1,0, -1,-1,0,  1,1,0,
                                 -1,-1,0,  1,-1,0,  1,1,0]) };

this.vertexShader = `\
#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

this.fragmentShader = `\
#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uViewPoint;
in  vec3 vPos;
out vec4 fragColor;

void main() {
   vec4 F = vec4(0.);
   float x = 2. * vPos.x;
   float y = 2. * vPos.y;
   float rr = x*x + y*y;
   if (rr < 1.) {
      float z = sqrt(1. - rr);
      float c = .1 + .5 * max(0., x+y+z);
      c *= .5 + noise(4. * vPos - vec3(0.*uTime,0.,0.));
      F = vec4(c,c,c,1.);
   }
   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   vertexMap(['aPos', 3]);
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

