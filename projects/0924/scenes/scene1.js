function Scene() {

let NS = 1;
let NL = 2;

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

vec3 shadeSphere(vec4 S, vec3 P, vec3 C) {
   vec3 N = (P - S.xyz) / S.w;
   vec3 shade = vec3(.1);
   for (int l = 0 ; l < `+NL+` ; l++)
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
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);

   setUniform('4fv', 'uS', [ 0,0,0,.4 ]);

   setUniform('3fv', 'uC', [ 1,1,1 ]);

   setUniform('3fv', 'uL', [ normalize([1,1,1]),
                             normalize([-1,-1,-.5]),
			   ].flat());

   setUniform('3fv', 'uLC', [ .5,.7,1,
                              .2,.15,.1,
			    ]);
}

}
