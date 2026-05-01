let dictionary = {

// Simplest case: Replace keyword by text.

bar: 'Here is the text\nfor the word "bar".',

// Replace keyword by a mix of text and 2D graphics.

bracket:
   [
      { text: 'bracket', pos: [0,0] },
      { draw: [ [-.5,-.5], [-.5, .5], [ .5, .5] ] },
   ],

// Replace keyword by a time varying function
// that displays a mix of text and 2D graphics.

hello: (obj,t) => {
   let s = .5 * Math.sin(t);
   return [
      { text: 'hello', pos: [0,.5+.2*s] },
      { draw: [ [-s,-.5], [ s,.5] ] },
      { draw: [ [ s,-.5], [-s,.5] ] },
   ];
},

// Replace keyword by a time varying function
// that displays a mix of text and 2D graphics
// in response to user input.

trackpad: (state,t,p,hasFocus) => {
   if (! state.p) state.p = [0,0];
   if (hasFocus) state.p = p;
   let x = state.p[0], y = state.p[1];

   if (! state.T) state.T = [.5,.5,.5,.5,.5,.5,.5,.5,.5,.5];
   state.T[0] = .5 + .5 * x;
   state.T[1] = .5 + .5 * y;

   if (hasFocus)
      return [
         {draw: [ [ -1, y], [ 1, y] ]},         // If cursor is down,
         {draw: [ [ x, -1], [ x, 1] ]},         // draw large crosshairs.
      ];
   else 
      return [
         {draw: [ [ x-.1, y ], [ x+.1, y ] ]},  // If cursor is up,
         {draw: [ [ x, y-.1 ], [ x, y+.1 ] ]},  // draw a small cross.
      ];
},

sliders: function(state,t,p,hasFocus) {

   if (! state.p)
      state.p = [0,0];
   if (hasFocus)
      state.p = p;

   if (! state.T) state.T = [.5,.5,.5,.5,.5,.5,.5,.5,.5,.5];

   let px = state.p[0], py = state.p[1];

   if (hasFocus && state.n === undefined)
      state.n = 5*(1-py)>>0;
   if (! hasFocus)
      delete state.n;

   if (hasFocus)
      state.T[state.n] = .5 + .5 * px;

   let S = [];
   for (let n = 0 ; n < 10 ; n++) {
      let x = 2 * state.T[n] - 1;
      let y = .9 - .2 * n;
      S.push({fill: [[x,y-.1],[1,y-.1],[1,y+.1],[x,y+.1]], color:'#e0e0e0'});
   }
   for (let n = 0 ; n < 10 ; n++) {
      let y = .9 - .2 * n;
      S.push({draw: [[-1,y-.1],[1,y-.1]]});
      S.push({text: 'T[' + n + ']', pos: [-.76,y-.11]});
   }
   return S;
},

// Example of a a 3D object that responds to input.

cube: function(state,t,p,hasFocus) {
   if (! this.M) this.M = new M4();
   if (! state.p) state.p = [0,0];
   if (hasFocus) state.p = p;
   let s = state.T ? state.T[0] : .5;
   this.M.identity().perspective(0,0,10).rotateX(state.p[1]).rotateY(-state.p[0]).scale(s);
   let C = cubeVertices, P = [];
   for (let i = 0 ; i < C.length ; i++)
      P.push(this.M.transform(C[i]));
   return [
      {draw: [P[0],P[1]]}, {draw: [P[2],P[3]]}, {draw: [P[4],P[5]]}, {draw: [P[6],P[7]]},
      {draw: [P[0],P[2]]}, {draw: [P[1],P[3]]}, {draw: [P[4],P[6]]}, {draw: [P[5],P[7]]},
      {draw: [P[0],P[4]]}, {draw: [P[1],P[5]]}, {draw: [P[2],P[6]]}, {draw: [P[3],P[7]]},
    ];
},

};

