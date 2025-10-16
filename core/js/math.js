
// USEFUL FUNCTIONS

let cross = (a,b) => [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
let dot = (a,b) => { let s = 0 ; for (let i=0 ; i<a.length ; i++) s += a[i] * b[i]; return s; }
let evalBezier = (B,t) => (1-t)*(1-t)*(1-t)*B[0] + 3*(1-t)*(1-t)*t*B[1] + 3*(1-t)*t*t*B[2] + t*t*t*B[3];
let norm = v => Math.sqrt(dot(v,v));
let normalize = v => { let s = norm(v); return v.length==3 ? [ v[0]/s,v[1]/s,v[2]/s ] : [ v[0]/s,v[1]/s ]; }
let subtract = (a,b) => { let v = []; for (let i=0 ; i<a.length ; i++) v.push(a[i] - b[i]); return v; }


// MATRIX PRIMITIVES

let c = t => Math.cos(t);
let s = t => Math.sin(t);
let identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
let move = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
let turnX = t => [1,0,0,0, 0,c(t),s(t),0, 0,-s(t),c(t),0, 0,0,0,1];
let turnY = t => [c(t),0,-s(t),0, 0,1,0,0, s(t),0,c(t),0, 0,0,0,1];
let turnZ = t => [c(t),s(t),0,0, -s(t),c(t),0,0, 0,0,1,0, 0,0,0,1];
let scale = (x,y,z) => [x,0,0,0, 0,y??x,0,0, 0,0,z??x,0, 0,0,0,1];
let perspective = (x,y,z) => [1,0,0,x, 0,1,0,y??x, 0,0,1,z??x, 0,0,0,1];

let mxm = (a,b) => {
   let m = [];
   for (let c = 0 ; c < 16 ; c += 4)
   for (let r = 0 ; r < 4 ; r++)
      m.push( a[r]*b[c] + a[r+4]*b[c+1] + a[r+8]*b[c+2] + a[r+12]*b[c+3] );
   return m;
}

let transpose = m => [ m[0],m[4],m[ 8],m[12],
                       m[1],m[5],m[ 9],m[13],
                       m[2],m[6],m[10],m[14],
                       m[3],m[7],m[11],m[15] ];

let inverse = src => {
   let dst = [], det = 0, cofactor = (c, r) => {
      let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
      return (c+r & 1 ? -1 : 1) * ( (s(1,1)*(s(2,2)*s(3,3)-s(3,2)*s(2,3)))
                                  - (s(2,1)*(s(1,2)*s(3,3)-s(3,2)*s(1,3)))
                                  + (s(3,1)*(s(1,2)*s(2,3)-s(2,2)*s(1,3))) );
   }
   for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
   for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
   for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
   return dst;
}

// QUADRIC SURFACES FOR RAY TRACING

let sphere = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1];
let parabX = [0,0,0,1, 0,1,0,0, 0,0,1,0, 0,0,0,0 ];
let parabY = [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0 ];
let parabZ = [1,0,0,0, 0,1,0,0, 0,0,0,1, 0,0,0,0 ];
let slabX  = [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,-1];
let slabY  = [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1];
let slabZ  = [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1];
let tubeX  = [0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1];
let tubeY  = [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1];
let tubeZ  = [1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1];
let space  = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,-1];

// NOISE FUNCTION

let noise = (x,y,z) => {
   let normalize = v => (s => v.map(a => a/s))(Math.sqrt(dot(v,v))), c = Math.cos;
   let f=Math.floor,i=f(x),j=f(y),k=f(z),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
   let r = (x,y,z) => c(5 * (x + 5 * c(5 * (y + 5 * c(5 * (z + 5 * c(5 * x)))))));
   let s = (x,y,z) => normalize([ r(x,y,z),r(y,z,x),r(z,x,y) ]),u=x-i,v=y-j,w=z-k;
   let e = t => t < 0.5 ? 2 * t*t : 2*t * (2-t) - 1, U = e(u), V = e(v), W = e(w);
   let t = (x,y,z) => dot(s(i+x,j+y,k+z),[u-x,v-y,w-z]), m = (a,b,t) => a+(b-a)*t;
   return m( m( m( t(0,0,0), t(1,0,0), U), m( t(0,1,0), t(1,1,0), U ), V ),
             m( m( t(0,0,1), t(1,0,1), U), m( t(0,1,1), t(1,1,1), U ), V ), W );
}

