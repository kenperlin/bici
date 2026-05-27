let dictionary = {

fish: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 5;
   state.lineWidth = .008;
   state.noClipping = true;

   if (hasFocus)
      state.isMoving = true;

   let s = 0;
   if (state.isMoving) {
      if (state.t0)
         state.move = [.4 * (t - state.t0), 0];
      state.t0 = t;
      s = Math.sin(10*t);
   }

   let curve = [];
   for (let n = 0 ; n <= 30 ; n++)
      curve.push([ evalBezier([-1, 1.7,1.7, -1], n/30),
                   evalBezier([1-s/2,-5,5,-1-s/2], n/30) + s*(.1-.05*Math.cos(4*Math.PI*n/30))]);
   let S = [ {draw: curve},
             {draw: [[-1,1-s/2],[-1,-1-s/2]]} ];
   if (t >= 1) {
      let y = .1 - .05*s;
      S.push({draw: [[.65,y],[.7,y+.2],[.75,y+.2],[.8,y],[.75,y-.2],[.7,y-.2],[.65,y]],
                    lineWidth: .004 });
   }
   return S;
},

spline: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.noClipping = true;

   state.draw.lineWidth(.005).drawRect([-1,-1],[1,1])
             .fillColor('#ffffff40').fillRect([-1,-1],[1,1])

   if (! state.data) {
      state.data = [[-1,0],[-1/3,0],[1/3,0],[1,0]];
      state.i = -1;
   }

   let X = [state.data[0][0],state.data[1][0],state.data[2][0],state.data[3][0]];
   let Y = [state.data[0][1],state.data[1][1],state.data[2][1],state.data[3][1]];

   let u = (state._I[0] + 1000) % 1;
   state._O[0] = evalBezier(X, u);
   state._O[1] = evalBezier(Y, u);

   switch (state.mouseState) {
   case 'press':
      for (state.i = state.data.length - 1 ; state.i >= 0 ; state.i--)
         if (norm(subtract(state.data[state.i], p)) < .1)
	    break;
   case 'drag':
      if (state.i >= 0) {
         state.data[state.i][1] = Math.max(-1,Math.min(1,p[1]));
         state.data[state.i][0] = Math.max(-1,Math.min(1,p[0]));
      }
      break;
   case 'release':
      state.i = -1;
      break;
   }

   state.draw.lineWidth(.01).path(state.data);

   let curve = [];
   for (let t = 0 ; t <= 1 ; t += 1/30)
      curve.push([evalBezier(X, t), evalBezier(Y, t)]);
   state.draw.lineWidth(.02).path(curve);

   for (let i = 0 ; i < state.data.length ; i++)
      state.draw.fillColor('white').fillArc(state.data[i], .1)
                .drawColor('black').lineWidth(.005).arc(state.data[i], .1)
		.setFont(.15,'Helvetica').text(''+(i+1), state.data[i], .5, 1.2);


   return [];
},

