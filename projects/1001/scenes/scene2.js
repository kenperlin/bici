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

void main() {
   float t = .5 + .5 * vPos.y;
   float f = 1.;
   for (int i = 0 ; i < 8 ; i++) {
      t += noise(f * vPos - vec3(.1*uTime,0.,0.)) / f;
      f *= 2.;
   }
   vec3 c = vec3(0.,.2,.5);
   if (t > .5)
      c = mix(c, vec3(.2,.3,.5), (t-.5) / .2);
   if (t > .7)
      c = mix(c, vec3(1.), (t-.7) / .3);
   if (t > 1.)
      c = vec3(1.);
   fragColor = vec4(sqrt(c), 1.);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

