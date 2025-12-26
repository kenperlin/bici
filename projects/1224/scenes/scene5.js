function Scene() {
   let x = .5;
   let y = .5;
   let clip=t=>Math.max(0,Math.min(1,t));
   this.onDrag = (x,y) => {
      codeArea.setVar('x', clip(x+.5));
      codeArea.setVar('y', clip(y+.5));
   }

   let ch = 'ABCDEFGHIJKLMNOP', tile = [];
   for (let n = 0 ; n < ch.length ; n++)
      tile.push(createTile(ch.substring(n,n+1)));

   let t0 = Date.now() / 1000;;

   this.update = () => {
      let t = (Date.now() / 1000 - t0) / 2;
      let s = .5 + .5 * Math.sin(2 * Math.PI * t);
      s = s * s * (3 - s - s);
      t += .11 * (2 * s - 1) + .5;

      for (let i = 0 ; i < 4 ; i++)
      for (let j = 0 ; j < 4 ; j++)
         drawObj(tile[i+3*j], mxm(move(x + (i-2.5)*.45,
	                               y + (j-2.5)*.45 - .1, 0),
				  turnY(Math.PI*t+Math.PI*(i+j&1))));
   }
}

