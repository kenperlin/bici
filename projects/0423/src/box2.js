M.identity().perspective(0,0,-5)
            .turnY(@0)
            .turnX(@1)
            .scale(.5);
p = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],
     [-1,-1, 1],[1,-1, 1],[-1,1, 1],[1,1, 1]];
for (i = 0 ; i < p.length ; i++)
   p[i] = M.transform(p[i]);
let sides = [
   { C:'green' , P:[p[0],p[1],p[3],p[2]] },
   { C:'yellow', P:[p[4],p[5],p[7],p[6]] },
   { C:'red'   , P:[p[0],p[1],p[5],p[4]] },
   { C:'pink'  , P:[p[2],p[3],p[7],p[6]] },
   { C:'blue'  , P:[p[0],p[2],p[6],p[4]] },
   { C:'cyan'  , P:[p[1],p[3],p[7],p[5]] } ];
sorted = [];
for (n = 0 ; n < 6 ; n++) {
   let P = sides[n].P;
   let z = P[0][2]+P[1][2]+P[2][2]+P[3][2];
   sorted.push({ s:sides[n], z:z });
}
sorted.sort((a,b) => a.z - b.z);
for (n = 0 ; n < 6 ; n++)
   draw.fillColor  (sorted[n].s.C)
       .fillPolygon(sorted[n].s.P);
