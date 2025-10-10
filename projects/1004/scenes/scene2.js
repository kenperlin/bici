// CLOUDS
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
      float t = noise(s * P);
      f += abs(t) / s;
      s *= 2.;
      P = vec3(.866*P.x+.5*P.z,P.y+100.,-.5*P.x+.866*P.z);
   }
   return f;
}

void main() {
   float t = .5 + .5 * vPos.y;
   if (t > .5)
      t+=.0*turbulence(vPos+vec3(.0*uTime,0.,.0*uTime));
   vec3 c = vec3(.1,0.,0.);
   c = mix(c, vec3(0,.4,1.), min(t,.5));
   if (t > 0.65)
      c = mix(c, vec3(.2,.3,.5), (t-.65) / (.7 - .65));
   fragColor = vec4(sqrt(c), 1.);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

