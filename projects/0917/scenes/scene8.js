/********************************************

You can have fun with it, creating cool
movements of objects around each other.

*********************************************/

function Scene() {

mesh = { data: new Float32Array([-1, 1,0, -1,-1,0,  1,1,0,
                                 -1,-1,0,  1,-1,0,  1,1,0]) };

let NS = 3;
let NL = 3;

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

uniform vec4 uS[`+NS+`];
uniform vec3 uC[`+NS+`],uL[`+NL+`],uLC[`+NL+`];

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

bool inShadow(vec3 P, vec3 L) {
   for (int i = 0 ; i < `+NS+` ; i++) {
      vec2 tt = raySphere(P, L, uS[i]);
      if (tt.x < tt.y && tt.x > 0.)
         return true;
   }
   return false;
}

vec3 shadeSphere(vec4 S, vec3 P, vec3 C) {
   vec3 N = (P - S.xyz) / S.w;

   vec3 shade = vec3(.1);

   shade *= .5 + .5 * sin(20. * N.y);

   for (int l = 0 ; l < `+NL+` ; l++)
      if (! inShadow(P, uL[l]))
         shade += uLC[l] * max(0., dot(N, uL[l]));
   return C * shade;
}

void main() {
   vec4 F = vec4(0.);
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);
   float t = 100.;

   for (int i = 0 ; i < `+NS+` ; i++) {
      vec2 tt = raySphere(V, W, uS[i]);
      if (tt.x < tt.y && tt.x > 0. && tt.x < t) {
         t = tt.x;
	 vec3 P = V + t * W;
         F = vec4(shadeSphere(uS[i],P,uC[i]),1.);
      }
   }

   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now()/1000;

let normalize = v => {
   let s = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
   return [ v[0]/s, v[1]/s, v[2]/s ];
}

this.update = viewPoint => {
   vertexMap(['aPos', 3]);
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);

   let s = Math.sin(time);
   let c = Math.cos(time);

   setUniform('4fv', 'uS', [ -.3*s,0,0,.4,
                              .3*s,0,.3,.4,
                              .7*c,.7*s,.0,.2 ]);
/*
   setUniform('4fv', 'uS', [ .7*c,.7*s,  0 ,.3,
                             .7*s,  0 ,.7*c,.3,
                               0 ,.7*c,.7*s,.3 ]);
*/
   setUniform('3fv', 'uC', [ 1,.5,.5,
                             .5,.7,1,
                             .5,1,.5 ]);

   setUniform('3fv', 'uL', [ normalize([1,1,1]),
                             normalize([-1,-1,-.5]),
                             normalize([0,-1,0])
			   ].flat());

   setUniform('3fv', 'uLC', [ .5,.7,1,
                              .2,.15,.1,
			      .5,0,0 ]);
}

}
