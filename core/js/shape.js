
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

sphereData: (nu,nv,other) => Shape.parametric((u,v) => {
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

torusData: (nu,nv,r) => Shape.parametric((u,v) => {
   let theta = 2 * Math.PI * u;
   let phi   = 2 * Math.PI * v;
   let cu = Math.cos(theta);
   let su = Math.sin(theta);
   let cv = Math.cos(phi);
   let sv = Math.sin(phi);
   let x = cu * (1 + r * cv), y = su * (1 + r * cv), z = r * sv;
   return [x,y,z, cu*cv,su*cv,sv];
},nu,nv,r),

tubeData: (n,other) => Shape.parametric((u,v) => {
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

sphereMesh: (nu, nv, other) => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.sphereData(nu,nv, other))
   };
},

torusMesh: (nu, nv, r) => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.torusData(nu,nv,r))
   };
},

tubeMesh: (n, other) => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.tubeData(n, other))
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

transform: (mesh, m) => {
   let im = transpose(inverse(m));
   let d = mesh.data;
   for (let i = 0 ; i < d.length ; i += vertexSize) {
      let P = transform( m, [d[i  ],d[i+1],d[i+2]]);
      let N = transform(im, [d[i+3],d[i+4],d[i+5],0]);
      for (let j = 0 ; j < 3 ; j++) {
         d[i+j  ] = P[j];
         d[i+3+j] = N[j];
      }
   }
   return mesh;
},

// GLUE TWO MESHES TOGETHER INTO A SINGLE MESH

glue: (mesh_a, mesh_b) => {
   let a = mesh_a.data, b = mesh_b.data;
   let c = [];
   for (let i = 0 ; i < a.length ; i++)
      c.push(a[i]);                          // a
   for (let i = 0 ; i < vertexSize ; i++)
      c.push(a[a.length - vertexSize + i]);  // + last vertex of a
   for (let i = 0 ; i < vertexSize ; i++)
      c.push(b[i]);                          // + first vertex of b
   for (let i = 0 ; i < b.length ; i++)
      c.push(b[i]);                          // + b
   return { triangle_strip: true, data: new Float32Array(c) };
},

roundedBox: (A,B,C,R,N) => {
   let mesh = { triangle_strip: true, data: new Float32Array([]) };
   
   let corner = (u,v) => Shape.sphereMesh(N,N, [u*Math.PI/2, (u+1)*Math.PI/2, (v-1)*Math.PI/2, v*Math.PI/2]);

   for (let n = 0 ; n < 8 ; n++)
      mesh = Shape.glue(mesh, Shape.transform(corner(n%4==0 ? 2 : n%4==1 ? 3 : n%4==2 ? 1 : 0, n>>2),
                                              mxm(move(A * (2 * (  n    & 1) - 1),
                                                       B * (2 * ((n>>1) & 1) - 1),
                                                       C * (2 * ((n>>2) & 1) - 1)), scale(R))));

   let edge = u => Shape.tubeMesh(N, [ u*Math.PI/2, (u+1)*Math.PI/2 ]);

   for (let i = 0 ; i < 3 ; i++) {
      let a = i==0 ? A : i==1 ? A : C;
      let b = i==0 ? B : i==1 ? C : B;
      let c = i==0 ? C : i==1 ? B : A;
      for (let n = 0 ; n < 4 ; n++)
         mesh = Shape.glue(mesh, Shape.transform(edge(n==0 ? 0 : n==1 ? 1 : n==2 ? 3 : 2),
                                                 mxm(i==0 ? identity() :
                                                     i==1 ? turnX(Math.PI/2) :
                                                            turnY(Math.PI/2) ,
                                                 mxm(move(a * (1 - 2 * (  n    & 1)),
                                                          b * (1 - 2 * ((n>>1) & 1)), 0), scale(R,R,c)))));
   }

   let addFace = (rot,x,y,z) => mesh = Shape.glue(mesh,
                                                  Shape.transform(Shape.squareMesh(),
                                                                  mxm(rot, mxm(move(0,0,z+R), scale(x,y,1)))));
   for (let n = 0 ; n < 6 ; n++)
      switch (n) {
      case 0: addFace(identity()       , A,B,C) ; break;
      case 1: addFace(turnY( Math.PI  ), A,B,C) ; break;
      case 2: addFace(turnY(-Math.PI/2), C,B,A) ; break;
      case 3: addFace(turnY( Math.PI/2), C,B,A) ; break;
      case 4: addFace(turnX(-Math.PI/2), A,C,B) ; break;
      case 5: addFace(turnX( Math.PI/2), A,C,B) ; break;
      }

   return mesh;
},

};

