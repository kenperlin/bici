// ECLIPSE
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
   for (int i = 0 ; i < 8 ; i++) {
      f += abs(noise(s * P)) / s;
      s *= 2.;
      P = vec3(.866*P.x + .5*P.z, P.y + 100., -.5*P.x + .866*P.z);
   }
   return f;
}

void main(void) {
   float x = 1.5*vPos.x;
   float y = 1.5*vPos.y;
   float a = .7;
   float b = .72;
   float s = 0.;
   float r0 = sqrt(x*x + y*y);
   if (r0 > a && r0 <= 1.) {
      float r = r0;
      float ti = uTime*.3;
      float t = mod(ti, 1.);
      float u0 = turbulence(vec3(x*(2.-t)/2., y*(2.-t)/2., .2* t    +2.));
      float u1 = turbulence(vec3(x*(2.-t)   , y*(2.-t)   , .2*(t-1.)+2.));
      r = min(1., r - .1 + 0.3 * mix(u0, u1, t));
      s = (1. - r) / (1. - b);
   }
   if (r0 < b)
      s *= (r0 - a) / (b - a);
   vec3 color = vec3(s);
   float ss = s * s;
   color = s*vec3(1.,ss,ss*ss);
   fragColor = vec4(color,s);
}`;


let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

