// DRAGON PLANET
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
   float x = 2. * vPos.x;
   float y = 2. * vPos.y;
   float dz = sqrt(1.-x*x-y*y);                      /* DEPTH  */
   float s = .3*x + .3*y + .9*dz; s *= s; s *= s;    /* LIGHT  */
   float cR = cos(.2*uTime), sR = sin(.2*uTime);     /* MOTION */
   float cV = cos(.1*uTime), sV = sin(.1*uTime);
   vec3 P = vec3(cR*x+sR*dz+cV,y,-sR*x+cR*dz+sV);
   float g = turbulence(P);                          /* CLOUDS */
   float d = 1. - 1.1 * (x*x + y*y);                 /* EDGE   */
   d = d>0. ? .1+.05*g+.6*(.1+g)*s*s : max(0.,d+.05);
   float f = -.2 + sin(4. * P.x + 8. * g + 4.);      /* FIRE   */
   f = f > 0. ? 1. : 1. - f * f * f;
   f *= d > .1 ? 1. : (g + 5.) / 3.;
   vec3 color = vec3(d*f*f*.85, d*f, d*.7);          /* COLOR  */
   fragColor = vec4(color,min(1.,100.*d));
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   vertexMap(['aPos', 3]);
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

