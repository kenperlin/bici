// FIREBALL
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
      P = vec3(.866*P.x+.5*P.z,P.y+100.,-.5*P.x+.866*P.z);
   }
   return f;
}

void main() {
   float x = vPos.x;
   float y = -vPos.y;
   float z = sqrt(1.-x*x-y*y);
   float a = .5;
   float b = .52;
   float s = 0.;
   float r0 = sqrt(x*x + y*y);
   if (r0 > a && r0 <= 1.) {
      float r = r0;
      float ti = uTime*.3;
      float t = mod(ti, 1.);
      float u0 = turbulence(vec3(x*(2.-t)/2.,y*(2.-t)/2.,.2*t+2.));
      float u1 = turbulence(vec3(x*(2.-t),y*(2.-t),.2*(t-1.)+2.));
      r = min(1., r - .1 + 0.3 * mix(u0, u1, t));
      s = (1. - r) / (1. - b);
   }
   float t = max(0.,min(1., (r0 - a) / (b - a)));

   float r = .9 + .1 * noise(13.*vPos+vec3(0.,0.,uTime));
   vec4 f0 = vec4(2.*r,r,(r*r+r)/2.,1.);

   vec3 color = vec3(s);
   float ss = s * s;
   color = ss*vec3(1.,ss*ss,ss*ss*ss);
   vec4 f1 = vec4(color, ss);

   fragColor = mix(f0, f1, t);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

