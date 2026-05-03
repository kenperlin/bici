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
   let dirty = false;

   let rowLength = row => row < 0 || row >= state.lines.length ? 0 : state.lines[row].length;

   let computeIndex = () => {
      state.index = 0;
      let r = Math.min(state.row, state.lines.length);
      for (let n = 0 ; n < r ; n++) 
         state.index += state.lines[n].length + 1; 
      state.index += Math.min(state.col, state.lines[r].length);
   }

   let insertChar = ch => {
      state.text = state.text.substring(0, state.index) + ch + state.text.substring(state.index, state.text.length);
      if (ch == '\n') {
         state.row++;
         state.col = 0;
      }
      else {
         state.col++;                                     // AFTER INSERT: IF THE LINE ENDS
         let i = state.text.indexOf('\n', state.index);   // WITH A SPACE, THEN REMOVE IT.
         if (i >= 0 && state.text.charAt(i-1) == ' ')
            state.text = state.text.substring(0, i-1) + state.text.substring(i, state.text.length);
      }
      dirty = true;
   }

   let deleteChar = () => {
      if (state.row > 0 || state.col > 0) {
         let ch = state.text.substring(state.index, state.index+1);
         state.text = state.text.substring(0, state.index-1) + state.text.substring(state.index, state.text.length);
         if (state.col == 0)
            state.col = rowLength(--state.row);
         else
            state.col--;
      }
      else
         state.text = state.text.substring(1, state.text.length);
      dirty = true;
   }

   if (! state.text)
      state.text = '';

   if (! state.lines) {
      state.col = 0;
      state.row = 0;
      state.lines = state.text.split('\n');
      computeIndex();
   }

   let s = state.cardSize, w = .036/s, h = .058/s;

   if (hasFocus) {
      state.row = Math.min((1 - p[1]) / h >> 0, state.lines.length-1);
      state.col = Math.min((p[0] + 1) / w >> 0, state.lines[state.row].length);
      dirty = true;
   }

   if (state.keyState == 'release')
      switch (state.key) {
      case 'ArrowRight': state.col = Math.min(state.col+1, 80); dirty = true; break;
      case 'ArrowLeft' : state.col = Math.max(state.col-1,  0); dirty = true; break;
      case 'ArrowUp'   : state.row = Math.max(state.row-1,  0); dirty = true; break;
      case 'ArrowDown' : state.row = Math.min(state.row+1, state.lines.length-1); dirty = true; break;
      case 'Backspace' : deleteChar(); break;
      case 'Enter'     : insertChar('\n'); break;
      default          : insertChar(state.key); break;
      case 'Alt':
      case 'Control':
      case 'Escape':
      case 'Meta':
      case 'Shift':
         break;
      }

   if (dirty) {
      state.lines = state.text.split('\n');
      computeIndex();
   }

   let x = -.997 + w * state.col, y = 1 - h * state.row;

   S = [];
   for (let n = 0 ; n < state.lines.length ; n++)
      S.push({text: state.lines[n], pos: [-1,1-(n+.6)*h], justify: [0,1], size: .03});
   S.push({fill: [[x,y-h], [x+w,y-h], [x+w,y], [x,y]], color: '#00000040'});
   return S;
},

};

