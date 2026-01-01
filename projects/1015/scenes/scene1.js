
// DATA DESCRIBING ONE BEZIER PATCH

_.X = [ -.60,-.20, .20, .60 ,
        -.60,-.20, .20, .60 ,
        -.60,-.20, .20, .60 ,
        -.60,-.20, .20, .60 ];

_.Y = [ -.60,-.60,-.60,-.60 ,
        -.20,-.20,-.20,-.20 ,
         .20, .20, .20, .20 ,
         .60, .60, .60, .60 ];

_.Z = [ -.40,-.40,-.40,-.40 ,
        -.40, .40, .40,-.40 ,
        -.40, .40, .40,-.40 ,
        -.40,-.40,-.40,-.40 ];

function Scene() {

// GENERIC PARAMETRIC SURFACE

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

// BUILD A BEZIER PATCH AS A PARAMETRIC SURFACE

let bezierPatch = (nu,nv,patch) => parametric((u,v,patch)=>{

   // EXTRACT THE BEZIER PATCH DATA

   let BX = patch[0], BY = patch[1], BZ = patch[2];

   // MATH TO EVALUATE A BEZIER SPLINE

   let M = [ [-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t)+Vi(V,1,t)+Vi(V,2,t)+Vi(V,3,t);

   // MATH TO FIND THE POSITION OF ONE POINT ON THE PATCH

   let bezier = (u,v) => {
      let Xu = [], Yu = [], Zu = [];
      for (let i = 0 ; i < 16 ; i += 4) {
         Xu.push(C(BX.slice(i,i+4), u));
         Yu.push(C(BY.slice(i,i+4), u));
         Zu.push(C(BZ.slice(i,i+4), u));
      }
      return [ C(Xu,v), C(Yu,v), C(Zu,v) ];
   }

   // COMPUTE AND RETURN THE POINT AND NORMAL ON THE PATCH

   let P = bezier(u,v),
       N = normalize(cross(subtract(bezier(u+.001,v),P),
                           subtract(bezier(u,v+.001),P)));
   return [ P[0],P[1],P[2], N[0],N[1],N[2] ];

},nu,nv,patch);

// SAVE THE PATCH AS A SINGLE GEOMETRY MESH

mesh = {
   triangle_strip: true,
   data: new Float32Array(bezierPatch(10,10,[_.X,_.Y,_.Z])),
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
   fragColor = vec4(c,c,c, 1.);
}`;

// PLACE THE PATCH IN THE SCENE

this.update = () => {
   vertexMap(['aPos', 3, 'aNor', 3]);
   let m = mxm(perspective(0,0,-.5),
           mxm(turnY(_.theta??0),turnX(_.phi??0)));
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
}

}
