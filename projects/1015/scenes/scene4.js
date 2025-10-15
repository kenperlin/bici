
// ANIMATE ALONG A SPLINE

function Scene() {

// GENERTIC PARAMETRIC SURFACE

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

// PARAMETRIC SPHERE

let sphere = (nu,nv) => parametric((u,v) => {
   let theta = 2 * Math.PI * u;
   let phi = Math.PI * (v - 1/2);
   let cu = Math.cos(theta);
   let su = Math.sin(theta);
   let cv = Math.cos(phi);
   let sv = Math.sin(phi);
   let x = cu * cv, y = su * cv, z = sv;
   return [x,y,z, x,y,z];
},nu,nv);

// EVALUATE A POINT ALONG A BEZIER SPLINE

let evalBezier = (t, BX, BY) => {
   let nk = (BX.length-1) / 3;

   // MATH TO EVALUATE A POINT ALONG A BEZIER SPLINE

   let M = [ [-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t)+Vi(V,1,t)+Vi(V,2,t)+Vi(V,3,t);

   // FIND THE SPLINE SEGMENT AND POSITION IN THE SEGMENT

   let n = nk * t - .001 >> 0;
   let f = nk * t - n;

   // EVAL AND RETURN THE X AND Y COORDINATES OF THE POINT

   return [ C(BX.slice(3*n), f), C(BY.slice(3*n), f) ];
}

mesh = {
   triangle_strip: true,
   data: new Float32Array(sphere(20,10))
};

// GLSL SHADERS

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
   fragColor = vec4(c,0.,0., 1.);
}`;

let startTime = Date.now() / 1000;

// ANIMATE ALONG THE PATH AND RENDER THE SHAPE

this.update = () => {
   let time = Date.now() / 1000;
   let p = evalBezier(time/2 % 1, _.BX, _.BY);
   let m = mxm(perspective(0,0,-.5),
           mxm(move(p[0],p[1],0),
	       scale(.2)));
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
}

}
