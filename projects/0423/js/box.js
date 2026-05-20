M.identity().perspective(0,0,5)
            .rotateX(.5 + time)
            .rotateY(.5 + time)
            .scale(.5);
let p = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
     [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]];
for (i = 0 ; i < p.length ; i++)
   p[i] = M.transform(p[i]);
for (i = 0 ; i < 8 ; i += 4)
   draw.path([p[i],p[i+1],p[i+2],p[i+3],p[i]]);
for (i = 0 ; i < 4 ; i++)
   draw.path([p[i],p[4+i]]);

