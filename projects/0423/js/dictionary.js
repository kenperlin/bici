let dictionary = {

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

   state.T[0] = .5 + .5 * x;
   state.T[1] = .5 + .5 * y;

   let round = t => {
      let s = '' + (100 * Math.abs(t) >> 0);
      let n = s.length;
      return (t<0 ? '-' : '') + s.substring(0,n-2) + (n<2 ? '.0' : '.') + s.substring(n-2);
   }

   return [
      {draw: [ [ -1, y], [ 1, y] ]},         // If cursor is down,
      {draw: [ [ x, -1], [ x, 1] ]},         // draw large crosshairs.
      {text: 'x=' + round(state.T[0]), pos: [-.5,.5]},
      {text: 'y=' + round(state.T[1]), pos: [.5,.5]},
   ];
},

sliderX: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 5;
   state.lineWidth = .008;

   if (hasFocus) state.T[0] = .5 + .5 * p[0];

   let x = 2 * state.T[0] - 1;
   return [
      {draw: [ [ -1, 0 ], [ 1, 0 ] ]},
      {draw: [ [ x, -1 ], [ x, 1 ] ]},
   ];
},

sliderY: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 1/5;
   state.lineWidth = .008;

   if (hasFocus) state.T[0] = .5 + .5 * p[1];

   let y = 2 * state.T[0] - 1;
   return [
      {draw: [ [ 0, -1 ], [ 0, 1 ] ]},
      {draw: [ [ -1, y ], [ 1, y ] ]},
   ];
},

sliders: function(state,t,p,hasFocus) {

   if (! state.p)
      state.p = [0,0];
   if (hasFocus)
      state.p = p;

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
      S.push({text: '#' + n, pos: [-.86,y-.11]});
      let s = '' + (100 * state.T[n] >> 0) / 100;
      if (s.indexOf('.') == s.length - 2) s += '0';
      if (s.indexOf('-') == 0) s += ' ';
      if (s.length == 2) s = s.substring(0,1) + '.00';
      S.push({text: s, pos: [0,y-.11]});
   }
   return S;
},

timer: function(state,t,p,hasFocus) {
   state.hideFrame = true;
   state.lineWidth = .008;

   if (! state.t0)
      state.t0 = t;

   let S = [];
   let circle = [];
   for (let n = 0 ; n <= 30 ; n++) {
      let theta = 2 * Math.PI * n / 30;
      circle.push([Math.cos(theta),Math.sin(theta)]);
   }
   S.push({ draw: circle });

   for (let n = 0 ; n < 12 ; n++) {
      let theta = 2 * Math.PI * n / 12;
      let c = Math.cos(theta);
      let s = Math.sin(theta);
      S.push({ draw: [ [c,s], [.85*c,.85*s] ] });
   }

   state.T[0] = t - state.t0;

   t = 2*Math.PI * state.T[0] / 60;
   S.push({ draw: [ [0,0],[.8*Math.sin(t),.8*Math.cos(t)] ] });

   let text = '' + ((10*state.T[0]>>0)/10);
   if (text.indexOf('.') < 0) text += '.0';
   S.push({ text: text, pos: [0,.5] });

   return S;
},

// Example of a a 3D object that responds to input.

cube: function(state,t,p,hasFocus) {
   state.hideFrame = true;
   state.lineWidth = .008;
   state.noClipping = true;

   if (! this.M) this.M = new M4();
   if (! state.p) state.p = [0,0];
   if (hasFocus) state.p = p;
   let s = state.T ? 2 * state.T[0] : 1;
   this.M.identity().perspective(0,0,10).rotateX(state.p[1]).rotateY(-state.p[0]).scale(.9*s);
   let C = cubeVertices, P = [];
   for (let i = 0 ; i < C.length ; i++)
      P.push(this.M.transform(C[i]));

   return [
      {draw: [P[0],P[1]]}, {draw: [P[2],P[3]]}, {draw: [P[4],P[5]]}, {draw: [P[6],P[7]]},
      {draw: [P[0],P[2]]}, {draw: [P[1],P[3]]}, {draw: [P[4],P[6]]}, {draw: [P[5],P[7]]},
      {draw: [P[0],P[4]]}, {draw: [P[1],P[5]]}, {draw: [P[2],P[6]]}, {draw: [P[3],P[7]]} ];
},

