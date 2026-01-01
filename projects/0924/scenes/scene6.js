/**********************************

Sphere         x*x + y*y + z*z - 1 <= 0

Paraboloid X   x + y*y + z*z <= 0
Paraboloid Y   x*x + y + z*z <= 0
Paraboloid Z   x*x + y*y + z <= 0

Slab X         x*x - 1 <= 0
Slab Y         y*y - 1 <= 0
Slab Z         z*z - 1 <= 0

Tube X         y*y + z*z - 1 <= 0
Tube Y         x*x + z*z - 1 <= 0
Tube Z         x*x + y*y - 1 <= 0

All space      -1 <= 0

**********************************/

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
uniform mat4 uQ[3];

in  vec3 vPos;
out vec4 fragColor;

vec3 rayEq(vec3 V, vec3 W, mat4 Q) {

   float A = Q[0].x, B = Q[1].x+Q[0].y, C = Q[2].x+Q[0].z, D = Q[3].x+Q[0].w,
                     E = Q[1].y       , F = Q[2].y+Q[1].z, G = Q[3].y+Q[1].w,
                                        H = Q[2].z       , I = Q[3].z+Q[2].w,
                                                           J = Q[3].w       ;

   float a = A * W.x * W.x +
             B * W.x * W.y +
             C * W.z * W.x +
             E * W.y * W.y +
             F * W.y * W.z +
             H * W.z * W.z ;

   float b = 2. * A * V.x * W.x +
                  B * (W.x * V.y + V.y * W.x) +
                  C * (V.z * W.x + V.x * W.z) +
                  D * W.x +
             2. * E * V.y * W.y +
                  F * (V.y * W.z + V.z * W.y) +
                  G * W.y +
             2. * H * V.z * W.z +
                  I * W.z;

   float c = A * V.x * V.x +
             B * V.x * V.y +
             C * V.z * V.x +
             D * V.x       +
             E * V.y * V.y +
             F * V.y * V.z +
             G * V.y       +
             H * V.z * V.z +
             I * V.z       +
             J;

   return vec3(a,b,c);
}

vec2 findRoots(vec3 eq) {
   float a = eq.x, b = eq.y, c = eq.z;
   vec2 t = vec2(-1.);
   float discr = b * b - 4. * a * c;
   if (discr >= 0.)
      t = vec2(-b - sqrt(discr), -b + sqrt(discr)) / (2. * a);
   return t;
}

vec3 normalQ(mat4 Q, vec3 P) {

   float A = Q[0].x, B = Q[1].x+Q[0].y, C = Q[2].x+Q[0].z, D = Q[3].x+Q[0].w,
                     E = Q[1].y       , F = Q[2].y+Q[1].z, G = Q[3].y+Q[1].w,
                                        H = Q[2].z       , I = Q[3].z+Q[2].w,
                                                           J = Q[3].w       ;

   return normalize(vec3(2. * A * P.x + C * P.z + B * P.y + D,
                         2. * E * P.y + F * P.z + B * P.x + G,
                         2. * H * P.z + F * P.y + C * P.x + I));
}

void main() {
   fragColor = vec4(0.);

   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);

   vec3 color = vec3(0.);
   vec2 tI = vec2(-1.,1000.);
   for (int i = 0 ; i < 3 ; i++) {
      vec2 tQ = findRoots(rayEq(V, W, uQ[i]));
      if (tQ.x > tI.x) {
         vec3 N = normalQ(uQ[i], V + tQ.x * W);
         color = vec3(.1 + max(0., dot(N, vec3(.5))));
	 tI.x = tQ.x;
      }
      if (tQ.y < tI.y)
         tI.y = tQ.y;
   }
   if (tI.x > 0. && tI.x < tI.y)
      fragColor = vec4(sqrt(color), 1.);
}`;

let mxm = (a,b) => {
   let m = [];
   for (let c = 0 ; c < 16 ; c += 4)
   for (let r = 0 ; r < 4 ; r++)
      m.push( a[r]*b[c] + a[r+4]*b[c+1] + a[r+8]*b[c+2] + a[r+12]*b[c+3] );
   return m;
}

let transpose = m => [ m[0],m[4],m[ 8],m[12],
                       m[1],m[5],m[ 9],m[13],
                       m[2],m[6],m[10],m[14],
                       m[3],m[7],m[11],m[15] ];

let inverse = src => {
   let dst = [], det = 0, cofactor = (c, r) => {
      let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
      return (c+r & 1 ? -1 : 1) * ( (s(1,1)*(s(2,2)*s(3,3)-s(3,2)*s(2,3)))
                                  - (s(2,1)*(s(1,2)*s(3,3)-s(3,2)*s(1,3)))
                                  + (s(3,1)*(s(1,2)*s(2,3)-s(2,2)*s(1,3))) );
   }
   for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
   for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
   for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
   return dst;
}

let qxm = (Q,M) => {
   let MI = inverse(M);
   return mxm(transpose(MI), mxm(Q, MI));
}

let startTime = Date.now()/1000;

this.update = viewPoint => {
   vertexMap(['aPos', 3]);
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);

   setUniform('Matrix4fv', 'uQ', false,
      qxm(sphere,scale(.3)));
/*
   setUniform('Matrix4fv', 'uQ', false,
      [ qxm(slabX,mxm(turnY(time),scale(.2))),
        qxm(slabY,mxm(turnY(time),scale(.2))),
        qxm(slabZ,mxm(turnY(time),scale(.2))) ].flat());
*/
}

}
