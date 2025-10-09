// GENERAL PARAMETRIC: TUBE, SPHERE, TORUS
function Scene() {

//gotoFigure('general');

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

let tube = n => parametric((u,v) => {
   let theta = 2 * Math.PI * u;
   let c = Math.cos(theta);
   let s = Math.sin(theta);
   return [c,s,2*v-1, c,s,0];
},n,2);

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

let torus = (nu,nv,r) => parametric((u,v,r) => {
   let theta = 2 * Math.PI * u,
       cu = Math.cos(theta),
       su = Math.sin(theta);
   let phi = 2 * Math.PI * v,
       cv = Math.cos(phi),
       sv = Math.sin(phi);
   return [(1+r*cv)*cu,(1+r*cv)*su,r*sv, cv*cu,cv*su,sv];
   
},nu,nv,r);

mesh = {
   triangle_strip: true,
// data: new Float32Array(torus(30,6,.1)),
   data: new Float32Array(sphere(20,10)),
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

let startTime = Date.now()/1000;

this.update = () => {
   let time = Date.now() / 1000 - startTime;
   let m = mxm(perspective(0,0,-.5),
           mxm(turnX(time),
           mxm(turnY(time),
	       scale(.5,.4,.3))));
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
}

}