curve: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 5;
   if (state.keys === undefined) {
      state.keys = [[-1,.5],[1,.5]];
      state.n = -1;
   }

   if (state.mouseState == 'press') {
      for (state.n = state.keys.length - 1 ; state.n >= 0 ; state.n--)
	 if (Math.abs(p[0] - state.keys[state.n][0]) < .1)
	    break;
   }

   let y = t => Math.max(.3, Math.min(.7, .5 + t / 5));

   if (state.mouseState == 'drag')
      if (state.n >= 0) {
         state.keys[state.n][1] = y(p[1]);
         if (state.n > 0 && state.n < state.keys.length-1) {
            state.keys[state.n][0] = Math.max(-1, Math.min(1, p[0]));
            state.keys.sort((a,b) => a[0] - b[0]);
            for (state.n = state.keys.length - 1 ; state.n >= 0 ; state.n--)
               if (state.keys[state.n][0] == p[0])
                  break;
         }
      }

   if (state.mouseState == 'release') {
      if (state.n < 0) {
         state.keys.push([p[0], y(p[1])]);
         state.keys.sort((a,b) => a[0] - b[0]);
      }
      else if (state.mouseClick || state.n > 0 && state.n < state.keys.length-1 && p[0]*p[0] > 1)
         state.keys.splice(state.n, 1);
      state.n = -1;
   }

   if (state._I.length > 0) {
      let x = state._I[0];
      for (let n = 0 ; n < state.keys.length - 1 ; n++) {
         let x0 = state.keys[n][0], x1 = state.keys[n+1][0];
         if (x >= x0 && x < x1) {
            let y0 = 5 * (state.keys[n  ][1] - .5),
	        y1 = 5 * (state.keys[n+1][1] - .5);
	    let f = (x - x0) / (x1 - x0);
	    state._O[0] = y0 + f * (y1 - y0);
	    break;
	 }
      }
   }

   state.draw.fillColor('#ffffff40').fillRect([-1,-1 ],[1,1 ])
             .lineWidth(.003).drawColor('#000000'  ).drawRect([-1,.3],[1,.7]);
   state.draw.lineWidth(.012).path(state.keys);
   state.draw.lineWidth(.003);
   for (let n = 0 ; n < state.keys.length ; n++) {
      let x = state.keys[n][0];
      state.draw.line([x,.3],[x,.7]);
   }
   return [];
},

trackpad: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   if (! state.p) state.p = [0,0];
   if (hasFocus)
      state.p = p;
   else {
      if (state._I.length > 0) state.p[0] = state._I[0];
      if (state._I.length > 1) state.p[1] = state._I[1];
   }
   let x = state.p[0], y = state.p[1];

   state._O[0] = x;
   state._O[1] = y;

   state.draw.lineWidth(.01).drawRect([-1,-1],[1,1])
             .fillColor('#ffffff40').fillRect([-1,-1],[1,1])
             .lineWidth(.03)
             .line([-1,y],[1,y])
             .line([x,-1],[x,1])
             .setFont(.2, 'Courier')
	     .text('x=' + round2(state._O[0]), [-.5,.5])
             .text('y=' + round2(state._O[1]), [ .5,.5]);

   return [];
},

scope: (state,t,p,hasFocus) => {
   let N = 100;

   if (! state.signal)
      state.signal = [];

   let trace = [];
   switch (state._I.length) {
   case 1:                              // TRACE A 1D SIGNAL OVER TIME
      state.signal.push(state._I[0]);
      if (state.signal.length > N)
         state.signal.shift();
      for (let n = 0 ; n < state.signal.length ; n++)
         if (n==0 || n==state.signal.length-1 || state.signal[n] != state.signal[n-1])
            trace.push([ n/(N/2-1) - 1, state.signal[n] ]);
      break;

   case 2:                              // TRACE A 2D SIGNAL OVER TIME
      state.signal.push(state._I);
      if (state.signal.length > N)
         state.signal.shift();
      trace = state.signal;
      break;
   }

   return [ { draw: trace, lineWidth: .002 } ];
},

button: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 2;
   state.lineWidth = .008;

   if (state.mouseState == 'press')
      state.isPressed = true;

   if (state.mouseState == 'release') {
      state.isOn = ! state.isOn;
      state.isPressed = false;
   }

   if (state._I.length == 0)
      state._O[0] = state.isOn ? 1 : -1;
   else
      for (let n = 0 ; n < state._I.length ; n++)
         state._O[n] = state.isOn ? state._I[n] : 0;

   let d = .2, y = .3, h = .5;
   let path = [[1-d,y+h],[1-d/3,y+h-d/3],[1,y+h-d],
               [1,y-h+d],[1-d/3,y-h+d/3],[1-d,y-h],
	       [d-1,y-h],[d/3-1,y-h+d/3],[-1,y-h+d],
	       [-1,y+h-d],[d/3-1,y+h-d/3],[d-1,y+h],
	       [1-d,y+h]];
   state.draw.fillColor(state.isPressed ? '#909090' : state.isOn ? '#ffffff' : '#c8c8c8').fillPolygon(path)
             .lineWidth(.03).path(path)
             .setFont(.8)
	     .text(state.isOn ? 'ON' : 'OFF', [0,0], .5, .85);

   return [];
},

