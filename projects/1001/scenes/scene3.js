// MARBLE
function Scene() {

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

float turbulence(vec3 P) {
   float f = 0., s = 1.;
   for (int i = 0 ; i < 9 ; i++) {
      f += abs(noise(s * P)) / s;
      s *= 2.;
      P = vec3(.866*P.x + .5*P.z, P.y + 100., -.5*P.x + .866*P.z);
   }
   return f;
}

vec3 marble(vec3 pos) {
   float v = turbulence(1.5 * pos);
   float s = sqrt(.5 + .5 * sin(20. * pos.x + 8. * v));
   return vec3(.8,.7,.5) * vec3(s,s*s,s*s*s);
}

void main() {
   vec4 F = vec4(0.);
   float x = 2. * vPos.x;
   float y = 2. * vPos.y;
   float rr = x*x + y*y;
   if (rr < 1.) {
      float z = sqrt(1. - rr);
      float c = .1 + .5 * max(0., x+y+z);
      F = vec4(c * marble(vPos),1.);
   }
   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

