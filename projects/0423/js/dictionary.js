let dictionary = {

// Simplest case: Replace keyword by text.

bar: 'Here is the text\nfor the word "bar".',

// Replace keyword by a mix of text and 2D graphics.

foo:
   [
      { text: 'foo', pos: [0,0] },
      [ [-.5,-.5], [-.5, .5], [ .5, .5] ],
   ],

// Replace keyword by a time varying function
// that displays a mix of text and 2D graphics.

x: (obj,t) => {
   let s = .5 * Math.sin(t);
   return [
      { text: 'hello', pos: [0,.5+.2*s] },
      [ [-s,-.5], [ s,.5] ],
      [ [ s,-.5], [-s,.5] ]
   ];
},

// Replace keyword by a time varying function
// that displays a mix of text and 2D graphics
// in response to user input.

track: (state,t,p,hasFocus) => {
   if (! state.p) state.p = [0,0];
   if (hasFocus) state.p = p;
   let x = state.p[0], y = state.p[1];
   if (hasFocus)
      return [
         [ [ -1, y], [ 1, y] ],         // If cursor is down,
         [ [ x, -1], [ x, 1] ],         // draw large crosshairs.
      ];
   else 
      return [
         [ [ x-.1, y ], [ x+.1, y ] ],  // If cursor is up,
         [ [ x, y-.1 ], [ x, y+.1 ] ],  // draw a small cross.
      ];
},

// Example of a a 3D object that responds to input.

cube: function(state,t,p,hasFocus) {
   if (! this.M) this.M = new M4();
   if (! state.p) state.p = [0,0];
   if (hasFocus) state.p = p;
   this.M.identity().perspective(0,0,10).rotateX(state.p[1]).rotateY(-state.p[0]).scale(.5);
   let C = cubeVertices, P = [];
   for (let i = 0 ; i < C.length ; i++)
      P.push(this.M.transform(C[i]));
   return [
      [P[0],P[1]], [P[2],P[3]], [P[4],P[5]], [P[6],P[7]],
      [P[0],P[2]], [P[1],P[3]], [P[4],P[6]], [P[5],P[7]],
      [P[0],P[4]], [P[1],P[5]], [P[2],P[6]], [P[3],P[7]],
    ];
},

};

