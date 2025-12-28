function MatchGame(scene,S,A,X) {
   let sync = () => {
      codeArea.setVar('S', S);
      codeArea.setVar('A', A);
      codeArea.setVar('X', X);
   }
   scene.onUp = (x,y) => {
      for (let n = 0 ; n < 16 ; n++)
         if ( Math.abs(x - tx(n)) < .2 &&
              Math.abs(y - ty(n)) < .2 && ! X[n]) {
            S[n] = 1 - S[n];
            for (let i = 0 ; i < 16 ; i++)
	       if (i != n && S[i] && ch.charAt(i) == ch.charAt(n))
	          X[i] = X[n] = 1;
            for (let i = 0 ; i < 16 ; i++)
	       if (i != n && ! X[i] && ch.charAt(i) != ch.charAt(n))
	          S[i] = 0;
         }
      sync();
   }
   let ch = 'ABCDEFGHEDCGHBFA', tile = [];
   for (let n = 0 ; n < ch.length ; n++)
      tile.push(createTile(ch.substring(n,n+1)));
   let tx = n => ((n&3)  - .25) * .4 - .50;
   let ty = n => ((n>>2) - .25) * .4 - .65;

   let round = t => (100 * t + .5 >> 0) / 100;

   let message = text => {
      let x = CANVAS3D_LEFT + CANVAS3D_WIDTH / 2;
      let y = CANVAS3D_TOP - 20;

      octx.fillStyle = '#ffffff60';
      octx.beginPath();
      octx.roundRect(x - 200, y - 90, 400, 180, 40);
      octx.fill();

      octx.font = '35px Helvetica';
      octx.fillStyle = '#000000';
      let line = text.split('\n');
      for (let n = 0 ; n < line.length ; n++)
         centeredText(octx, line[n], x, y - 35 + 50 * n);
   }

   scene.update = () => {
      for (let n = 0 ; n < 16 ; n++) {
         drawObj(tile[n],
	         mxm(move(tx(n),ty(n),0),
                     mxm(turnY(Math.PI * ease(1 - A[n])),
		         scale(.9))),
		 X[n] ? [1,1,1] : null);
         A[n] = Math.max(0, Math.min(1, round(A[n] + (S[n] ? .01 : -.01))));
      }

      let score = 0;
      for (let n = 0 ; n < 16 ; n++)
         score += X[n] + A[n];
      if (score == 0)
         message('TRY TO FIND\nALL MATCHING PAIRS\nOF TILES.');
      if (score == 32)
         message('CONGRATULATIONS\nYOU FOUND\nEVERY MATCH!');
   }
}

