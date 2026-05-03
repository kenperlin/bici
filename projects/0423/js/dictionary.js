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

   let S = [];
   if (state.keyState == 'down')
      S.push({text: state.key, pos: [0,0], color: 'red'});
   S.push({draw: [P[0],P[1]]}, {draw: [P[2],P[3]]}, {draw: [P[4],P[5]]}, {draw: [P[6],P[7]]},
          {draw: [P[0],P[2]]}, {draw: [P[1],P[3]]}, {draw: [P[4],P[6]]}, {draw: [P[5],P[7]]},
          {draw: [P[0],P[4]]}, {draw: [P[1],P[5]]}, {draw: [P[2],P[6]]}, {draw: [P[3],P[7]]});
   return S;
},

editor: function(state,t,p,hasFocus) {
   if (! state.text) {
      state.text = 'Now is the time\nHor all good menN\nto come To the aid\nof their party.\nA B C D ElF G H\nB\nC\nD\nE\nF\nH';
      state.col = 0;
      state.row = 0;
   }

   if (state.keyState == 'release')
      switch (state.key) {
      case 'ArrowRight': state.col++; break;
      case 'ArrowLeft' : state.col--; break;
      case 'ArrowUp'   : state.row--; break;
      case 'ArrowDown' : state.row++; break;
      }

   let s = state.cardSize;
   S = [];
   let w = .036/s, h = .058/s, x = -.997 + w * state.col, y = .8 - h * state.row + .11 * s;
   S.push({text: state.text, pos: [-1,.88+.1*s], justify: [0,1], size: .03});
   S.push({fill: [[x,y], [x+w,y], [x+w,y+h], [x,y+h]], color: '#00000040'});
   return S;
},

};

