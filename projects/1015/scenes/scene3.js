
// EXTRUSION

function Scene() {

let parametric = (f,nu,nv,other) => {
   let V = [];
   for (let j = 0 ; j < nv ; j++) {
      for (let i = 0 ; i <= nu ; i++) {
         V.push(f(i/nu,j/nv,other));
         V.push(f(i/nu,(j+1)/nv,other));
      }
      V.push(f(1,(j+1)/nv,other));
      V.push(f(0,(j+1)/nv,other));
   }
   return V.flat();
}

let wire = (nu,nv,B) => parametric((u,v,B) => {

   // EXTRACT THE BEZIER PATH DATA AND TUBE RADIUS

   let BX = B[0], BY = B[1], r = B[2], nk = (BX.length-1)/3;

   // MATH TO EVALUATE A BEZIER SPLINE

   let M = [ [-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t)+Vi(V,1,t)+Vi(V,2,t)+Vi(V,3,t);

   // FIND THE SPLINE SEGMENT AND POSITION IN THE SEGMENT

   let n = nk * u - .001 >> 0;
   let f = nk * u - n;

   // FIND THE POINT ON THE SPLINE PATH

   let x = C(BX.slice(3*n), f);
   let y = C(BY.slice(3*n), f);

   // FIND THE DIRECTION ALONG THE SPLINE PATH

   let V = normalize([ C(BX.slice(3*n),f+.001) - x,
                       C(BY.slice(3*n),f+.001) - y ]);

   // FIND POINT AND NORMAL ON TUBE

   let c = Math.cos(2 * Math.PI * v);
   let s = Math.sin(2 * Math.PI * v);
   let N = [ -V[1] * c, V[0] * c, s ];
   let P = [ x + r * N[0], y + r * N[1], r * N[2] ];

   // RETURN POINT AND NORMAL

   return [ P[0],P[1],P[2], N[0],N[1],N[2] ];
},nu,nv,B);

mesh = {
   triangle_strip: true,
   data: new Float32Array(wire(100,10,[_.BX, _.BY, .05])),
};

this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-.1,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
}`;

this.fragmentShader = `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .1 + max(0., dot(vec3(.5),nor));
   fragColor = vec4(c,c,c, 1.);
}`;

autodraw = false;

let drawMeshAt = (mesh, m) => {
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   drawMesh(mesh);
}

let startTime = Date.now() / 1000;

this.update = () => {
   let time = Date.now() / 1000;
   let m = mxm(perspective(0,0,-.5), turnY(0 * time));
   drawMeshAt(mesh, m);
}

}
