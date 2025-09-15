function Scene9() {

let NS = 2;
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
uniform float uTime;
uniform vec3 uViewPoint;
uniform vec4 uS[`+NS+`];
uniform vec3 uC[`+NS+`], uL[`+NL+`], uLC[`+NL+`];
in  vec3 vPos;
out vec4 fragColor;

vec2 raySphere(vec3 V, vec3 W, vec4 S) {
   V -= S.xyz;
   float b = dot(V, W);
   float d = b * b - dot(V, V) + S.w * S.w;
   float sd = sqrt(d);
   return d < 0. ? vec2(-1.,-2.) : vec2(-b-sd, -b+sd);
}
float shadeSphere(vec3 P, vec4 S, vec3 L) {
   vec3 N = (P - S.xyz) / S.w;
   return max(0., dot(N, L));
}
void main() {
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);

   fragColor = vec4(0.);
   float t = 2000.;
   for (int i = 0 ; i < `+NS+` ; i++) {
      vec2 tt = raySphere(V, W, uS[i]);
      if (tt.x < tt.y && tt.x > 0. && tt.x < t) {
	 t = tt.x;
         vec3 P = V + t * W;
         vec3 c = vec3(.1);
	 vec3 p = (P - uS[i].xyz) / uS[i].w;
         c *= .5 + .5 * sin(20. * p.y);
	 for (int l = 0 ; l < `+NL+` ; l++) {
	    vec3 V = P + .0001 * uL[l], W = uL[l];
	    float s = 0.;
	    for (int i = 0 ; i < `+NS+` ; i++) {
	       vec2 tt = raySphere(V, W, uS[i]);
               if (tt.x < tt.y && tt.x > 0.)
	          s = 1.;
            }
	    if (s == 0.)
               c += uLC[l]*shadeSphere(P,uS[i],uL[l]);
         }
         fragColor = vec4(uC[i] * c, 1.);
      }
   }
   fragColor = vec4(sqrt(fragColor.rgb), fragColor.a);
}`;

let startTime = Date.now() / 1000;

let normalize = v => {
   let s = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
   return [ v[0]/s, v[1]/s, v[2]/s ];
}

this.update = viewPoint => {
   let time = Date.now() / 1000 - startTime;
   let x = .7 * Math.cos(time);
   let z = .7 * Math.sin(time);
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
   setUniform('4fv', 'uS', [ 0,0,0,.3, x,0,z,.3 ]);
   setUniform('3fv', 'uC', [ 1,.5,.5, .5,.7,1 ]);
   setUniform('3fv', 'uL', [ normalize([1,1,1]),
                             normalize([-1,-1,-.5]) ].flat());
   setUniform('3fv', 'uLC', [ .5,.7,1, .3,.2,.1 ]);
}

}
