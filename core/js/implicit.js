// CONVERT AN IMPLICIT SURFACE DESCRIPTION INTO A TRIANGLE MESH.
// THE FIRST ARG MUST BE AN OBJECT THAT PROVIDES eval() AND weights() METHODS.

function implicitSurfaceTriangleMesh(implicit, n = 100, isFaceted) {

   let marchingTetrahedra = function(V, ni, nj) {

      // FUNCTIONS TO COMPUTE (i,j,k) VOXEL COORDS FROM VOLUME INDEX n

      function n2i(n) { return  n             % ni; }
      function n2j(n) { return (n / dj >>> 0) % nj; }
      function n2k(n) { return  n / dk >>> 0      ; }

      // FUNCTION TO ADD A VERTEX ALONG A VOXEL EDGE AND RETURN A UNIQUE VERTEX ID

      function E(a, b) {
         if (a > b) { let tmp = a; a = b; b = tmp; }
         let ai = n2i(a), aj = n2j(a), ak = n2k(a),
             bi = n2i(b), bj = n2j(b), bk = n2k(b);
         let m = (n << 6) + (ai & bi ?  1 << 6 : ai      | bi << 3)
                          + (aj & bj ? dj << 6 : aj << 1 | bj << 4)
                          + (ak & bk ? dk << 6 : ak << 2 | bk << 5);

         // ADD VERTEX TO THE VERTEX ARRAY ONLY THE FIRST TIME IT IS ENCOUNTERED

         if (vertexID[m] === undefined) {
            vertexID[m] = P.length;
            let t = -V[n+a] / (V[n+b] - V[n+a]),
                c = function(i,a,b) { return (i + (1-t)*a + t*b) / ni * 2 - 1; };
            P.push( [ c(i,ai,bi), c(j,aj,bj), c(k,ak,bk) ] );
         }

         return vertexID[m];
      }

      // FUNCTION TO ADD ONE TRIANGLE IN A ---+ OR -+++ TETRAHEDRON

      function tri(a, b, c, d) {
         T.push(E(a,b), E(a,c), E(a,d));
      }

      // FUNCTION TO ADD TWO TRIANGLES IN A --++ TETRAHEDRON

      function quad(a, b, c, d) {
         let ac = E(a,c), bc = E(b,c), ad = E(a,d), bd = E(b,d);
         T.push(bc, ac, ad);
         T.push(ad, bd, bc);
      }

      // DECLARE VARIABLES

      let nk = V.length / (ni * nj), di = 1, dj = ni, dk = ni * nj;
      let dij = di + dj, dik = di + dk, djk = dj + dk, dijk = di + dj + dk;
      let P = [], T = [], vertexID = [], i, j, k, m = 0, n, S = [0,di,dij,dijk];
      let lo = new Array(nj * nk),
          hi = new Array(nj * nk);

      // THE 6 POSSIBLE PATHS FROM LOWEST TO HIGHEST VERTEX THROUGH A TETRAHEDRON

      let S1 = [di , dj , dk , di , dj , dk ];
      let S2 = [dij, djk, dik, dik, dij, djk];

      // THE 16 CASES OF - OR + VALUES AT EACH OF THE 4 TETRAHEDRON CORNERS

      let cases = [ [0         ], [1, 0,1,2,3], [1, 1,2,0,3], [2, 0,1,2,3],
                    [1, 2,3,0,1], [2, 0,2,3,1], [2, 1,2,0,3], [1, 3,1,2,0],
                    [1, 3,0,2,1], [2, 0,3,1,2], [2, 1,3,2,0], [1, 2,1,0,3],
                    [2, 2,3,0,1], [1, 1,3,0,2], [1, 0,3,2,1], [0         ] ];

      // FOR EACH (Y,Z), ONLY WORK INSIDE THE X RANGE WHERE THE SURFACE MIGHT BE
   
      for (k = 0 ; k < nk ; k++)
      for (j = 0 ; j < nj ; j++, m++) {
         let n0 = m * ni, n1 = n0 + ni - 1;
         for (n = n0 ; n <= n1 && V[n] > 0 ; n++) ;
         lo[m] = Math.max(0, n-1 - n0);
         for (n = n1 ; n >= n0 && V[n] > 0 ; --n) ;
         hi[m] = Math.min(ni-1, n+1 - n0);
      }

      // FOR ALL Y AND Z IN THE VOLUME

      for (k = 0 ; k < nk - 1 ; k++) {
         let i0, i1, m = k * nj, n1, s0, s1;
         for (j = 0 ; j < nj - 1 ; j++, m++) {
            i0 = Math.min(lo[m], lo[m+1], lo[m+ni], lo[m+1+ni]);
            i1 = Math.max(hi[m], hi[m+1], hi[m+ni], hi[m+1+ni]);

            // GO THROUGH THE RANGE OF X CONTAINING ANY POSITIVE VOXEL VALUES

            if (i0 <= i1) {
               n  = m * ni + i0;
               n1 = m * ni + i1;
               s0 = (V[n]>0) + (V[n+dj]>0) + (V[n+dk]>0) + (V[n+djk]>0);
               for (i = i0 ; n <= n1 ; i++, n++, s0 = s1) {

                  // FOR EACH VOXEL

                  s1 = (V[n+di]>0) + (V[n+dij]>0) + (V[n+dik]>0) + (V[n+dijk]>0);
                  if (s0 + s1 & 7) {
                     let C14 = (V[n] > 0) | (V[n+dijk] > 0) << 3;

                     // CYCLE THROUGH THE SIX TETRAHEDRA THAT TILE THE VOXEL

                     for (let p = 0 ; p < 6 ; p++) {
                        let C = cases [ C14 | (V[n+S1[p]] > 0) << 1 | (V[n+S2[p]] > 0) << 2 ];

                        // FOR EACH TETRAHEDRON, OUTPUT EITHER ZERO, ONE OR TWO TRIANGLES

                        if (C[0]) {       // C[0] == number of triangles to be created.
                           S[1] = S1[p];  // Assign 2nd and 3rd corners of tetrahedron.
                           S[2] = S2[p];
                           (C[0]==1 ? tri : quad)(S[C[1]], S[C[2]], S[C[3]], S[C[4]]);
                        }
                     }
                  }
               }
            }
         }
      }

      // RETURN ALL VERTEX POSITIONS AND ALL TRIANGLES (AS TRIPLETS OF VERTEX INDICES)

      return [P, T];
   }

   // EVALUATE THE IMPLICIT FUNCTION AT EVERY VOXEL IN THE VOLUME

   let volume = [];
   let F = i => (i - n/2) / (n/2);
   for (let k = 0 ; k < n ; k++)
   for (let j = 0 ; j < n ; j++)
   for (let i = 0 ; i < n ; i++)
      volume.push(implicit.eval([F(i), F(j), F(k)]));

   // FIND ALL VERTICES AND TRIANGLES OF THE SURFACE WHERE VALUE = 1
   
   let PT = marchingTetrahedra(volume, n, n), P = PT[0], T = PT[1];

   // COMPUTE SURFACE NORMALS AND VERTEX WEIGHTS

   let N = [], W = [];
   for (let i = 0 ; i < P.length ; i++) {
      let p = P[i], f = implicit.eval(p), x = p[0], y = p[1], z = p[2];
      W.push(implicit.weights(p));
      N.push(normalize([ f - implicit.eval([ x+.001, y, z ]),
                         f - implicit.eval([ x, y+.001, z ]),
                         f - implicit.eval([ x, y, z+.001 ]) ]));
   }

   // CONSTRUCT THE VERTEX DATA FOR THE RENDERABLE TRIANGLES MESH

   let data = [];
   for (let i = 0; i < T.length; i += 3) {
      let a = T[i], b = T[i+1], c = T[i+2];
      if (isFaceted)
         N[a] = N[b] = N[c] = normalize(add(N[a],add(N[b],N[c])));
      data.push( P[a],N[a],W[a], P[b],N[b],W[b], P[c],N[c],W[c] );
   }
   return new Float32Array(data.flat());
}

