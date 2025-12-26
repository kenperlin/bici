function Scene() {
   let x = .5;
   let y = .5;
   let clip=t=>Math.max(0,Math.min(1,t));
   this.onDrag = (x,y) => {
      codeArea.setVar('x', clip(x+.5));
      codeArea.setVar('y', clip(y+.5));
   }

   let ch = 'ABCDEFGHI', tile = [];
   for (let n = 0 ; n < 9 ; n++)
      tile.push(createTile(ch.substring(n,n+1)));

   this.update = () => {
      let t = Date.now() / 1000;

      for (let i = 0 ; i < 3 ; i++)
      for (let j = 0 ; j < 3 ; j++)
         drawObj(tile[i+3*j], mxm(move(x-.5+.5*(i-1),y-.5+.5*(j-1),0), turnY(t)));
   }
}

