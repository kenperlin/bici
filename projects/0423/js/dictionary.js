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

x: t => {
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

track: (t,p,pressed) => {
   let x = p[0], y = p[1];
   if (pressed)                  // Cursor down: show
      return [                   // large crosshairs.
         [ [ -1, y], [ 1, y] ],
         [ [ x, -1], [ x, 1] ],
      ];
   else                          // Cursor up: show
      return [                   // small cursor.
         [ [ x-.1, y ], [ x+.1, y ] ],
         [ [ x, y-.1 ], [ x, y+.1 ] ],
      ];
},

cube: function(t,p,pressed) {
   if (this.p === undefined) {
      this.p = [0,0];
      this.M = new M4();
   }
   if (pressed && p[0]*p[0]<1 && p[1]*p[1]<1) {
     this.p[0] = p[0];
     this.p[1] = p[1];
   }
   this.M.identity();
   this.M.perspective(0,0,10);
   this.M.scale(.5);
   this.M.rotateX( this.p[1]);
   this.M.rotateY(-this.p[0]);
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

