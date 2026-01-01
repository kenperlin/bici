// IMPLEMENTING A PROPER MATRIX CLASS
function Scene() {

//gotoFigure('matrix');

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
  data: new Float32Array(torus(30,6,.1)),
};

this.vertexShader = `\
#version 300 es
` + noiseCode + `
uniform mat4 uMF, uMI;
uniform float uTime;
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
uniform vec3 uColor;
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   vec3 nor = normalize(vNor);
   vec3 c = uColor * (.1 + max(0., dot(vec3(.5),nor)));
   fragColor = vec4(c, 1.);
}`;

autodraw = false;
/*
function Matrix() {
   let m = [identity()], top = 0;
   this.push = () => { m[top+1] = m[top].slice(); top++; return this; }
   this.pop  = () => { if (top > 0) top--; return this; }
   this.get = () => m[top];
   this.identity = () => { m[top] = identity(); return this; }
   this.move = (x,y,z) => { m[top]=mxm(m[top],move(x,y,z)); return this; }
   this.turnX = a => { m[top] = mxm(m[top], turnX(a)); return this; }
   this.turnY = a => { m[top] = mxm(m[top], turnY(a)); return this; }
   this.turnZ = a => { m[top] = mxm(m[top], turnZ(a)); return this; }
   this.scale = (x,y,z) => {
      m[top] = mxm(m[top], scale(x,y,z));
      return this;
   }
   this.perspective = (x,y,z) => {
      m[top] = mxm(m[top], perspective(x,y,z));
      return this;
   }
}
*/
let matrix = new Matrix();

let startTime = Date.now()/1000;

let drawMyMesh = (mesh, color) => {
   setUniform('3fv', 'uColor', color);
   let m = mxm(perspective(0,0,-.1), matrix.get());
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   drawMesh(mesh);
}

let t1 = {
   triangle_strip: true,
   data: new Float32Array(torus(30,6,.1))
};
let t2 = {
   triangle_strip: true,
   data: new Float32Array(torus(30,6,.3))
};

this.update = () => {
   vertexMap(['aPos', 3, 'aNor', 3]);
   let time = Date.now() / 1000 - startTime;
   setUniform('1f', 'uTime', time);
   matrix.identity().turnX(time);
   matrix.push();
      matrix.scale(.5);
      drawMyMesh(t1, [1,0,0]);
   matrix.pop();
   matrix.push();
      matrix.scale(.25);
      drawMyMesh(t2, [0,1,1]);
   matrix.pop();
}

}
