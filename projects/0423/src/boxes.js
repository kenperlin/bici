let sort = [];
for (let n = 0 ; n < 6 ; n++) {
   M.identity().perspective(0,0,-5)
               .turnX(time)
               .turnY(time+(n<4?PI*n/2:0))
               .turnZ(n<4?0:PI*(n-4.5))
               .move(.6,0,0)
               .scale(.5 * @0);
   sort.push({ m: M.get(),
               c: [ease(.5+.5*cos(3*n)),
                   ease(.5+.5*cos(4*n)),
                   ease(.5+.5*cos(5*n))],
               p: M.transform([0,0,0]) });
}
sort.sort((a,b) => a.p[2] - b.p[2]);
for (let n = 0 ; n < sort.length ; n++)
   box(M.set(sort[n].m), sort[n].c);