sliderX: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 5;
   state.lineWidth = .008;
   state.noClipping = true;

   if (! state.t) state.t = 0;
   if (hasFocus) state.t = p[0];
   state._O[0] = state.t;

   let x = state.t;
   return [
      {draw: [ [ -1, 0 ], [ 1, 0 ] ]},
      {draw: [ [ x, -1 ], [ x, 1 ] ]},
      {text: round2(state._O[0]), pos: [x-.05,.05], justify: [1,.5]},
   ];
},

sliderY: (state,t,p,hasFocus) => {
   state.hideFrame = true;
   state.aspectRatio = 1/5;
   state.lineWidth = .008;
   state.noClipping = true;

   if (! state.t) state.t = 0;
   if (hasFocus) state.t = p[1];
   state._O[0] = state.t;

   let y = state.t;
   return [
      {draw: [ [ 0, -1 ], [ 0, 1 ] ]},
      {draw: [ [ -1, y ], [ 1, y ] ]},
      (y*y > 1 ? {text: round2(state._O[0]), scale: 5, pos: [0  ,y+.1], justify: [.5,1] }
               : {text: round2(state._O[0]), scale: 5, pos: [-.2,y+.1], justify: [1 ,1] }),
   ];
},

sliders: function(state,t,p,hasFocus) {

   if (state.N === undefined) {
      state._O = [0];
      state.N = 2;
      state.flip = 1;
   }
   let N = state.N;

   let h = 2/N;

   state.hideFrame = true;
   state.noClipping = true;
   state.aspectRatio = 10/N;

   let i = p[1]*p[1] > 1 ? -2 : (N/2 * (1 - p[1]) >> 0) - state.flip;
   if (state.mouseState == 'press') {
      state.p_press = p.slice();
      state.i = i;
   }
   if (state.mouseState == 'drag')
      i = state.i;

   if (state.i >= 0 && (state.mouseState == 'press' || state.mouseState == 'drag'))
      state._O[state.i] = p[0];

   if (state.i == (state.flip ? -1 : N-1) && state.mouseState == 'release') {
      let dx = p[0] - state.p_press[0], dy = p[1] - state.p_press[1];
      if (dy*dy > h*h && dy*dy > dx*dx)
         state.flip = 1 - state.flip;
      else if (p[0] > 0) {
         state._O.push(0);
         state.N++;
      }
      else if (N > 2) {
         state._O.pop();
         state.N--;
      }
      state.dirty = true;
   }

   S = [];

   let isIn = p[0]*p[0] < 1;
   for (let n = 0 ; n < N-1 ; n++) {
      let y = 1 - (n+state.flip)*h;
      S.push({fill: [[-1,y],[1,y],[1,y-h],[-1,y-h],[-1,y]], color: '#b0b0b0'});
      let x = Math.max(-1, Math.min(1, state._O[n]));
      S.push({fill: [[-1,y],[x,y],[x,y-h],[-1,y-h],[-1,y]], color: '#e0e0e0'});
      S.push({draw: [[-1,y],[1,y],[1,y-h],[-1,y-h],[-1,y]], lineWidth: isIn && n==i ? .004 : .002});
      S.push({text: '@' + n, pos: [-.98,y], justify: [0,1.75], scale: .9});
      S.push({text: round2(state._O[n]), pos: [-.05,y-1.15*h], scale: .9});
   }
   
   let y = state.flip ? 1 : 1 - (N-1)*h;
   S.push({fill: [[-1,y],[0,y],[0,y-h],[-1,y-h],[-1,y]],
          color: i == -1 && p[0]<0 && state.mouseState == 'drag' ? '#c06060' : '#ffa0a0'});
   S.push({fill: [[0,y],[1,y],[1,y-h],[0,y-h],[0,y]],
          color: i == -1 && p[0]>0 && state.mouseState == 'drag' ? '#6080e0' : '#a0c0ff'});
   if (N > 2)
      S.push({text: 'del', pos: [-.5,y-h-.23/N], scale: .9});
   S.push({text: 'add', pos: [ .5,y-h-.23/N], scale: .9});
   S.push({draw: [[-1,y],[0,y],[0,y-h],[-1,y-h],[-1,y]], lineWidth: isIn&&i==-1&&p[0]<0&&N>2 ? .004 : .002});
   S.push({draw: [[ 0,y],[1,y],[1,y-h],[ 0,y-h],[ 0,y]], lineWidth: isIn&&i==-1&&p[0]>0      ? .004 : .002});

   return S;
},

