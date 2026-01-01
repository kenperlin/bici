/*********************************************

HOW TO RAY TRACE TO A SPHERE:

Given a ray (V•W):

        (x,y,z) = V + t * W

and a sphere (Cx,Cy,Cz,R):

        (x - Cx)² + (y - Cy)² + (z - Cz)² = R²

find the intersection of the ray and sphere.

(1) Cool trick: Move ray origin to sphere center:

        V -= C

    That makes the sphere equation simpler:

        x² + y² + z² = R²

(2) Substitute ray equation into sphere equation:

        (Vx + t*Wx)² +          
                                       
        (Vy + t*Wy)² +          
                                       
        (Vz + t*Wz)² = R²       

(3) Separate the square, linear & constant terms:

        (Wx*Wx + Wy*Wy + Wz*Wz) * t² + 

    2 * (Vx*Wx + Vy*Wy + Vz*Wz) * t +

         Vx*Vx + Vy*Vy + Vz*Vz  =     R²

(4) This is more compact in dot product notation:

        (W•W)*t² + 2*(V•W)*t + V•V = R²

(5) Now we have a quadratic equation in t:

        A t² + B t + C = 0

    where:

        A = W•W
        B = 2*(V•W)
        C = V•V - R²

(6) Solve for t, using the quadratic equation:

        t = (-B ± sqrt(B² - 4*A*C)) / (2*A)

We can simplify this:

    We've already set the length of W to 1,
    so we know W•W = 1. Therefore we can use
    a special case of the quadratic equation:

        t = -B/2 ± sqrt((B/2)² - C)

*********************************************/

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
vec3 C = vec3(.5,.5,1);

vec3 shadeSphere(vec4 S, vec3 P) {
   vec3 N = (P - S.xyz) / S.w;
   return C * (.1 + .5 * max(0., dot(N, L1))
                  + .5 * max(0., dot(N, L2)));
}

vec4 S = vec4(0.,0.,0.,.4);

void main() {
   vec4 F = vec4(0.);
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);
   vec2 tt = raySphere(V, W, S);
   if (tt.x < tt.y && tt.x > 0.) {
      vec3 P = V + tt.x * W;
      F = vec4(shadeSphere(S, P), 1.);
   }
   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   vertexMap(['aPos', 3]);
   let time = Date.now() / 1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