// COMBINE VARIOUSLY SHAPED BLOBS TO DESCRIBE AN IMPLICIT SURFACE.

function Blobs() {

   this.SPHERE   = 0;
   this.SAUSAGE  = 1;
   this.CYLINDER = 2;
   this.CUBE     = 3;

   let data = [];
   let blob = (data, p) => {
      let t = 0, m = data.matrix, blur = Math.abs(data.blur);

      p = transform(m, p);
      x = p[0];
      y = p[1];
      z = p[2];

      let X = norm([m[0],m[4],m[8]]),
          Y = norm([m[1],m[5],m[9]]),
          Z = norm([m[2],m[6],m[10]]),
          W = Math.sqrt(X*X + Y*Y + Z*Z),
          A1 = x*x,
          B1 = y*y,
          C1 = z*z,
          rx = 1 + blur * X/W,
          ry = 1 + blur * Y/W,
          rz = 1 + blur * Z/W,
          A0 = A1 / rx/rx,
          B0 = B1 / ry/ry,
          C0 = C1 / rz/rz;

      if (data.shape == this.SPHERE) {
         let a = 1 - A1 - B1 - C1,
             b = 1 - A0 - B0 - C0;
         t = b / (b - a);
      }

      else if (data.shape == this.SAUSAGE) {
         let sz = Z / ((X+Y)/2);
         if (Math.abs(z) > 1-sz) {
            z -= (1-sz) * Math.sign(z);
            let C1 = z*z / sz/sz;
            let C0 = C1  / rz/rz * sz;
            let a = 1 - A1 - B1 - C1,
                b = 1 - A0 - B0 - C0;
            t = b / (b - a);
         }
         else {
            let ab1 = 1 - A1 - B1,
                ab0 = 1 - A0 - B0;
            t = Math.max(0, ab0 / (ab0 - ab1));
         }
      }

      else if (data.shape == this.CYLINDER) {
         let ab1 = 1 - A1 - B1, c1  = 1 - C1,
             ab0 = 1 - A0 - B0, c0  = 1 - C0,
             tab = Math.max(0, ab0 / (ab0 - ab1)),
             tc  = Math.max(0, c0  / (c0  - c1 ));
         t = Math.min(tab, tc);
      }

      else if (data.shape == this.CUBE) {
         let a1 = 1 - A1, b1 = 1 - B1, c1 = 1 - C1,
             a0 = 1 - A0, b0 = 1 - B0, c0 = 1 - C0,
             ta = a0 / (a0 - a1),
             tb = b0 / (b0 - b1),
             tc = c0 / (c0 - c1);
         t = Math.min(ta, tb, tc);
      }

      t = Math.max(0, t);
      return t * t * Math.sign(data.blur);
   }

   // ADD A BLOB

   this.addBlob = (shape, matrix, blur) =>
      data.push({ shape: shape, matrix: inverse(matrix), blur: blur ?? 1});

   this.nBlobs = () => data.length;

   // EVALUATE THE IMPLICIT FUNCTION AT ONE POINT

   this.eval = p => {
      value = -1;
      for (let n = 0 ; n < data.length ; n++)
         value += blob(data[n], p);
      return value;
   }

   // COMPUTE VERTEX WEIGHTS, NORMALIZE, ADD MATRIX INDICES

   this.weights = p => {

      // EVAL ALL BLOBS

      let B = [], b;
      for (let n = 0 ; n < data.length ; n++)
         if ((b = blob(data[n], p)) != 0)
            B.push({n:n,b:b>0?b:-b});

      // NORMALIZE WEIGHTS SO THEY SUM TO 1.0

      let sum = .001;
      for (let i = 0 ; i < B.length ; i++)
         sum += B[i].b;
      for (let i = 0 ; i < B.length ; i++)
         B[i].b /= sum;

      let weights = [];

      // ADD MATRIX INDEX TO EACH WEIGHT

      for (let i = 0 ; i < B.length ; i++)
         weights.push(B[i].n + B[i].b);

      // PAD WITH NULL WEIGHTS AS NEEDED

      for (let i = B.length ; i < 6 ; i++)
         weights.push(-1);

      return weights;
   }
}

