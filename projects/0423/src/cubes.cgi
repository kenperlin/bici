M.turnY(time).turnX(time)
for (let n = 0 ; n < 6 ; n++)
   M.push()
    .turnY(n < 4 ? PI*n/2 : 0)
    .turnZ(n < 4 ? 0 : PI*n+PI/2)
    .move(.6,0,0)
    .scale(.25)
    .draw(cube,[.5+.5*cos(3*n),
                .5+.5*sin(5*n),
                .5+.5*sin(7*n) ])
    .pop();
