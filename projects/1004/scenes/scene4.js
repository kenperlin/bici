// WOOD
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

float fractal(vec3 P) {
   float f = 0., s = 1.;
   for (int i = 0 ; i < 9 ; i++) {
      f += noise(s * P) / s;
      s *= 2.;
      P = vec3(.866*P.x + .5*P.z, P.y + 100., -.5*P.x + .866*P.z);
   }
   return f;
}

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
   float v = turbulence(pos);
   float s = sqrt(.5 + .5 * sin(20. * pos.y + 8. * v));
   return vec3(.8,.7,.5) * vec3(s,s*s,s*s*s);
}

vec3 wood(vec3 pos) {
// pos.y += .5 * turbulence(.4*pos); //------
   vec3 c = vec3(1.,.42,.15) *
            mix(1.5, .1,
	        .5 + .25 * turbulence(vec3(.5,40.,40.) * pos+2.*sin(pos))
                   + .25 * turbulence(vec3(40.,40.,.5) * pos+2.*sin(pos)));
   c = vec3(1.); //------
   c *= .3 + .7 * pow(abs(sin(10. * pos.y)), .4);
   return c;
}

void main() {
   vec4 F = vec4(0.);
   float x = 2. * vPos.x;
   float y = 2. * vPos.y;
   float rr = x*x + y*y;
   vec3 ambient = vec3(.1);
   vec3 diffuse = vec3(.8);
   vec4 specular = vec4(1.,1.,1.,10.);

   if (rr < 1.) {
      float z = sqrt(1. - rr);
      vec3 N = vec3(x,y,z);
      vec3 L1 = normalize(vec3(1.));
      vec3 R1 = 2. * N * dot(N,L1) - L1;
      vec3 L2 = normalize(vec3(-1.));
      vec3 R2 = 2. * N * dot(N,L2) - L2;
      vec3 c = ambient + diffuse * max(0., dot(L1,N))
                       + specular.rgb * pow(max(0.,R1.z), specular.a)
                       + .3*diffuse * max(0., dot(L2,N))
                       + .3*specular.rgb * pow(max(0.,R2.z), specular.a);
      F = vec4(c * wood(vPos),1.);
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

