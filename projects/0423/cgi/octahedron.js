M.identity().perspective(0,0,5)
            .rotateX(.5 * time)
            .rotateY(.5 * time)
            .scale(.8);
p = [[-1,0,0],[1,0,0],
     [0,-1,0],[0,1,0],
     [0,0,-1],[0,0,1]];
for (i = 0 ; i < p.length ; i++)
   p[i] = M.transform(p[i]);
for (i = 2 ; i < 6 ; i++)
   draw.path([p[0],p[i],p[1]]);
draw.path([p[2],p[4],p[3],p[5],p[2]]);
