// TRIANGLE STRIP
function Diagram() {
   let V = [
      [-.52, .17],
      [-.46,.38],

      [-.32,-.02],
      [-.3,.2],

      [-.1,-.1],
      [-.1,.1],

      [ .1,-.1],
      [ .1,.1],

      [ .32,-.02],
      [ .3,.2],

      [ .52, .17],
      [ .46,.38],
   ];
   let state = 0;
   this.onUp = (x,y) => state = x < 0 ? Math.max(0, state-1)
                                      : Math.min(V.length-1, state+1);
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = '#00000040';
      this.scale(1.8);
      this.line(V[ 1],V[ 0]).line(V[ 0],V[2]).line(V[2],V[ 4]).
           line(V[ 4],V[ 6]).line(V[ 6],V[8]).line(V[8],V[10]).
           line(V[10],V[11]).line(V[11],V[9]).line(V[9],V[ 7]).
           line(V[ 7],V[ 5]).line(V[ 5],V[3]).line(V[3],V[ 1]);

      ctx.strokeStyle = '#0000ff';
      ctx.fillStyle = '#0000ff20';
      this.dot(V[state], .028);
      if (state > 0)
         for (let n = 0 ; n < state ; n++) {
            this.line(V[n],V[n+1]);
	    if (n > 0)
               this.fillPolygon([V[n-1],V[n],V[n+1]]);
         }
      this.text((state+1) + ' vertices', [-.01,-.35]);
      this.text(Math.max(0, state-1) + ' triangles', [0,-.47]);
   }
}
