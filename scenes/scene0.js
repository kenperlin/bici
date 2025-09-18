/**************************************

LET'S TALK ABOUT MATRICES

4x4 Matrices are how we describe
linear transformations.

Useful primitive operations for 3D
linear transformationsions:

	Identity
	Translation
	Rotation about X
	Rotation about Y
	Rotation about Z
	Scale

Identity()          

	1	0	0	0
	0	1	0	0
	0	0	1	0
	0	0	0	1

Translate(a,b,c)

	1	0	0	a
	0	1	0	b
	0	0	1	c
	0	0	0	1
 
RotateX(a)

	1	0	0	0
	0     cos(a) -sin(a)	0
	0     sin(a)  cos(a)	0
	0	0	0	1
 
RotateY(a)

      cos(a)	0     sin(a)	0
	0	1	0	0
     -sin(a)	0     cos(a)	0
	0	0	0	1
 
RotateZ(a)

      cos(a) -sin(a)	0	0
      sin(a)  cos(a)	0	0
	0	0	1	0
	0	0	0	1
 
Scale(a,b,c)

	a	0	0	0
	0	b	0	0
	0	0	c	0
	0	0	0	1
 
Given two matrices A and B, we multiply
them by taking the dot products of each
row of A with each column of B.

**************************************/













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
uniform vec3 uP;
uniform vec3 uS[480];
in  vec3 vPos;
out vec4 fragColor;
vec4 raySphere(vec3 V,vec3 W,vec4 S,
               vec3 C,vec4 F){
   V -= S.xyz;
   float b = dot(V, W);
   float d = b*b - dot(V,V) + S.w*S.w;
   if (d < 0.)
      return F;
   float t = -b - sqrt(d);
   if (t < F.w) {
    vec3 N=(((V+S.xyz)+t*W)-S.xyz)/S.w;
    return vec4(N, t);
   }
   return F;
}
void main() {
   vec3 V = uP;
   vec3 W = normalize(
            vec3(vPos.xy-uP.xy,-V.z));
   vec3 C = vec3(1.,.85,.75);
   vec4 F = vec4(0.,0.,0.,1000.);
   for (int i = 0 ; i < 480 ; i++)
      F = raySphere(V, W,
        vec4(vec3(0.,.3,0.) +
	   uS[i]/3.,.1), C, F);
   if (F.w > 0. && F.w < 1000.)
      fragColor = vec4(C *
      (.1+.5*max(0., F.x+F.y+F.z) +
          .5*max(0.,-F.x-F.y-F.z/2.)),
	  1.);
   else
      fragColor = vec4(0.);
}`;

let t0 = Date.now() / 1000;
this.update = viewPoint => {
   let time = Date.now() / 1000 - t0;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uP', viewPoint);
   setMatrix(time);
   let xf=p=>M.transform(p).slice(0,3);
   let S = [];
   for (let u = -1 ; u <= 1 ; u += 2)
   for (let v = -1 ; v <= 1 ; v += 2)
   for (let t = -1 ; t <= 1 ; t+=.05) {
       S.push(xf([t,u,v,1]));
       S.push(xf([v,t,u,1]));
       S.push(xf([u,v,t,1]));
   }
   setUniform('3fv', 'uS', S.flat());
}
let cos = Math.cos;
let sin = Math.sin;



















let setMatrix = time => {
   M.identity();
}






































}