timeline: function(state,t,p,hasFocus) {
   state.hideFrame = true;
   state.noClipping = true;
   state.aspectRatio = 5;

   let time = Date.now() / 1000;
   let y = p[1];

   if (state.mode == undefined) {
      state.mode = 0;
      state.duration = 60;
   }

   if (state.mouseState == 'press')
      state.y = p[1];

   if (state.mouseState == 'drag') {
      state.duration = Math.max(1, state.duration + 10 * (p[1] - state.y));
      state.y = p[1];
   }

   if (state.mouseState == 'release')
      if (state.mouseClick)
         state.mode = (state.mode + 1) % 2;

   switch (state.mode) {
   case 0:
      state.t = 0;
      break;
   case 1:
      state.t = Math.min(1, state.t + (time - state.time) / (state.duration >> 0));
      break;
   }

   state.time = time;

   let x = 2 * state.t - 1;
   state._O[0] = x;

   let a = '' + (state.t * state.duration >> 0);
   let b = '' + (state.duration >> 0);
   if (a.length < b.length)
      a = ' ' + a;
   state.draw.lineWidth(.03)
             .line([-1,.5],[1,.5])
             .line([x,.5-.2],[x,.5+.2])
	     .setFont(.2, 'Courier')
	     .text(a + ' secs', [0,.5], .5, .6)
	     .text(b + ' secs', [0,.5], .5, 1.7);
   return [];
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

   state._O[0] = t - state.t0;

   t = 2*Math.PI * state._O[0] / 60;
   S.push({ draw: [ [0,0],[.8*Math.sin(t),.8*Math.cos(t)] ] });

   let text = '' + ((10*state._O[0]>>0)/10);
   if (text.indexOf('.') < 0) text += '.0';
   S.push({ text: text, pos: [0,.5] });

   return S;
},

cube: function(state,t,p,hasFocus) {
   state.hideFrame = true;
   state.lineWidth = .008;
   state.noClipping = true;

   if (! this.M) this.M = new Matrix();
   if (! state.p) state.p = [0,0];
   if (hasFocus) state.p = p;

   this.M.identity();
   this.M.perspective(0,0,-5);
   this.M.turnX(state.p[1]);
   this.M.turnY(-state.p[0]);
   //this.M.scale(.9);

   let C = cubeVertices, P = [];
   for (let i = 0 ; i < C.length ; i++)
      P.push(this.M.transform(C[i]));

   return [
      {draw: [P[0],P[1]]}, {draw: [P[2],P[3]]}, {draw: [P[4],P[5]]}, {draw: [P[6],P[7]]},
      {draw: [P[0],P[2]]}, {draw: [P[1],P[3]]}, {draw: [P[4],P[6]]}, {draw: [P[5],P[7]]},
      {draw: [P[0],P[4]]}, {draw: [P[1],P[5]]}, {draw: [P[2],P[6]]}, {draw: [P[3],P[7]]} ];
},

