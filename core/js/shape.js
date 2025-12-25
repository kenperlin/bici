
let Shape = {

squareData: [
  -1,-1, 0, 0, 0, 1, 0,0,  -1, 1, 0, 0, 0, 1, 0,1,
   1,-1, 0, 0, 0, 1, 1,0,   1, 1, 0, 0, 0, 1, 1,1, 
],

cubeData: [
  -1,-1,-1, 0, 0,-1, 0,1,   1,-1,-1, 0, 0,-1, 1,1,   1, 1,-1, 0, 0,-1, 1,0, 
   1, 1,-1, 0, 0,-1, 1,0,  -1, 1,-1, 0, 0,-1, 0,0,  -1,-1,-1, 0, 0,-1, 0,1, 
  -1,-1, 1, 0, 0, 1, 0,0,   1,-1, 1, 0, 0, 1, 1,0,   1, 1, 1, 0, 0, 1, 1,1, 
   1, 1, 1, 0, 0, 1, 1,1,  -1, 1, 1, 0, 0, 1, 0,1,  -1,-1, 1, 0, 0, 1, 0,0, 
  
  -1,-1,-1, 0,-1, 0, 0,1,   1,-1,-1, 0,-1, 0, 0,0,   1,-1, 1, 0,-1, 0, 1,0, 
   1,-1, 1, 0,-1, 0, 1,0,  -1,-1, 1, 0,-1, 0, 1,1,  -1,-1,-1, 0,-1, 0, 0,1, 
  -1, 1,-1, 0, 1, 0, 0,0,   1, 1,-1, 0, 1, 0, 0,1,   1, 1, 1, 0, 1, 0, 1,1, 
   1, 1, 1, 0, 1, 0, 1,1,  -1, 1, 1, 0, 1, 0, 1,0,  -1, 1,-1, 0, 1, 0, 0,0, 

  -1,-1,-1,-1, 0, 0, 0,1,  -1, 1,-1,-1, 0, 0, 1,1,  -1, 1, 1,-1, 0, 0, 1,0, 
  -1, 1, 1,-1, 0, 0, 1,0,  -1,-1, 1,-1, 0, 0, 0,0,  -1,-1,-1,-1, 0, 0, 0,1, 
   1,-1,-1, 1, 0, 0, 0,0,   1, 1,-1, 1, 0, 0, 1,0,   1, 1, 1, 1, 0, 0, 1,1, 
   1, 1, 1, 1, 0, 0, 1,1,   1,-1, 1, 1, 0, 0, 0,1,   1,-1,-1, 1, 0, 0, 0,0, 
],

parametric: (f,nu,nv,other) => {
   let V = [];
   let g = (i, j) => V.push(f(i/nu, j/nv, other), i/nu,j/nv);
   for (let j = 0 ; j < nv ; j++) {
      for (let i = 0 ; i <= nu ; i++) {
	 g(i, j);
	 g(i, j+1);
      }
      g(1, j+1);
      g(0, j+1);
   }
   return V.flat();
},

sphereData: (nu,nv) => Shape.parametric((u,v,other) => {
   let tLo = 0, tHi = 2 * Math.PI;
   let pLo = -Math.PI/2, pHi = Math.PI/2;
   if (other) {
      tLo = other[0] ?? tLo;
      tHi = other[1] ?? tHi;
      pLo = other[2] ?? pLo;
      pHi = other[3] ?? pHi;
   }
   let theta = tLo + u * (tHi - tLo);
   let phi   = pLo + v * (pHi - pLo);
   let cu = Math.cos(theta);
   let su = Math.sin(theta);
   let cv = Math.cos(phi);
   let sv = Math.sin(phi);
   let x = cu * cv, y = su * cv, z = sv;
   return [x,y,z, x,y,z];
},nu,nv),

torusData: (nu,nv,r) => Shape.parametric((u,v,r) => {
   let theta = 2 * Math.PI * u;
   let phi   = 2 * Math.PI * v;
   let cu = Math.cos(theta);
   let su = Math.sin(theta);
   let cv = Math.cos(phi);
   let sv = Math.sin(phi);
   let x = cu * (1 + r * cv), y = su * (1 + r * cv), z = r * sv;
   return [x,y,z, cu*cv,su*cv,sv];
},nu,nv,r),

tubeData: n => Shape.parametric((u,v,other) => {
   let tLo = 0, tHi = 2 * Math.PI;
   if (other) {
      tLo = other[0] ?? tLo;
      tHi = other[1] ?? tHi;
   }
   let theta = tLo + u * (tHi - tLo);
   let c = Math.cos(theta);
   let s = Math.sin(theta);
   return [c,s,2*v-1, c,s,0];
},n,2),

squareMesh: () => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.squareData)
   };
},

cubeMesh: () => {
   return {
      triangle_strip: false,
      data: new Float32Array(Shape.cubeData)
   };
},

sphereMesh: (nu, nv) => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.sphereData(nu,nv))
   };
},

torusMesh: (nu, nv, r) => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.torusData(nu,nv,r))
   };
},

tubeMesh: n => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.tubeData(n))
   };
},

charMesh: ch => {
   let mesh = Shape.squareMesh();
   mesh.textureID = 15;
   let n = ch.charCodeAt(0) - 32;
   let row = 7 - (n / 12 >> 0);
   let col =      n % 12;
   for (let i = 0 ; i < mesh.data.length ; i += vertexSize) {
      mesh.data[i] *= .6;
      mesh.data[i + 6] = (col + mesh.data[i + 6]) / 12;
      mesh.data[i + 7] = (row + mesh.data[i + 7]) /  8;
   }
   return mesh;
},

};

