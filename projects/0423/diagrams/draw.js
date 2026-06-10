function Diagram() {

   window.cross = cross;

   this.isFullScreen = true;
   //tracking_isDrawingShadowAvatar = false;

   let M = new Matrix();

   let penColor = '#000000';

   let isCgCard = card => card.card_type == 'editor' && 
                          card.state && card.state.text &&
                          card.state.text.indexOf('cg.') >= 0;

   let isFsCard = card => card.card_type == 'editor' && 
                          card.state && card.state.text &&
                          ( card.state.text.indexOf('vec2(') >= 0 ||
                            card.state.text.indexOf('vec3(') >= 0 ||
                            card.state.text.indexOf('vec4(') >= 0 );

   // LOAD A SRC FILE FROM THE SERVER

   let loadSrcFile = (card, text) => {
      card.state.srcFile = text;
      getFile('projects/' + project + '/src/' + text, text => card.state.newText = text);
   }

   // SAVE A SRC FILE TO THE SERVER

   let saveSrcFile = (name, str) => {
      fetch('/api/save/' + name, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify([ { src: str } ])
      }).catch(err => console.error('server save str failed:', err));
   }

   // CREATE A NEW WEBRTC CHANNEL AND WRITE ITS CHANNEL ID TO A FILE ON THE SERVER.

   let channel = new Channel();
   channel.onOpen(id => {
      console.log('channel id =', id);
      saveSrcFile('webrtc_id.cg', id);
   });

   // LOAD A SCENE FROM THE SERVER

   let load = name => {
      fetch('/api/load/' + name)
         .then(r => r.ok ? r.json() : Promise.reject(r.status))
         .then(data => { S = data; dirty = true; })
         .catch(() => {
            const local = localStorage.getItem('saved_' + name);
            if (local) { S = JSON.parse(local); S_value = {}; dirty = true; }
         });
   }

   // SAVE THE CURRENT SCENE TO THE SERVER

   let previousSaveName = '';

   let save = name => {
      if (name.length == 0)
         name = previousSaveName;
      else
         previousSaveName = name;

      localStorage.setItem('saved_' + name, JSON.stringify(S));
      fetch('/api/save/' + name, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(S)
      }).catch(err => console.error('server save failed:', err));
   }

   // GET ALL OF THE INPUT LINK CARDS FOR THIS CARD

   let getSrcCards = card => {
      let srcCards = [];
      if (card.srcId)
         for (let i = 0 ; i < card.srcId.length ; i++)
            for (let n = 2 ; n < S.length ; n++)
               if (S[n].id == card.srcId[i])
                  srcCards.push(S[n]);
      return srcCards;
   }

   // GET ALL OF THE OUTPUT LINK CARDS FOR THIS CARD

   let getDstCards = card => {
      let dstCards = [];
      for (let n = 2 ; n < S.length ; n++)
         if (S[n].srcId)
            for (let i = 0 ; i < S[n].srcId.length ; i++)
               if (S[n].srcId[i] == card.id)
                  dstCards.push(S[n]);
      return dstCards;
   }

   // REPLACE ALL OCCURANCES OF '@#' BY '_I[#]'
   // REPLACE ALL OCCURANCES OF '@x' AND '@y' BY '_X' AND '_Y'

   let replaceAtSigns = s => {
      let t = '';
      for (let n = 0 ; n < s.length ; n++)
         t += s[n  ] != '@' ? s[n] :
              s[n+1] == 'x' ? (++n, '_X') :
              s[n+1] == 'y' ? (++n, '_Y') : '_I[' + s[++n] + ']';
      return t;
   }

   // SAME AS ABOVE, BUT ALSO DEFAULT UNDEFINED VALUES TO ZERO

   let replaceAtSignsAndProvideDefaultOption = s => {
      let t = '';
      for (let n = 0 ; n < s.length ; n++)
         t += s[n  ] != '@' ? s[n] :
              s[n+1] == 'x' ? (++n, '_X') :
              s[n+1] == 'y' ? (++n, '_Y') : '(_I[' + s[++n] + '] ?? 0)';
      return t;
   }

   // CONVERT A CARD INTO AN ACTIVE CARD, GIVEN A card_type NAME

   let activateCardFromText = (n, text) => {
      let words = text.toLowerCase().split(' ');

      // FIRST SEE IF WORD IS IN THE DICTIONARY

      for (let word in dictionary)
         for (let i = 0 ; i < words.length ; i++)
            if (word == words[i]) {
               S[n].text = word;
               if (dictionary[S[n].text])
                  S[n].card_type = S[n].text;
               return true;
            }
   }

   // TRANSFORM THE CANVAS 2D DRAWING CONTEXT INTO A CARD'S COORDINATE SYSTEM.

   let intoCardCoords = (lo,hi) => {
      let s = (hi[0]-lo[0]) / 2;
      let x = screen.width /2 + screen.width/2 * lo[0];
      let y = screen.height/2 - screen.width/2 * (3 * lo[1] + 13 * hi[1]) / 16;
      octx.setTransform(s, 0, 0, s, x, y);
   }

   // TRANSFORM A POINT INTO A CARD'S COORDINATE SYSTEM.

   let transformToCardCoords = (n,p) => {
      let lo = S[n].lo, hi = S[n].hi;
      return [ 2 * (p[0] - lo[0]) / (hi[0] - lo[0]) - 1,
               2 * (p[1] - lo[1]) / (hi[1] - lo[1]) - 1 ];
   }

   // CREATE A NEW CARD.

   let createCard = (card_type, pos, size, custom) => {
      if (! dictionary[card_type])
         return -1;
      S.push({
         type: 'card',
         text: card_type,
         card_type: card_type,
         morphData: 1,
         strokes: [],
         id: ++id,
         lo: [ pos[0]-size/2, pos[1]-size/2 ],
         hi: [ pos[0]+size/2, pos[1]+size/2 ],
         state: { _I_prev: [], _I: [], _O: [] },
         custom: custom,
      });
      dirty = true;
      return id;
   }

   // DELETE A CARD, GIVEN ITS ID.

   let deleteCardWithId = id => {
      for (let n = 2 ; n < S.length ; n++)
         if (S[n].id == id) {
            S.splice(n, 1);
            delete S_value[id];
            dirty = true;
            return;
         }
   }

   let isCommandKey, isTextString, textString = '';

   this.keyDown = key => {

      if (pen.pos && key == 'Meta') {
         isPenDown = true;
         return true;
      }

      let n;
      for (n = S.length - 1 ; n >= 2 ; n--)
         if (contains(n, pos))
            break;

      if (n >= 2 && S[n].type == 'card' && S[n].state) {
         S[n].state.keyState = 'press';
         S[n].state.key = key;
         return true;
      }

      // RECOGNIZE COMMAND KEYS

      switch (key) {
      case 'Escape':
      case 'c':
      case 'i':
      case 'l':
      case 'p':
      case 's':
         isCommandKey = true;
         return true;
      case 'Alt':
         isSpeechKey = true;
         previousSpeech = '';
         thisSpeech = '';
         speech = '';
         textString = '';
         return true;
      }
   }

   this.keyUp = key => {

      if (key == 'Alt')
         isSpeechKey = false;

      // ADDING TO THE TEXT STRING

      if (isTextString && key != 'Escape') {
         switch (key) {
         case 'Command':
         case 'Meta':
            break;
         case 'Backspace':
            textString = textString.substring(0, textString.length-1);
            break;
         default:
            textString += key;
            break;
         }
         return true;
      }

      // ACT ON A COMMAND KEY

      if (isCommandKey) {
         switch (key) {
         case 'Escape':
            if (! isTextString) {
               previousSpeech = '';
               thisSpeech = '';
               speech = '';
               textString = '';
            }
            isTextString = false;
            break;
         case 'c':
            createCard(textString.trim(), this.input.mouse.pos, .4);
            textString = '';
            break;
         case 'i':
            isTextString = true;
            textString = '';
            break;
         case 'l':
            if (textString == '')
               this.init();
            else {
               load(textString);
               textString = '';
            }
            break;
         case 'p':
            usePen = ! usePen;
            break;
         case 's':
            save(textString);
            textString = '';
            break;
         }
         isCommandKey = false;
         return true;
      }

      if (pen.pos && key == 'Meta') {
         isPenDown = false;
         return true;
      }

      // FIND OUT WHAT CARD, IF ANY, IS AT THE CURSOR

      let n;
      for (n = S.length - 1 ; n >= 2 ; n--)
         if (contains(n, pos))
            break;

      // IGNORE ARROW KEYS THAT ARE NOT ON A CARD

      if (key.indexOf('Arrow') == 0 && (n < 2 || S[n].type != 'card'))
         return true;

      // SEND TEXT EVENTS TO THE CARD AT THE CURSOR

      if (n >= 2 && S[n].type == 'card' && S[n].state) {
         S[n].state.keyState = 'release';
         S[n].state.key = key;
         dirty = true;
         return true;
      }

      // DELETE KEY ON BACKGROUND REMOVES CARD AT THE CURSOR

      switch (key) {
      case 'Backspace':
         if (S.length == 3) {
            removeCard(2);
            dirty = true;
         }
         else if (n >= 2) {
            removeCard(n);
            dirty = true;
         }
         break;
      }

      return true;
   }

   let matchCurves = new MatchCurves();
   matchCurves.flipY(false);
   glyphs(matchCurves);

   let cursorIds = { mouse:0, left:1, right:2 };
   let dirty, bgClick, state = -1, stroke = [], p = [], n = -1, nAtCursor = -1;
   let isDragging = false, isResizing = false, sy, isDraggingCopy;
   let np = isFirstPlayer() ? 0 : 1;
   let nm = -1;
   let pen = {}, usePen = false;
   let pos = [0,0], pressPos, time, isPenDown, wasPenDown;
   let startTime = Date.now() / 1000;

   let S, id, S_value;

   this.init = () => {
      id = 0;
      S = [ { strokes:[[]], id: ++id }, { strokes:[[]], id: ++id } ];
      S_value = {};
      dirty = true;
   };

   this.init();

   let contains = (n, p) => S[n].lo[0] - .02 < p[0] && S[n].hi[0] + .02 > p[0] &&
                            S[n].lo[1] - .02 < p[1] && S[n].hi[1] + .02 > p[1] ;

   let clearBounds = n => {
      S[n].lo = [ 1000, 1000];
      S[n].hi = [-1000,-1000];
   }

   let extendBounds = (n, stroke) => {
      for (let j = 0 ; j < stroke.length ; j++) {
         S[n].lo[0] = Math.min(S[n].lo[0], stroke[j][0]);
         S[n].lo[1] = Math.min(S[n].lo[1], stroke[j][1]);
         S[n].hi[0] = Math.max(S[n].hi[0], stroke[j][0]);
         S[n].hi[1] = Math.max(S[n].hi[1], stroke[j][1]);
      }
   }

   // START THE PROCESS OF FADING A CARD AND THEN DELETING IT

   let removeCard = n => {
      if (S[n].remove === undefined)
         S[n].remove = 1;
   }

   // IMMEDIATELY DELETE A CARD

   let deleteCard = n => {
      let id = S[n].id;
      S.splice(n, 1);
      for (let n = 2 ; n < S.length ; n++)
         if (S[n].srcId)
            for (let i = 0 ; i < S[n].srcId.length ; i++)
               if (S[n].srcId[i] == id)
                  S[n].srcId.splice(i--, 1);
   }

   let copyCard = n => {

      // COPY A MORPHED CARD

      if (n >= 2 && S[n].morphData) {
         createCard(S[n].card_type, pos, S[n].hi[0]-S[n].lo[0], S[n].custom);
	 let nc = S.length-1;
         let src = S[n].state;
         let dst = S[nc].state;
         for (let item in src) {
            if (Array.isArray(src[item])) {
               dst[item] = [];
               for (let i = 0 ; i < src[item].length ; i++)
                  dst[item].push(Array.isArray(src[item][i]) ? src[item][i].slice() : src[item][i]);
            }
            else
               dst[item] = src[item];
         }
	 S[nc].lo = S[n].lo.slice();
	 S[nc].hi = S[n].hi.slice();
      }

      // COPY A SKETCH

      else if (n >= 2 && ! S[n].morphData) {
          let strokes = [];
          for (let i = 0 ; i < S[n].strokes.length ; i++)
             strokes.push(S[n].strokes[i].slice());
          let nc = S.length;
          S.push({ strokes: strokes, id: ++id });
	  S[nc].lo = S[n].lo.slice();
	  S[nc].hi = S[n].hi.slice();
      }
   }

   let isSpeechKey, previousSpeech = '', thisSpeech = '';

   let frame = 0;

   this.update = () => {
      frame++;

      if (isSpeechKey) {
         thisSpeech = speech;

         if (thisSpeech != previousSpeech) {
            textString = thisSpeech;
            dirty = true;
         }
         previousSpeech = thisSpeech;
      }

      pen.pos = window.penXYN ? [ (penXYN.x - 320) / 320, (220 - penXYN.y) / 350 ] : null;

      let penSize = 0;
      if (window.penXYN)
         penSize = Math.sqrt(penXYN.n);

      let dragCard = () => {
         if (n >= 2) {
            let strokes = S[n].strokes;
            let drag = pt => [ pt[0] + pos[0] - p[0] , pt[1] + pos[1] - p[1] ];
            for (let i = 0 ; i < strokes.length ; i++)
               for (let j = 0 ; j < strokes[i].length ; j++)
                  strokes[i][j] = drag(strokes[i][j]);
            S[n].lo = drag(S[n].lo);
            S[n].hi = drag(S[n].hi);
            p = pos;
            dirty = true;
         }
      }

      let resizeCard = () => {
         if (n >= 2) {
            let strokes = S[n].strokes;
            let s = 1 + 2 * (pos[1] - sy);
            let resize = pt => [ p[0] + s * (pt[0] - p[0]), p[1] + s * (pt[1] - p[1]) ];
            for (let i = 0 ; i < strokes.length ; i++)
               for (let j = 0 ; j < strokes[i].length ; j++)
                  strokes[i][j] = resize(strokes[i][j]);
            let loX = S[n].lo[0], hiY = S[n].hi[1];
            S[n].lo = resize(S[n].lo);
            S[n].hi = resize(S[n].hi);
            if (S[n].card_type == 'editor') {
               S[n].hi[0] += loX - S[n].lo[0];
               S[n].lo[1] += hiY - S[n].hi[1];
               S[n].lo[0] = loX;
               S[n].hi[1] = hiY;
            }
            sy = pos[1];
            dirty = true;
         }
      }

      // RESPOND TO USER INPUT

      let respondToInput = (cursor, cursorId) => {
         pos = cursor.pos;

         switch (cursor.state) {

         case 'up':

            nAtCursor = -1;
            for (let n = S.length - 1 ; n >= 2 ; n--)
               if (contains(n, pos)) {
                  nAtCursor = n;
                  break;
               }

            if (isDragging == cursorId)
               dragCard();

            else if (isResizing == cursorId)
               resizeCard();

            break;

         case 'press':
            pressPos = pos.slice();

            // A MOUSE PRESS RESETS STATE

            n = -1;
            nm = -1;
            state = -1;
	    isDraggingCopy = false;

            // IF MOUSE DOWN AFTER A PREVIOUS CLICK ON THE BACKGROUND

            if (bgClick) {

               // FIND OUT WHAT CARD, IF ANY, THE MOUSE DOWN IS IN

               for (n = S.length - 1 ; n >= 2 ; n--)
                  if (contains(n, pos)) {
                     p = pos;
                     break;
                  }

               // IF IN A CARD, COMPUTE STATE AS A 0...7 PIE CHART DIRECTION WRT THE PREVIOUS CLICK

               if (n >= 2)
                  state = (8.5 - 4 * Math.atan2(pos[1] - bgClick[1], bgClick[0] - pos[0]) / Math.PI) % 8 >> 0;
            }

            // IF THE MOUSE DOWN IS NOT AFTER A PREVIOUS CLICK ON THE BACKGROUND

            else {

               // IF NOT DRAGGING OR RESIZING OR LINKING, CHECK FOR MOUSE DOWN ON A MORPHED CARD

               if (! isDragging && ! isResizing)
                  for (nm = S.length - 1 ; nm >= 2 ; nm--)
                     if (S[nm].morphData && contains(nm, pos)) {
                        p = pos;
                        break;
                     }

               // OTHERWISE, START A NEW STROKE

               if (nm < 2)
                  S[np].strokes[0] = [ pos ];

               else if (S_value[S[nm].id] && typeof S_value[S[nm].id].mousePress == 'function')
                  S_value[S[nm].id].mousePress(transformToCardCoords(nm, pos));
            }

            dirty = true;
            break;

         case 'down':

            if (bgClick) {
               if (n >= 2 && state == 2 || state == 6) {
                  if (! isDraggingCopy && norm(subtract(pos, pressPos)) > .05) {
		     copyCard(n);
		     n = S.length - 1;
		     isDraggingCopy = cursorId;
                  }
		  else if (isDraggingCopy == cursorId)
		     dragCard(n);
               }
            }
            else {
               if (nm < 2)                       // CONTINUING TO DRAW
                  S[np].strokes[0].push(pos);    // A FREE-HAND STROKE

               else if (S_value[S[nm].id] && typeof S_value[S[nm].id].mouseDrag == 'function')
                  S_value[S[nm].id].mouseDrag(transformToCardCoords(nm, pos));
            }
            dirty = true;
            break;

         case 'release':

            // AFTER A PREVIOUS CLICK ON THE BACKGROUND

            if (bgClick) {
               bgClick = undefined;

               // IF THIS IS A CLICK

               if (cursor.isClick && ! isDragging) {

                  // FIND OUT WHAT CARD, IF ANY, THIS CLICK IS IN

                  for (n = S.length - 1 ; n >= 2 ; n--)
                     if (contains(n, pos))
                        break;

                  switch (state) {

                  // IF BACKGROUND CLICK WAS EAST OF THIS CLICK

                  case 0:

                     // AND THIS CLICK IS IN A CARD, DELETE THE CARD

                     if (n >= 2)
                        removeCard(n);

                     break;

                  // IF BACKGROUND WAS NORTH OR SOUTH OF THIS CLICK

                  case 2:
                  case 6:

                     // AND THIS CLICK IS IN A CARD, BEGIN DRAGGING THE CARD

                     if (n >= 2)
                        isDragging = cursorId;

                     break;

                  // IF BACKGROUND CLICK WAS WEST OF THIS CLICK

                  case 4:

                     // AND THIS CLICK IS IN A CARD, BEGIN RESIZING THE CARD

                     if (n >= 2) {
                        isResizing = cursorId;
                        sy = pos[1];
                     }

                     break;
                  }
               }

               // FINISHED DRAGGING AFTER A BACKROUND CLICK

               else {

                  switch (state) {

                  // IF BACKGROUND CLICK WAS NORTH OR SOUTH OF A CARD, COPY THE CARD

                  case 2:
                  case 6:
                     break;

                  // IF BACKGROUND CLICK WAS WEST OF THE CARD, CREATE A LINK

                  case 4:
                     for (let nn = S.length - 1 ; nn >= 2 ; nn--)
                        if (S[nn].morphData && contains(nn, pos)) {
                           if (! S[nn].srcId)
                              S[nn].srcId = [];
                           S[nn].srcId.push(S[n].id);

                           // IF LINKING TO A SHADER OR WEBGL CARD, UPDATE THE CARD TYPE

                           if (S[nn].srcId.length == 1) {
                              let src = S[n];
                              let dst = S[nn];
                              if (isCgCard(src) && dst.card_type == 'shader') {
                                 dst.card_type = 'webgl';
                                 S_value[dst.id] = new WebglCard(octx);
                              }
                              if (isFsCard(src) && dst.card_type == 'webgl') {
                                 dst.card_type = 'shader';
                                 S_value[dst.id] = new WebgpuCard(octx);
                              }
                           }

                           break;
                        }
                     break;
                  }
               }
            }

            // IF THIS IS A CLICK (NOT FOLLOWING A PREVIOUS CLICK ON THE BACKGROUND)

            else if (cursor.isClick) {

               // IF AFTER DRAGGING A CARD, JUST TURN OFF DRAGGING MODE

               if (isDragging == cursorId)
                  isDragging = false;

               // IF AFTER RESIZING A CARD, JUST TURN OFF RESIZING MODE

               else if (isResizing == cursorId)
                  isResizing = false;

               else if (nm < 2) {

                  // IF THE CLICK IS IN A CARD, CONVERT THE CARD

                  for (n = S.length - 1 ; n >= 2 ; n--)
                     if (S[n].morphData === undefined && contains(n, pos)) {
                        S[n].morphData = matchCurves.recognize(S[n].strokes);
                        S[n].morphData[5] = 0;
                        break;
                     }

                  // ELSE REMEMBER THIS AS A CLICK ON THE BACKGROUND

                  if (n < 2) {
                     bgClick = pos;
                     n = -1;
                  }
               }

               else if (S_value[S[nm].id] && typeof S_value[S[nm].id].mouseClick == 'function') {
                  if (typeof S_value[S[nm].id].mouseRelease == 'function')
                     S_value[S[nm].id].mouseRelease(transformToCardCoords(nm, pos));
                  S_value[S[nm].id].mouseClick(transformToCardCoords(nm, pos));
               }
            }

            // IF THIS IS A STROKE, NOT A CLICK

            else if (nm < 2) {

               let stroke = S[np].strokes[0];

               // IF THE STROKE INTERSECTS WITH AN EXISTING CARD
               // ADD THE STROKE TO THE CARD

               loop:
               for (n = S.length - 1 ; n >= 2 ; n--)
                  for (let j = 0 ; j < stroke.length ; j++)
                     if (contains(n, stroke[j])) {
                        S[n].strokes.push(stroke);
                        break loop;
                     }

               // IF THE STROKE DOESN'T INTERSECT WITH ANY EXISTING CARD
               // THEN CREATE A NEW CARD WITH JUST THIS STROKE

               if (n < 2) {
                  n = S.length;
                  S[n] = { strokes: [ stroke ], id: ++id };
                  clearBounds(n);
               }

               // IN EITHER CASE, UPDATE THE CARD'S BOUNDING BOX

               extendBounds(n, stroke);
            }

            else if (S_value[S[nm].id] && typeof S_value[S[nm].id].mouseRelease == 'function')
               S_value[S[nm].id].mouseRelease(transformToCardCoords(nm, pos));

            // AFTER MOUSE RELEASE, REMOVE THE TEMPORARY STROKE

            S[np].strokes[0] = [];
            nm = -1;
            dirty = true;
            break;
         }
      }

      // COMPUTE THE CURRENT TIME AND THE TIME ELAPSED SINCE THE PREVIOUS FRAME

      let elapsed = .03, newTime = Date.now() / 1000;
      if (time !== undefined)
         elapsed = newTime - time;
      time = newTime;

      // RESPOND TO INPUT FROM MOUSE AND HANDS

      for (let cursorId in cursorIds) {
         let cursor = this.input[cursorId];
         if (cursor)
            respondToInput(cursor, cursorId);
      }

      // RESPOND TO INPUT FROM PEN, IF PEN IS VISIBLE

      if (pen.pos && usePen) {
         if (isPenDown && ! wasPenDown) {
            pen.state = 'press';
            pen.pressTime = time;
            pen.travel = 0;
            pen.previousPos = pen.pos;
            respondToInput(pen, 'pen');
         }
         else if (isPenDown && wasPenDown) {
            pen.state = 'down';
            pen.travel += norm(subtract(pen.pos, pen.previousPos));
            pen.previousPos = pen.pos;
            respondToInput(pen, 'pen');
         }
         else if (! isPenDown && wasPenDown) {
            pen.state = 'release';
            pen.isClick = time - pen.pressTime < .5 && pen.travel < .05;
            respondToInput(pen, 'pen');
         }
         else {
            pen.state = 'up';
            respondToInput(pen, 'pen');
         }
         wasPenDown = isPenDown;
      }

      // SYNCHRONIZE WITH OTHER THE PLAYER

      window.SS_hold = [ np ];
      if (! dirty)
         S = this.getState();
      else
         this.setState(S);
      dirty = false;

      // DRAW EVERY LINK AS A CONNECTING ARROW

      this.lineWidth(.008).drawColor(penColor).fillColor(penColor);
      for (let n = 0 ; n < S.length ; n++) {
         let srcCards = getSrcCards(S[n]);
         for (let i = 0 ; i < srcCards.length ; i++) {
            let src = srcCards[i];
            let findEdge = (lo,hi,p) => {
               let [cx,cy] = mix(lo, hi, .5),
                   [dx,dy] = subtract(p, [cx,cy]);
               if (dx > 0 && dx*dx > dy*dy) return [hi[0]+.004, cy + dy/dx * (hi[1]-cy)];
               if (dx < 0 && dx*dx > dy*dy) return [lo[0]-.004, cy - dy/dx * (hi[1]-cy)];
               if (dy > 0 && dy*dy > dx*dx) return [cx + dx/dy * (hi[0]-cx), hi[1]+.004];
                                            return [cx - dx/dy * (hi[0]-cx), lo[1]-.004];
            }
            let L0 = src.lo , H0 = src.hi,
                L1 = S[n].lo, H1 = S[n].hi,
                A = findEdge( L0, H0, mix(L1, H1, .5) ),
                B = findEdge( L1, H1, mix(L0, H0, .5) ),
                D = resize(normalize(subtract(B,A)),.02),
                E = resize(D,1/3);

            if (src.remove || S[n].remove) {
               octx.save();
               octx.globalAlpha = ease(src.remove ?? S[n].remove);
            }

            this.line(A,subtract(B,E));
            this.fillPolygon([ add(B,E), add(B, [-2*D[0] - D[1], -2*D[1] + D[0]]),
                                         add(B, [-2*D[0] + D[1], -2*D[1] - D[0]]) ]);

            // IF THE USER HAS CLICKED ON A LINK, REMOVE THE LINK

            let pointToLineDistanceSquared = (p, a, b) => {
               let ax = a[0] - p[0], ay = a[1] - p[1];
               let bx = b[0] - p[0], by = b[1] - p[1];
               let dx = bx - ax, dy = by - ay;
               if (ax * dx + ay * dy > 0 || bx * dx + by * dy < 0)
                  return Math.min(ax * ax + ay * ay, bx * bx + by * by);
               let aa = ax * ax + ay * ay;
               let ad = ax * dx + ay * dy;
               let dd = dx * dx + dy * dy;
               return aa - ad * ad / dd;
            }

            if (bgClick && pointToLineDistanceSquared(bgClick,A,B) < .0001)
               for (let j = 0 ; j < S[n].srcId.length ; j++)
                  if (S[n].srcId[j] == src.id) {
                     S[n].srcId.splice(j,1);
                     bgClick = undefined;
                     break;
                  }

            if (src.remove || S[n].remove)
               octx.restore();
         }
      }

      // DRAW ALL THE CARDS

      for (let n = 0 ; n < S.length ; n++) {
         let card = S[n];

         // IF MARKED FOR REMOVAL, FADE OUT THE CARD BEFORE DELETING IT

         if (card.remove) {
            card.remove -= 2 * elapsed;
            if (card.remove <= 0) {
               deleteCard(n--);
               continue;
            }
            octx.save();
            octx.globalAlpha = ease(card.remove);
         }

         let strokes = card.strokes,
             lo = card.lo,
             hi = card.hi;

         // REMOVE ANY CARD THAT HAS WANDERED OFF THE SCREEN

         if (hi && (hi[0] < -1 || hi[1] < -screen.height/screen.width) ||
             lo && (lo[0] >  1 || lo[1] >  screen.height/screen.width))
            removeCard(n);

         // HANDLE MORPHING A DRAWING TO A KNOWN DRAWING OR TO A CARD

         if (card.morphData && card.morphData[5] < 1) {
            card.morphData[5] += 2 * elapsed;
            strokes = matchCurves.update(card.morphData, card.morphData[5]);
            if (card.morphData[5] >= 1) {
               card.strokes = strokes;
               clearBounds(n);
               for (let i = 0 ; i < strokes.length ; i++)
                  extendBounds(n, strokes[i]);
               card.type = matchCurves.glyph(card.morphData[2]).name;

               // ACTIVATE A CARD FROM ITS TEXT OR FROM SPEECH

               if (card.type == 'card')
                  if (activateCardFromText(n, textString))
                     textString = '';
                  else
                     activateCardFromText(n, 'editor');

               // CONVERT DRAWING TO A SHADER CARD

               else if (card.type == 'shader') {
                  card.type = 'card';
                  card.card_type = 'shader';
               }

               else if (card.type == 'webgl') {
                  card.type = 'card';
                  card.card_type = 'webgl';
               }

               // CONVERT DRAWING TO A CARD IF THERE IS A MATCHING CARD TYPE

               else
                  for (let word in dictionary)
                     if (card.type == word) {
                        card.type = 'card';
                        card.card_type = word;
                        break;
                     }
            }
         }

         // DRAW A CARD THAT CONSISTS OF A SEQUENCE OF STROKES

         if (card.type != 'card') {
            this.lineWidth(.008);
            for (let i = 0 ; i < strokes.length ; i++)
               this.path(strokes[i]);
         }

         // HANDLE INTERPRETATION AND RENDERING OF A CARD

         else {

            if (S_value[card.id] && card.card_type == 'editor' && card.state && card.state.lines)
               lo[1] = hi[1] - card.state.textSize * Math.max(1, card.state.nLines);

            let isShader = card.card_type == 'shader';
            let isWebgl  = card.card_type == 'webgl';

            this.lineWidth(.004);

            let showFrame = ! isShader && ! isWebgl && card.state;

            if (card.state && card.state.hideFrame)
               showFrame = false;

            if (showFrame)
               this.drawRect([lo[0]-.002,lo[1]-.002], [hi[0]+.002,hi[1]+.002]);

            // TURN ON CLIPPING, SO THAT RENDERING IS CONFINED TO THE CARD

            let isClipping = ! isShader && ! isWebgl && ! (card.state && card.state.noClipping);

            if (isClipping) {
               octx.save();
               this.clipToRect([lo[0]-.002,lo[1]-.002], [hi[0]+.002,hi[1]+.002]);
            }

            if (showFrame)
               this.fillColor(card.state.bgColor ?? '#ffffff').fillRect(lo, hi);

            // TEXT HEIGHT AND LINE THICKNESS WILL SCALE WITH CARD SIZE

            let s = .1 * (hi[0] - lo[0]);

            // IF EVALUATION WAS TRIGGERED, SEE IF TEXT IS A VALID CARD TYPE NAME

            if (card.card_type && ! S_value[card.id]) {
               switch (card.card_type) {
               case 'shader':
                  S_value[card.id] = new WebgpuCard(octx);
                  break;
               case 'webgl':
                  S_value[card.id] = new WebglCard(octx);
                  break;
               default:
                  S_value[card.id] = dictionary[card.card_type];
                  break;
               }
            }

            if (! S_value[card.id]) {
               this.setFont(.95 * s).text(card.text, [lo[0] + s/3, hi[1] - s], 0, 1);
               if (isClipping)
                  octx.restore();
            }

            // DRAW A SHADER CARD

            else if (isShader) {
               let shaderCard = S_value[card.id];

               // LINK ANY .fs SHADER CODE FROM SOURCE CARD

               if (card.srcId) {
                  let srcCards = getSrcCards(card);
                  for (let i = 0 ; i < srcCards.length ; i++)
                     if (isFsCard(srcCards[i]))
                        shaderCard.setShader(replaceAtSigns(srcCards[i].state.text));
               }

               lo[1] = hi[1] + lo[0] - hi[0];
               let L = this.mxp(lo);
               let H = this.mxp(hi);
               shaderCard.draw((L[0]+H[0])/2, (L[1]+H[1])/2, H[0]-L[0]);
            }

            else if (isWebgl) {
               let webglCard = S_value[card.id];

               // LINK ANY .cg SHADER CODE FROM SOURCE CARD

               if (card.srcId) {
                  let srcCards = getSrcCards(card);
                  for (let i = 0 ; i < srcCards.length ; i++)
                     if (isCgCard(srcCards[i]))
                        webglCard.setScene(replaceAtSigns(srcCards[i].state.text));
               }  

               lo[1] = hi[1] + lo[0] - hi[0];
               let L = this.mxp(lo);
               let H = this.mxp(hi);
               webglCard.draw((L[0]+H[0])/2, (L[1]+H[1])/2, H[0]-L[0]);
            }

            // IF THIS IS A VALID CARD TYPE, DO PROCEDURAL RENDERING

            else {

               if (card.state && card.state.aspectRatio)
                  lo[1] = hi[1] - (hi[0] - lo[0]) / card.state.aspectRatio;
               else if (card.card_type != 'editor')
                  lo[1] = hi[1] - (hi[0] - lo[0]);

               // COORDINATE CONVERSIONS BETWEEN SCREEN AND INTERNAL CARD COORDS

               let p0 = [ (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2 ];
               let dp = [ (hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2 ];
               let mf = p => [  p0[0] + p[0]  * dp[0],  p0[1] + p[1]  * dp[1] ];
               let mi = p => [ (p[0] - p0[0]) / dp[0], (p[1] - p0[1]) / dp[1] ];

               // IF A PROCEDURE, GIVE CARD A PLACE TO MAINTAIN THE CURRENT STATE

               let activationText = null;

               let value = S_value[card.id];
               if (typeof value == 'function') {

                  if (card.state === undefined)
                     card.state = { _I_prev: [], _I: [], _O: [] };
                  let state = card.state;

                  if (card.text == 'editor' && state.key == 'Control' && state.keyState == 'release') {

                     if (state.isShiftDown) {
                        if (card.state.srcFile)
                           saveSrcFile(card.state.srcFile, card.state.text);
                     }
                     else {

                        // ON CONTROL KEY RELEASE, EITHER CONVERT CARD TO THE CARD TYPE PRINTED ON THE CARD,
                        // OR LOAD A FILE IF TEXT CONTAINS '.'. IF FILE HAS ALREADY BEEN LOADED, RELOAD IT.

                        if (card.state.text.indexOf('.') > 0 || card.state.srcFile)
                           loadSrcFile(card, card.state.srcFile ?? card.state.text);
                        else
                           activationText = card.state.text;
                     }

                     state.key = ''; // SO WE DO NOT KEEP LOADING OR SAVING THE FILE!
                  }

                  // IF CARD HAS IN-LINKS, SET ITS PARAMETERS TO THEIR PARAMETER VALUES

                  if (card.srcId) {
                     state._I_prev = state._I.slice();
                     let T = [];
                     let srcCards = getSrcCards(card);
                     for (let i = 0 ; i < srcCards.length ; i++)
                        if (srcCards[i].state)
                           T.push(srcCards[i].state._O);
                     state._I = T.flat();
                  }

                  // AN fs CARD JUST SENDS ITS INPUT PARAMETERS ON TO A shader CARD

                  if (isFsCard(card)) {
                     let dstCards = getDstCards(card);
                     if (dstCards.length > 0 && dstCards[0].card_type == 'shader' && S_value[dstCards[0].id]) {
                        let I = [];
                        for (let i = 0 ; i < 10 ; i++)
                           I.push(state._I[i] ?? 0);
                        S_value[dstCards[0].id].set_I(I);
                     }
                  }

                  // A cg CARD JUST SENDS ITS INPUT PARAMETERS ON TO A webgl CARD

                  if (isCgCard(card)) {
                     let dstCards = getDstCards(card);
                     if (dstCards.length > 0 && dstCards[0].card_type == 'webgl' && S_value[dstCards[0].id]) {
                        let I = [];
                        for (let i = 0 ; i < 10 ; i++)
                           I.push(state._I[i] ?? 0);
                        S_value[dstCards[0].id].set_I(I);
                     }

		     // SEND PARAMETER VALUES TO VR VIA WEBRTC

		     if (isFirstPlayer() && state._I.length > 0 && state.srcFile && frame % 3 == 0) {
			let dataStr = '';
			for (let i = 0 ; i < 3 ; i++)
			   dataStr += (100*(.5+.5*state._I[i])>>0) + ',';
			if (dataStr != state.sentDataStr || frame % 90 == 0) {
		           channel.send({ type: 'I', data: dataStr });
			   state.sentDataStr = dataStr;
			}
		     }
                  }

                  // PROCEDURALLY EVALUATE THE CARD CONTENTS

                  let hasFocus = n == nm;
                  state.mouseState = ! state.hadFocus &&   hasFocus ? 'press'   :
                                       state.hadFocus &&   hasFocus ? 'drag'    :
                                       state.hadFocus && ! hasFocus ? 'release' :
                                                                      'move'    ;
                  state.hadFocus = hasFocus;
                  if (state.mouseState == 'press')
                     state.mousePressTime = time;
                  if (state.mouseState == 'release')
                     state.mouseClick = time - state.mousePressTime < .25;

                  state.dirty = false;
                  state.draw = this;
                  state.custom = card.custom;
                  state.hasFocus = n == nAtCursor;

                  octx.save();
                  intoCardCoords(lo,hi);
                  value = value(state, time, mi(pos), hasFocus);
                  octx.restore();

                  // ADJUST COORDINATE TRANSFORM MATH FOR NON-SQUARE CARDS

                  if (state.aspectRatio && ! card.hasBeenAdjusted) {
                     let y = (lo[1] + hi[1]) / 2;
                     let h = (hi[0] - lo[0]) / card.state.aspectRatio;
                     lo[1] = y - h/2;
                     hi[1] = y + h/2;
                     dp[1] = (hi[1] - lo[1]) / 2;
                     value = S_value[card.id](state, time, mi(pos), hasFocus);
                     card.hasBeenAdjusted = true;
                  }

                  // AFTER THE FIRST TIME EVALUATING A NON-SQUARE CARD FROM A TEXTSTRING,
                  // ADJUST ITS SIZE AND POSITION

                  if (card.morphData == 1 && state.aspectRatio < 1) {
                     let x = (lo[0] + hi[0]) / 2, w = hi[0] - lo[0];
                     lo[0] = x - w / 2 * state.aspectRatio;
                     hi[0] = x + w / 2 * state.aspectRatio;
                     lo[1] = hi[1] - (hi[1] - lo[1]) * state.aspectRatio;
                     value = S_value[card.id](state, time, mi(pos), hasFocus);
                     card.morphData = 2;
                  }
                  if (card.morphData == 1 && state.aspectRatio > 1) {
                     let h = (hi[0] - lo[0]) / state.aspectRatio;
                     hi[1] = this.input.mouse.pos[1] + h/2;
                     lo[1] = hi[1] - h;
                     value = S_value[card.id](state, time, mi(pos), hasFocus);
                     card.morphData = 2;
                  }

                  // GIVE THE CARD THE OPTION TO MOVE ITS OWN POSITION

                  if (state.move) {
                     lo[0] += state.move[0];
                     hi[0] += state.move[0];
                     lo[1] += state.move[1];
                     hi[1] += state.move[1];
                  }
                  dirty = state.dirty;

                  if (state.keyState == 'press'  ) state.keyState = 'down';
                  if (state.keyState == 'release') state.keyState = 'up';
               }

               // DRAW ALL THE LINES AND TEXT IN THE CARD

               let lineWidth = .1 * s;
               if (card.state && card.state.lineWidth)
                  lineWidth = card.state.lineWidth;

               let color = penColor;
               if (card.state)
                  card.state.cardSize = hi[0] - lo[0];
               for (let i = 0 ; i < value.length ; i++) {
                  this.lineWidth(lineWidth);
                  let item = value[i];
                  if (item.draw) {
                     let path = [];
                     for (let j = 0 ; j < item.draw.length ; j++)
                        path.push(mf(item.draw[j]));
                     this.drawColor(item.color ?? color);
                     this.lineWidth(item.lineWidth ?? lineWidth);
                     this.path(path);
                  }
                  else if (item.fill) {
                     let path = [];
                     for (let j = 0 ; j < item.fill.length ; j++)
                        path.push(mf(item.fill[j]));
                     this.fillColor(item.color ?? color);
                     this.fillPolygon(path);
                  }
                  else if (item.text) {
                     this.drawColor(item.color ?? color);
                     let j = item.justify ?? [.5,.5];
                     this.setFont(item.size ?? (item.scale ?? 1)*s, 'Courier').text(item.text, mf(item.pos), j[0],j[1]);
                  }
                  else if (item.color)
                     color = item.color;
               }

               if (activationText) {
                  if (activationText == 'shader') {
                     let shaderCard = new WebgpuCard(octx);
                     shaderCard.setShader('rgb = vec3(0.,0.,1.);');
                     S_value[card.id] = shaderCard;
                  }
                  else {
                     delete S_value[card.id];
                     activateCardFromText(n, activationText);
                  }
                  dirty = true;
               }

               if (isClipping)
                  octx.restore();

               if (card.card_type == 'editor' && ! isCgCard(card) && ! isFsCard(card) && card.state) {

                  // IF THERE IS AN OUT-LINK, DISPLAY ANY GRAPHICAL RESULT OF EVAL IN DESTINATION CARD

                  let dstCards = getDstCards(card);
                  let hasOutLink = dstCards.length > 0;

                  octx.save();
                  if (hasOutLink) {
                     let dst = dstCards[0];
                     let lo = dst.lo, hi = dst.hi;

                     let p0 = [ (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2 ];
                     let dp = [ (hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2 ];
                     this.clipToRect([lo[0]-.002,lo[1]-.002], [hi[0]+.002,hi[1]+.002]);
                     intoCardCoords(lo, hi);
                  }

                  // OTHERWISE, DO NOT DISPLAY ANYTHING

                  else
                     this.clipToRect(lo, lo);

                  // TEMPORARILY ADD SOME USEFUL THINGS TO THE GLOBAL SCOPE

                  let b = ( 'add,cross,dot,ease,evalBezier,hex,'
                          + 'ik,mix,norm,normalize,resize,round,'
                          + 'round2,subtract,transform'
                          ).split(',');
                  let m = ( 'PI,abs,acos,asin,atan,atan2,ceil,cos,'
                          + 'exp,floor,log,max,min,mod,pow,random,'
                          + 'round,sign,sin,sqrt,trunc'
			  ).split(',');
                  let v = [
                     '_I'        , card.state._I,    // CARD'S INPUT PARAMETERS
                     'hasOutLink', hasOutLink,         // IS THERE A DESTINATION CARD?
                     'M'         , M,                  // 4x4 MATRIX OBJECT
                     'draw'      , this,               // THIS DRAWING CARD
                     'time'      , time - startTime,   // TOTAL ELAPSED TIME
                  ];
                  for (let i = 0 ; i < b.length ; i++ ) window[b[i]] = b[i];
                  for (let i = 0 ; i < m.length ; i++ ) window[m[i]] = Math[m[i]];
                  for (let i = 0 ; i < v.length ; i+=2) window[v[i]] = v[i+1];

                  // TRY TO EVALUATE THE CARD'S TEXT AS JAVASCRIPT

                  let code = replaceAtSignsAndProvideDefaultOption(card.state.text);
                  let value;
                  try {
                     value = (new Function(code))();
                  } catch {
                     error => console.log(error);
                  }

                  // IF SUCCESSFUL, value BECOMES THE CARD'S OUTPUT PARAMETERS

                  if (value)
                     card.state._O = Array.isArray(value) ? value : [ value ];

                  // REMOVE THINGS FROM THE GLOBAL SCOPE

                  for (let i = 0 ; i < b.length ; i++ ) delete window[b[i]];
                  for (let i = 0 ; i < m.length ; i++ ) delete window[m[i]];
                  for (let i = 0 ; i < v.length ; i+=2) delete window[v[i]];

                  // RESTORE DISPLAY CONTEXT

                  octx.restore();
               }
            }
         }

         if (card.remove)
            octx.restore();
      }

      // IF USING A PEN, DISPLAY THE PEN TIP IN FRONT OF EVERYTHING ELSE

      if (penSize > 0)
         this.drawColor(penColor + '40').dot(pen.pos, .002 * penSize);

      // SHOW THE TEXT STRING OR USER'S LATEST SPOKEN WORDS AT THE BOTTOM LEFT OF THE SCREEN

      this.setFont(.02).drawColor(penColor + '60').text(textString, [-.9807,-.63], 0);

      // INDICATE WHETHER THE PEN IS BEING TRACKED

      if (usePen)
         this.lineWidth(.0015).drawColor(penColor + '80').drawRect([-.995,-.62],[-.985,-.61]);

      // INDICATE WHETHER CURSOR INPUT IS CURRENTLY IN "CLICKED ON BACKGROUND" MODE

      if (bgClick)
         this.fillColor(penColor + '80').fillRect([.985,-.66],[1,-.61]);

      this.drawColor(penColor);
   }
}