editor: function(state,t,p,hasFocus) {
   state.bgColor = '#ffffff80';
   let dirty = false;

   let rowLength = row => row < 0 || row >= state.lines.length ? 0 : state.lines[row].length;

   let computeIndex = () => {
      state.index = 0;
      let r = Math.min(state.row, state.lines.length);
      for (let n = 0 ; n < r ; n++) 
         state.index += state.lines[n].length + 1; 
      if (r < state.lines.length)
         state.index += Math.min(state.col, state.lines[r].length);
   }

   //////////////// HANDLE UNDO AND REDO ////////////////

   let getTextState = () => {
      return {
         text: state.text,
         col : state.col,
         row : state.row,
      };
   }

   let setTextState = info => {
      state.text = info.text;
      state.col  = info.col;
      state.row  = info.row;
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

   //////////////////////////////////////////////////////

   let insertChar = ch => {
      if (state.selectionStart < state.selectionEnd)
         deleteChar();

      state.text = state.text.substring(0, state.index) + ch + state.text.substring(state.index, state.text.length);
      if (ch == '\n') {
         state.row++;
         state.col = 0;
      }
      else
         state.col++;
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
      computeIndex();
   }

   if (state.newText) {
      state.text = state.newText;
      initUndo();
      delete state.newText;
      dirty = true;
   }

   state.textSize = .0275;
   let s = state.cardSize,
       w = 1.2 * state.textSize / s,
       h = 2 / Math.max(1, state.lines.length);

   let computeColRowIndex = p => {
      state.row = Math.max(0, Math.min((1 - p[1]) / h >> 0, state.lines.length-1));
      state.col = Math.max(0, Math.min((p[0] + 1) / w >> 0, state.lines[state.row].length));
      computeIndex();
   }

   switch (state.mouseState) {
   case 'move':
      if (Date.now() / 1000 - state.clickTime > .5)
         state.clickCount = 0;
      break;

   case 'press':
      computeColRowIndex(p);
      state.selectionStart = state.selectionEnd = state.index;
      dirty = true;
      break;

   case 'drag':
      computeColRowIndex(p);
      state.selectionStart = Math.min(state.selectionStart, state.index);
      state.selectionEnd   = Math.max(state.selectionEnd  , state.index);
      dirty = true;
      break;

   case 'release':
      if (state.clickCount === undefined)
         state.clickCount = 0;
      if (state.mouseClick) {
         state.clickCount++;
         state.clickTime = Date.now() / 1000;
      }
      else
         state.clickCount = 0;

      let isInWord = i => {
         let ch = state.text[i];
	 return ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' ||
	        ch >= '0' && ch <= '9' || ch == '_' || ch == "'" || ch == '-';
      }

      switch (state.clickCount) {

      // IF TRIPLE CLICK, SELECT AN ENTIRE LINE.

      case 3:
         while (state.selectionStart > 0 && state.text[state.selectionStart-1] != '\n')
            state.selectionStart--;
         while (state.selectionEnd < state.text.length-1 && state.text[state.selectionEnd] != '\n')
            state.selectionEnd++;
	 break;

      // IF DOUBLE CLICK, SELECT AN ENTIRE WORD.

      case 2:
	 state.selectionStart = state.selectionEnd = state.clickIndex;
         while (state.selectionStart > 0 && isInWord(state.selectionStart-1))
            state.selectionStart--;
         while (state.selectionEnd < state.text.length-1 && isInWord(state.selectionEnd+1))
            state.selectionEnd++;
         state.clickIndex = null;
	 break;

      // IF SINGLE CLICK, SET THE CURSOR POSITION.

      case 1:
         state.selectionStart = -1;
         state.selectionEnd   = -1;
         state.clickIndex = state.index;
	 break;
      }
      break;
   }

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
         //state.col -= state.selectionEnd - state.selectionStart;
	 state.selectionStart = state.selectionEnd = -1;
         process();
      } catch (err) {
         console.error('Cut failed:', err);
      }
   }

   if (state.keyState == 'press')
      if (state.key == 'Meta')
         state.isMetaDown = true;
      else if (state.key == 'Shift')
         state.isShiftDown = true;
      else if (state.isMetaDown)
         switch (state.key) {
         case 'a': state.selectionStart = 0;
	           state.selectionEnd = state.text.length-1;
	           break;
         case 'c': saveForUndo(); copy() ; break;
         case 'v': saveForUndo(); paste(); break;
         case 'x': saveForUndo(); cut()  ; break;
         case 'y': redo() ; break;
         case 'z': undo() ; break;
         }
      
   if (state.keyState == 'release') {

      // BEFORE THIS KEY STROKE IS PROCESSED, SAVE THE PREVIOUS STATE FOR UNDO.

      if (! state.isMetaDown)
         saveForUndo();

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
         state.row = Math.max(state.row-1, 0);
	 dirty = true;
         break;
      case 'ArrowDown':
         state.row = Math.min(state.row+1, state.lines.length-1);
	 dirty = true;
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
      case 'Shift':
         state.isShiftDown = false;
	 break;
      case 'Alt':
      case 'Tab':
         break;
      case 'Escape':
         state.isClosed = ! state.isClosed;
         break;
      }
   }

   if (dirty)
      process();

   let x = -.997 + w * state.col, y = 1 - h * state.row;

   let getXY = (col,row) => {
      return [ -1 + w * col, 1 - row*h ];
   }

   // FIND OUT WHAT INPUT PARAMETERS HAVE CHANGED SINCE THE PREVIOUS ANIMATION FRAME.

   if (! state._I_changed)
      state._I_changed = [0,0,0,0,0, 0,0,0,0,0];
   for (let n = 0 ; n < 10 ; n++)
      if (state._I[n] != state._I_prev[n])
         state._I_changed[n] = 31;

   // CREATE DISPLAY LIST TO SHOW THE TEXT.

   state.nLines = state.isClosed ? 1 : state.lines.length;

   S = [];
   let i = 0;
   for (let row = 0 ; row < state.nLines ; row++) {
      let text = state.lines[row];
      let nLines = state.lines.length;
      let justify = state.isClosed ? [0, 1.56 + nLines/800] : [0,1];
      S.push({text: text, pos: [-1,1-(row+.6)*h], justify: justify, size: state.textSize});
      let nChars = text.length + (i + text.length >= state.selectionStart &&
                                  i + text.length <= state.selectionEnd ? 1 : 0);

      // HIGHLIGHT ANY INPUT PARAMETERS THAT ARE CURRENTLY CHANGING.

      let isDigit = c => c >= '0' && c <= '9';

      for (let col = 0 ; col < nChars ; col++)
         if (text[col] == '@' && isDigit(text[col+1])) {
	    let ascii = text.charCodeAt(col+1);
	    let c = state._I_changed[ascii - 48];
	    if (c > 0) {
               let x = w * col - 1;
               let y = 1 - row * h;
               S.push({draw: [ [x-w/2  ,y-h*5/4],
	                       [x+w*5/2,y-h*5/4],
			       [x+w*5/2,y+h*.4 ],
			       [x-w/2  ,y+h*.4 ],
			       [x-w/2  ,y-h*5/4] ], color: '#ff0000' + hex(c<<3) });
	    }
	 }

      // HIGHLIGHT CHARACTERS THAT ARE IN THE SELECTED REGION.

      for (let col = 0 ; col < nChars ; col++)
         if (i + col >= state.selectionStart && i + col <= state.selectionEnd) {
            let x = w * col - 1;
            let y = 1 - row * h;
            S.push({fill: [[x,y-h], [x+w,y-h], [x+w,y], [x,y]], color: '#00000040'});
         }

      i += text.length + 1;
   }

   for (let n = 0 ; n < 10 ; n++)
      state._I_changed[n]--;

   // HIGHLIGHT THE CURSOR POSITION.

   if (! state.isClosed && state.selectionStart == state.selectionEnd)
      if (state.lines[state.row]) {
         let col = Math.min(state.col, state.lines[state.row].length);
         let x = w * col - 1;
         S.push({fill: [[x,y-h], [x+w,y-h], [x+w,y], [x,y]], color: '#00000040'});
      }

   return S;
},

};

