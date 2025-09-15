function Scene6() {

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
uniform vec4 uS[2];
uniform vec3 uC[2];
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
   return .1 + .5 * max(0., N.x+N.y+N.z) +
               .5 * max(0.,-N.x-N.y-N.z/2.);
}

void main() {
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);

   fragColor = vec4(0.);

   float t = 2000.;
   for (int i = 0 ; i < 2 ; i++) {
      vec2 tt = raySphere(V, W, uS[i]);
      if (tt.x < tt.y && tt.x < t) {
	 t = tt.x;
         float c = shadeSphere(V + t * W, uS[i]);
         fragColor = vec4(uC[i] * c, 1.);
      }
   }
   fragColor = vec4(sqrt(fragColor.rgb),fragColor.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   setUniform('1f', 'uTime', Date.now()/1000 - startTime);
   setUniform('3fv', 'uViewPoint', viewPoint);
   setUniform('4fv', 'uS', [ -.15,-.15,-.1,.3,
                              .15, .15, .1,.3 ]);
   setUniform('3fv', 'uC', [ 1,.5,.5, .5,.7,1 ]);
}

}
