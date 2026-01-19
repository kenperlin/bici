
// SOME USEFUL FUNCTIONS

export let add = (a,b) => { let v = []; for (let i=0 ; i<a.length ; i++) v.push(a[i] + b[i]); return v; }
export let cross = (a,b) => [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
export let dot = (a,b) => { let s = 0 ; for (let i=0 ; i<a.length ; i++) s += a[i] * b[i]; return s; }
export let ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - t - t); } 
export let evalBezier = (B,t) => (1-t)*(1-t)*(1-t)*B[0] + 3*(1-t)*(1-t)*t*B[1] + 3*(1-t)*t*t*B[2] + t*t*t*B[3];
export let mix = (a,b,t) => { let c = []; for (let i=0 ; i<a.length ; i++) c[i] = a[i] + t*(b[i]-a[i]); return c; }
export let norm = v => Math.sqrt(dot(v,v));
export let normalize = v => { let s = norm(v); return v.length==3 ? [ v[0]/s,v[1]/s,v[2]/s ] : [ v[0]/s,v[1]/s ]; }
export let resize = (v,s) => v.length==2 ? [ s*v[0], s*v[1] ] : [s*v[0], s*v[1], s*v[2] ];
export let subtract = (a,b) => { let v = []; for (let i=0 ; i<a.length ; i++) v.push(a[i] - b[i]); return v; }

// MATRIX PRIMITIVES

export let c = t => Math.cos(t);
export let s = t => Math.sin(t);
export let identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
export let move = (x,y,z) => { if (y===undefined) {z=x[2];y=x[1];x=x[0];}
                        return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; }
export let perspective = (x,y,z) => [1,0,0,x, 0,1,0,y??x, 0,0,1,z??x, 0,0,0,1];
export let scale = (x,y,z) => [x,0,0,0, 0,y??x,0,0, 0,0,z??x,0, 0,0,0,1];
export let turnX = t => [1,0,0,0, 0,c(t),s(t),0, 0,-s(t),c(t),0, 0,0,0,1];
export let turnY = t => [c(t),0,-s(t),0, 0,1,0,0, s(t),0,c(t),0, 0,0,0,1];
export let turnZ = t => [c(t),s(t),0,0, -s(t),c(t),0,0, 0,0,1,0, 0,0,0,1];

export let mxm = (a,b) => {
   let m = [];
   for (let c = 0 ; c < 16 ; c += 4)
   for (let r = 0 ; r < 4 ; r++)
      m.push( a[r]*b[c] + a[r+4]*b[c+1] + a[r+8]*b[c+2] + a[r+12]*b[c+3] );
   return m;
}

export let transform = (m,p) => {
   let x = p[0], y = p[1], z = p[2], w = p[3] ?? 1;
   return [
      m[0] * x + m[4] * y + m[ 8] * z + m[12] * w,
      m[1] * x + m[5] * y + m[ 9] * z + m[13] * w,
      m[2] * x + m[6] * y + m[10] * z + m[14] * w,
      m[3] * x + m[7] * y + m[11] * z + m[15] * w,
   ];
}

export let transpose = m => [ m[0],m[4],m[ 8],m[12],
                       m[1],m[5],m[ 9],m[13],
                       m[2],m[6],m[10],m[14],
                       m[3],m[7],m[11],m[15] ];

export let inverse = src => {
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

export let aim = Z => {
   let X = normalize(cross([0,1,0], Z = normalize(Z))),
       Y = normalize(cross(Z, X));
   return [ X[0],X[1],X[2],0, Y[0],Y[1],Y[2],0, Z[0],Z[1],Z[2],0, 0,0,0,1 ];
}

// NESTABLE MATRIX OBJECT

export function Matrix() {
   let m = [identity()], top = 0;
   this.aim         = Z       => { m[top] = mxm(m[top],aim(Z)); return this; }
   this.call        = proc    => { proc(); return this; }
   this.get         = ()      => m[top];
   this.identity    = ()      => { m[top] = identity(); return this; }
   this.inverse     = ()      => { m[top] = inverse(m[top]); return this; }
   this.move        = (x,y,z) => { m[top] = mxm(m[top],move(x,y,z)); return this; }
   this.perspective = (x,y,z) => { m[top] = mxm(m[top], perspective(x,y,z)); return this; }
   this.pop         = ()      => { if (top > 0) top--; return this; }
   this.push        = ()      => { m[top+1] = m[top].slice(); top++; return this; }
   this.scale       = (x,y,z) => { m[top] = mxm(m[top], scale(x,y,z)); return this; }
   this.set         = matrix  => { m[top] = matrix; return this; }
   this.transform   = p       => { m[top] = transform(m[top],p); return this; }
   this.transpose   = ()      => { m[top] = transpose(m[top]); return this; }
   this.turnX       = a       => { m[top] = mxm(m[top], turnX(a)); return this; }
   this.turnY       = a       => { m[top] = mxm(m[top], turnY(a)); return this; }
   this.turnZ       = a       => { m[top] = mxm(m[top], turnZ(a)); return this; }
}

// 2-LINK INVERSE KINEMATICS

export let ik = (A,a,b,C,aim) => {
   C = [ C[0]-A[0], C[1]-A[1], C[2]-A[2] ];
   let dot = (A,B) => A[0]*B[0]+A[1]*B[1]+A[2]*B[2], B=[], D=[];
   let cc = dot(C,C), x = (1+(a*a-b*b)/cc)/2, c = dot(C,aim)/cc;
   for (let i = 0 ; i < 3 ; i++) D[i] = aim[i] - c * C[i];
   let y = Math.sqrt(Math.max(0, a*a - cc*x*x) / dot(D,D));
   for (let i = 0 ; i < 3 ; i++) B[i] = A[i] + x*C[i] + y*D[i];
   return B;
}

// SPRING

export function Spring() {
   this.getPosition = () => P;
   this.setDamping  = d  => D = d;
   this.setForce    = f  => F = f;
   this.setMass     = m  => M = Math.max(0.001, m);
   this.update = e => {
      V += (F - P) / M * e;
      P  = (P + V) * (1 - D * e);
   }
   let D = 1, F = 0, M = 1, P = 0, V = 0;
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

export let noise = (x,y,z) => {
   let normalize = v => (s => v.map(a => a/s))(Math.sqrt(dot(v,v))), c = Math.cos;
   let f=Math.floor,i=f(x),j=f(y),k=f(z),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
   let r = (x,y,z) => c(5 * (x + 5 * c(5 * (y + 5 * c(5 * (z + 5 * c(5 * x)))))));
   let s = (x,y,z) => normalize([ r(x,y,z),r(y,z,x),r(z,x,y) ]),u=x-i,v=y-j,w=z-k;
   let e = t => t < 0.5 ? 2 * t*t : 2*t * (2-t) - 1, U = e(u), V = e(v), W = e(w);
   let t = (x,y,z) => dot(s(i+x,j+y,k+z),[u-x,v-y,w-z]), m = (a,b,t) => a+(b-a)*t;
   return m( m( m( t(0,0,0), t(1,0,0), U), m( t(0,1,0), t(1,1,0), U ), V ),
             m( m( t(0,0,1), t(1,0,1), U), m( t(0,1,1), t(1,1,1), U ), V ), W );
}

