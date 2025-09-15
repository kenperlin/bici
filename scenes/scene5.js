function Scene5() {

this.vertexShader = `\
#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

this.fragmentShader = `\
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
   float sd = sqrt(d);
   return vec2(-b-sd, -b+sd);
}

float shadeSphere(vec3 P, vec4 S) {
   vec3 N = (P - S.xyz) / S.w;
   return .1 + .5 * max(0., N.x+N.y+N.z)
             + .5 * max(0.,-N.x-N.y-N.z/2.);
}

void main() {
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);

   fragColor = vec4(0.);

   vec4 S1 = vec4(-.15,.15,-.1,.3);

   vec2 tt1 = raySphere(V, W, S1);
   if (tt1.x < tt1.y) {
      vec3 C = vec3(1.,.5,.5) * shadeSphere(V+tt1.x*W,S1);
      fragColor = vec4(C, 1.);
   }

   vec4 S2 = vec4(.15,-.15,.1,.3);

   vec2 tt2 = raySphere(V, W, S2);
   if (tt2.x < tt2.y && tt2.x < tt1.x) {
      vec3 C = vec3(.5,.7,1.) * shadeSphere(V+tt2.x*W,S2);
      fragColor = vec4(C, 1.);
   }

   fragColor = vec4(sqrt(fragColor.rgb), fragColor.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   setUniform('1f', 'uTime', Date.now()/1000 - startTime);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}