editor: function(state,t,p,hasFocus) {
   let dirty = false;

   let rowLength = row => row < 0 || row >= state.lines.length ? 0 : state.lines[row].length;

   let computeIndex = () => {
      state.index = 0;
      let r = Math.min(state.row, state.lines.length);
      console.log('row', state.row);
      console.log('lines', state.lines);
      console.log('lines.length', state.lines.length);
      console.log('r', r);
      for (let n = 0 ; n < r ; n++) 
         state.index += state.lines[n].length + 1; 
      state.index += Math.min(state.col, state.lines[r].length);
   }

   //////////////// HANDLE UNDO AND REDO

   let getTextState = () => {
      return {
         text : state.text,
         col  : state.col,
         row  : state.row,
         index: state.index,
      };
   }

   let setTextState = info => {
      state.text  = info.text;
      state.col   = info.col;
      state.row   = info.row;
      state.index = info.index;
      dirty = true;
   }

   let initUndo = () => {
      state.stackPointer = 0;
      state.stack = [ getTextState() ];
   }

   let saveForUndo = () => {
      state.stack[++state.stackPointer] = getTextState();
   }

   let undo = () => {
      if (state.stackPointer >= 0)
         setTextState(state.stack[state.stackPointer--]);
   }

   let redo = () => {
      if (state.stackPointer < state.stack.length - 1)
         setTextState(state.stack[++state.stackPointer]);
   }

   /////////////////////////////////////

   let insertChar = ch => {
      if (state.selectionStart < state.selectionEnd)
         deleteChar();

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
      if (state.selectionStart < state.selectionEnd) {
         state.text = state.text.substring(0, state.selectionStart) + state.text.substring(state.selectionEnd+1);
         state.col -= state.selectionEnd - state.selectionStart;
         state.selectionStart = state.selectionEnd = -1;
      }
      else if (state.row > 0 || state.col > 0) {
         let ch = state.text.substring(state.index, state.index+1);
         state.text = state.text.substring(0, state.index-1) + state.text.substring(state.index);
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
      state.selectionStart = -1;
      state.selectionEnd = -1;
      state.lines = state.text.split('\n');
      state.stack = [];
      state.stackPointer = -1;
      state.setText = text => {
         state.text = text;
	 initUndo();
      }
      computeIndex();
   }

   let s = state.cardSize, w = .036/s, h = 2 / Math.max(1, state.lines.length);

   let computeColRowIndex = p => {
      state.row = Math.min((1 - p[1]) / h >> 0, state.lines.length-1);
      state.col = Math.min((p[0] + 1) / w >> 0, state.lines[state.row].length);
      computeIndex();
   }

   if (! state.hadFocus && hasFocus) {
      computeColRowIndex(p);
      state.selectionStart = state.selectionEnd = state.index;
      dirty = true;
   }

   if (state.hadFocus && hasFocus) {
      computeColRowIndex(p);
      state.selectionStart = Math.min(state.selectionStart, state.index);
      state.selectionEnd   = Math.max(state.selectionEnd  , state.index);
      dirty = true;
   }

   if (state.hadFocus && ! hasFocus) {
      if (state.selectionStart == state.selectionEnd) {
         state.selectionStart = -1;
         state.selectionEnd   = -1;
      }
   }

   state.hadFocus = hasFocus;

   let process = () => {
      state.lines = state.text.split('\n');
      state.dirty = true;
      computeIndex();
   }

   async function copy() {
      try {
          let text = state.text.substring(state.selectionStart, state.selectionEnd+1);
          await navigator.clipboard.writeText(text);
	  process();
      } catch (err) {
          console.error('Copy failed:', err);
      }
   }

   async function paste() {
      try {
          let text = await navigator.clipboard.readText();
          state.text = state.text.substring(0,state.index) + text + state.text.substring(state.index);
	  process();
       } catch (err) {
          console.error('Paste failed:', err);
       }
   }

   async function cut() {
      try {
         let text = state.text.substring(state.selectionStart, state.selectionEnd+1);
         await navigator.clipboard.writeText(text);
         state.text = state.text.substring(0,state.selectionStart) + state.text.substring(state.selectionEnd+1);
         state.col -= state.selectionEnd - state.selectionStart;
         process();
      } catch (err) {
         console.error('Cut failed:', err);
      }
   }

   if (state.keyState == 'press')
      if (state.key == 'Meta')
         state.isMetaDown = true;
      else if (state.isMetaDown)
         switch (state.key) {
         case 'c': copy() ; break;
         case 'v': paste(); break;
         case 'x': cut()  ; break;
         case 'y': redo() ; break;
         case 'z': undo() ; break;
         }
      
   if (state.keyState == 'release') {
      switch (state.key) {
      case 'ArrowRight':
         if (state.col < state.lines[state.row].length)
            state.col++;
         else if (state.row < state.lines.length - 1) {
            state.row++;
            state.col = 0;
         }
         dirty = true;
         break;
      case 'ArrowLeft':
         if (state.col > 0)
            state.col--;
         else if (state.row > 0) {
            state.row--;
            state.col = state.lines[state.row].length;
         }
         dirty = true;
         break;
      case 'ArrowUp':
         state.row = Math.max(state.row-1,  0); dirty = true;
         break;
      case 'ArrowDown':
         state.row = Math.min(state.row+1, state.lines.length-1); dirty = true;
         break;
      case 'Backspace':
         deleteChar();
         break;
      case 'Enter':
         insertChar('\n');
         break;
      default :
         insertChar(state.key);
         break;
      case 'Meta':
         state.isMetaDown = false;
         break;
      case 'Control':
         state.isControlDown = false;
	 break;
      case 'Alt':
      case 'Escape':
      case 'Shift':
      case 'Tab':
         break;
      }
      saveForUndo();
   }

   if (dirty)
      process();

   let x = -.997 + w * state.col, y = 1 - h * state.row;

   let getXY = (col,row) => {
      return [ -1 + w * col, 1 - row*h ];
   }

   S = [];
   let i = 0;
   for (let row = 0 ; row < state.lines.length ; row++) {
      let text = state.lines[row];
      S.push({text: text, pos: [-1,1-(row+.6)*h], justify: [0,1], size: .03});
      for (let col = 0 ; col < text.length ; col++)
         if (i + col >= state.selectionStart && i + col <= state.selectionEnd) {
            let x = w * col - 1;
            let y = 1 - row * h;
            S.push({fill: [[x,y-h], [x+w,y-h], [x+w,y], [x,y]], color: '#00000040'});
         }
      i += text.length + 1;
   }
   if (state.selectionStart == state.selectionEnd) {
      let col = Math.min(state.col, state.lines[state.row].length);
      let x = w * col - 1;
      S.push({fill: [[x,y-h], [x+w,y-h], [x+w,y], [x,y]], color: '#00000040'});
   }
   return S;
},

};

