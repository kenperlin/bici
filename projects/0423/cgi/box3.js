M.identity().perspective(0,0,5)
            .rotateY(@0)
            .rotateX(@1)
            .scale(.5);
let V = [[-1,-1,-1],[1,-1,-1],
         [-1, 1,-1],[1, 1,-1],
         [-1,-1, 1],[1,-1, 1],
         [-1, 1, 1],[1, 1, 1]];
for (let i = 0 ; i < V.length ; i++)
   V[i] = M.transform(V[i]);
let F = [ [V[2],V[3],V[1],V[0]],
          [V[4],V[5],V[7],V[6]],
          [V[0],V[1],V[5],V[4]],
          [V[6],V[7],V[3],V[2]],
          [V[4],V[6],V[2],V[0]],
          [V[1],V[3],V[7],V[5]] ];
let sort = [];
for (let n = 0 ; n < 6 ; n++) {
   let f = F[n];
   let z = f[0][2]+f[1][2]+f[2][2]+f[3][2];
   let N = cross(subtract(f[2],f[1]),
                 subtract(f[1],f[0]));
   let c = .5 - .2 * (N[0]+N[1]+N[2]);
   let h = hex(255 * c >> 0);
   sort.push({ z:z, f:f, c:'#'+h+h+h });
}
sort.sort((a,b) => a.z - b.z);
for (let n = 0 ; n < 6 ; n++)
   draw.fillColor(sort[n].c)
       .fillPolygon(sort[n].f);
