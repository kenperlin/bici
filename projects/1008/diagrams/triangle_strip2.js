// TRIANGLE STRIP
function Diagram() {
   let V = [
      [-.52, .17],
      [-.32,-.02],
      [-.1,-.1],
      [ .1,-.1],
      [ .32,-.02],
      [ .52, .17],

      [-.46,.38],
      [-.3,.2],
      [-.1,.1],
      [ .1,.1],
      [ .3,.2],
      [ .46,.38],

      [-.42,.58],
      [-.28,.4],
      [-.1,.3],
      [ .1,.3],
      [ .28,.4],
      [ .42,.58],
   ];
   let state = 0;
   this.onUp = (x,y) => state = x < 0 ? Math.max(0, state-1)
                                      : Math.min(27, state+1);
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000040';
      this.move(0,-.2,0).scale(1.8);
      this.line(V[ 0],V[ 1]).line(V[ 1],V[2]).line(V[2],V[ 3]).
           line(V[ 3],V[ 4]).line(V[ 4],V[5]).line(V[5],V[11]).
           line(V[11],V[10]).line(V[10],V[9]).line(V[9],V[ 8]).
           line(V[ 8],V[ 7]).line(V[ 7],V[6]).line(V[6],V[ 0]);

      let I = i => {
         if (i >= 12) i--;
         if (i >= 13) i--;
         if (i >= 24) i--;
         if (i >= 25) i--;
         return (i>>1) + 6 * (i&1);
      }
      ctx.strokeStyle = '#0000ff';
      ctx.fillStyle = '#0000ff20';
      this.dot(V[I(state)], 7);
      for (let i = 0 ; i < state ; i++) {
         this.line(V[I(i)],V[I(i+1)]);
	 if (i > 0)
            this.fillPolygon([V[I(i-1)],V[I(i)],V[I(i+1)]]);
      }
      this.text((state+1) + ' vertices', [-.01,-.21]);
      this.text(Math.max(0, state-1) + ' triangles', [0,-.33]);
   }
}

