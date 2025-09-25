/**********************************

    Ax² + Bxy + Cxz + Dx +
          Ey² + Fyz + Gy +
                Hz² + Iz +
                      J   =   0

    V + t * W = [ Vx + t * Wx,
                  Vy + t * Wy,
                  Vz + t * Wz ]

      A (Vx + t * Wx) (Vx + t * Wx)
    + B (Vx + t * Wx) (Vy + t * Wy)
    + C (Vx + t * Wx) (Vz + t * Wz)
    + D (Vx + t * Wx)
    + E (Vy + t * Wy) (Vy + t * Wy)
    + F (Vy + t * Wy) (Vz + t * Wz)
    + G (Vy + t * Wy)
    + H (Vz + t * Wz) (Vz + t * Wz)
    + I (Vz + t * Wz)
    + J

  a t² + b t + c = 0

  a = A * Wx * Wx
    + B * Wx * Wy
    + C * Wz * Wx
    + E * Wy * Wy
    + F * Wy * Wz
    + H * Wz * Wz

  b = 2 * A *  Vx * Wx
    +     B * (Wx * Vy + Vy * Wx)
    +     C * (Vz * Wx + Vx * Wz)
    +     D *  Wx
    + 2 * E *  Vy * Wy
    +     F * (Vy * Wz + Vz * Wy)
    +     G *  Wy
    + 2 * H *  Vz * Wz
    +     I *  Wz

  c = A * Vx * Vx
    + B * Vx * Vy
    + C * Vz * Vx
    + D * Vx
    + E * Vy * Vy
    + F * Vy * Vz
    + G * Vy
    + H * Vz * Vz
    + I * Vz
    + J

**********************************/

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
uniform mat4 uQ;

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

   vec3 eq = rayEq(V, W, uQ);
   vec2 tt = findRoots(eq);

   if (tt.x < tt.y) {
      vec3 P = V + tt.x * W;
      vec3 N = normalQ(uQ, P);
      float c = .1 + max(0., dot(N, vec3(.5)));
      fragColor = vec4(c,c,c, 1.);
   }

}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
   setUniform('Matrix4fv', 'uQ', false, [1,0,0,0,
                                         0,1,0,0,
					 0,0,1,0,
					 0,0,0,-.25]);
}

}
