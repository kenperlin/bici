function MatchGame(scene,S,A,X,seq) {
   let sync = () => {
      codeArea.setVar('S', S);
      for (let n = 0 ; n < A.length ; n++)
         A[n] = (1000 * A[n] >> 0) / 1000;
      codeArea.setVar('A', A);
      codeArea.setVar('seq', seq);
      codeArea.setVar('X', X);
   }
   scene.onUp = (x,y) => {
      for (let n = 0 ; n < 16 ; n++)
         if ( Math.abs(x - tx(n)) < .2 &&
              Math.abs(y - ty(n)) < .2 && ! X[n])
            S[n] = 1 - S[n];
      sync();
   }
   let ch = 'ABCDEFGHEDCGHBFA', tile = [];
   for (let n = 0 ; n < ch.length ; n++)
      tile.push(createTile(ch.substring(n,n+1)));
   let tx = n => ((n&3)  - .25) * .4 - .5;
   let ty = n => ((n>>2) - .25) * .4 - .6;

   scene.update = () => {
      for (let n = 0 ; n < 16 ; n++) {
         drawObj(tile[n],
                 mxm(move(tx(n),ty(n),0),
                 mxm(turnY(Math.PI*ease(1-A[n])),
		     scale(.9))),
		     X[n] ? [1,1,1] : null);
	 let a = A[n];
         if (S[n]) {
	    A[n] = Math.min(1, A[n] + .01);
	    if (a < 1 && A[n] == 1) {
	       if (seq[1] != -1)
	          seq[0] = seq[1];
	       seq[1] = n;
	       if (ch.charAt(seq[0]) ==
	           ch.charAt(seq[1])) {
	          X[seq[0]] = 1;
	          X[seq[1]] = 1;
	       }
	       sync();
            }
         }
         else {
	    A[n] = Math.max(0, A[n] - .01);
	    if (a>0 && A[n]==0 && n==seq[1]) {
	       seq[0] = seq[1] = -1;
               sync();
	    }
         }
      }
   }
}

