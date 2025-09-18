/********************************************

When we ray trace to more than one sphere,
we need to keep track of which sphere is
nearest to the viewpoint origin.

In other words -- which sphere intersects
the ray with the lowest value of t.

To make this easier to see, we can also shade
each sphere a different color.

You can also animate the spheres from within
the fragment shader, although this could be
very inefficient.

*********************************************/

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

vec2 raySphere(vec3 V, vec3 W, vec4 S) {
   V -= S.xyz;
   float b = dot(V, W);
   float d = b * b - dot(V, V) + S.w * S.w;
   if (d < 0.)
      return vec2(1001.,1000.);
   return vec2(-b - sqrt(d), -b + sqrt(d));
}

vec3 L1 = vec3(1.,1.,1.) / 1.732;
vec3 L2 = vec3(-1.,-1.,-.5) / 1.5;
vec3 C = vec3(1.);

vec3 shadeSphere(vec4 S, vec3 P) {
   vec3 N = (P - S.xyz) / S.w;
   return C * (.1 + max(0., dot(N, L1))
                  + max(0., dot(N, L2)));
}

/*
vec3 shadeSphere(vec4 S, vec3 P, vec3 C) {
   vec3 N = (P - S.xyz) / S.w;
   return C * (.1 + max(0., dot(N, L1))
                  + max(0., dot(N, L2)));
}
*/

vec4 S0 = vec4(-.3,0.,0.,.4);
vec4 S1 = vec4( .3,0.,.3,.4);

void main() {
// vec4 S0 = vec4(-.3*sin(uTime),0.,0.,.4);
// vec4 S1 = vec4( .3*sin(uTime),0.,.3,.4);

   vec4 F = vec4(0.);
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);
   float t = 100.;

   vec2 tt0 = raySphere(V, W, S0);
   if (tt0.x < tt0.y && tt0.x > 0. && tt0.x < t) {
      t = tt0.x;
      vec3 P = V + t * W;
      F = vec4(shadeSphere(S0,P),1.);
//    F = vec4(shadeSphere(S0,P,vec3(1,.5,.5)),1.);
   }

   vec2 tt1 = raySphere(V, W, S1);
   if (tt1.x < tt1.y && tt1.x > 0. && tt1.x < t) {
      t = tt1.x;
      vec3 P = V + t * W;
      F = vec4(shadeSphere(S1,P),1.);
//    F = vec4(shadeSphere(S1,P,vec3(.5,.7,1)),1.);
   }

   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now() / 1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

