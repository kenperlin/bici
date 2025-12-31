let pca = P => {
   let n = P.length, mean = [0,0], xx = 0, xy = 0, yy = 0;
   for (let p of P) { mean[0] += p[0] / n; mean[1] += p[1] / n; }
   let C = P.map(p => [ p[0] - mean[0], p[1] - mean[1] ]);
   for (let p of C) { xx += p[0] * p[0]; xy += p[0] * p[1]; yy += p[1] * p[1]; }
   let a = xx / n, b = xy / n, c = xy / n, d = yy / n,
       r = Math.sqrt((a + d) * (a + d) - 4 * (a * d - b * c)),
       scale = (v, s) => [ s * v[0], s * v[1] ],
       normalize = v => scale(v, 1 / Math.sqrt(v[0] * v[0] + v[1] * v[1])),
       la1 = (a + d + r) / 2, pc1 = normalize([b, la1 - a]),
       la2 = (a + d - r) / 2, pc2 = normalize([b, la2 - a]),
       principalComponents = la1 >= la2 ? [pc1, pc2] : [pc2, pc1],
       eigenvalues         = la1 >= la2 ? [la1, la2] : [la2, la1];
   return { principalComponents, eigenvalues, mean };
}
