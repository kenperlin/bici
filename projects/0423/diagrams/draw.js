function Diagram() {
   this.isFullScreen = true;
   tracking_isDrawingShadowAvatar = false;

   let penColor = '#000000';

   let save = name => {
      localStorage.setItem('saved_' + name, JSON.stringify(S));
      fetch('/api/save/' + name, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(S)
      }).catch(err => console.error('server save failed:', err));
   }

   let load = name => {
      fetch('/api/load/' + name)
         .then(r => r.ok ? r.json() : Promise.reject(r.status))
         .then(data => { S = data; dirty = true; })
         .catch(() => {
            const local = localStorage.getItem('saved_' + name);
            if (local) { S = JSON.parse(local); dirty = true; }
         });
   }

   let replaceNumberSigns = s => {
      let t = '';
      for (let n = 0 ; n < s.length ; n++)
         t += s.charAt(n) == '#' ? 'T[' + s.charAt(++n) + ']' : s.charAt(n);
      return t;
   }

   let activateCardFromText = (n, text) => {
      let words = text.toLowerCase().split(' ');
      for (let word in dictionary)
         for (let i = 0 ; i < words.length ; i++)
            if (word == words[i]) {
               S[n].text = word;
               if (dictionary[S[n].text])
                  S[n].card_type = S[n].text;
               return true;
            }
   }

   let isCommandKey, isTextString, textString = '', isSpeechKey;

   this.keyDown = key => {

      if (pen.pos && key == 'Meta') {
         isPenDown = true;
         return true;
      }

      let n;
      for (n = S.length - 1 ; n >= 2 ; n--)
         if (contains(n, pos))
            break;

      if (n >= 2 && S[n].type == 'card') {
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
      case 's':
         isCommandKey = true;
         return true;
      case 'Alt':
         console.log('SPEECH KEY ENABLED');
         isSpeechKey = true;
         return true;
      }
   }

   this.keyUp = key => {

      if (key == 'Alt') {
         console.log('SPEECH KEY DISABLED');
         isSpeechKey = false;
      }

      // ADDING TO THE TEXT STRING

      if (isTextString && key != 'Escape') {
         switch (key) {
	 case 'Command':
	 case 'Meta':
	 case 'Shift':
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
	    if (! isTextString)
	       textString = '';
            isTextString = false;
            break;
         case 'c':
	    textString = textString.trim();
            if (dictionary[textString]) {
               let n = S.length;
	       let p = this.input.mouse.pos;
               S[n] = { type: 'card',
	                text: textString,
			card_type: textString,
			morphData: 1,
			strokes: [],
			id: id++,
			lo: [p[0]-.2,p[1]-.2],
			hi: [p[0]+.2,p[1]+.2],
		      };
            }
            textString = '';
	    break;
         case 'i':
            isTextString = true;
            textString = '';
            break;
         case 'l':
	    load(textString);
            textString = '';
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

      // FIND OUT WHAT OBJECT, IF ANY, IS AT THE CURSOR.

      let n;
      for (n = S.length - 1 ; n >= 2 ; n--)
         if (contains(n, pos))
            break;

      // IGNORE ARROW KEYS THAT ARE NOT ON A CARD.

      if (key.indexOf('Arrow') == 0 && (n < 2 || S[n].type != 'card'))
         return false;

      // SEND TEXT EVENTS TO THE CARD AT THE CURSOR.

      if (n >= 2 && S[n].type == 'card') {
         S[n].state.keyState = 'release';
         S[n].state.key = key;
         dirty = true;
         return true;
      }

      // DELETE KEY ON BACKGROUND REMOVES OBJECT AT THE CURSOR.

      switch (key) {
      case 'Backspace':
         if (S.length == 3) {
            S.splice(2, 1);
            dirty = true;
         }
         else if (n >= 2) {
            removeObject(n);
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
   let dirty, bgClick, state = -1, stroke = [], p = [], n = -1;
   let isDragging = false, isResizing = false, sy, isLinking, srcId;
   let np = isFirstPlayer() ? 0 : 1;
   let nm = -1;
   let pen = {};
   let pos = [0,0], time, isPenDown, wasPenDown;

   let S;
   this.init = () => {
      S = [ { strokes:[[]], id: id++ }, { strokes:[[]], id: id++ } ];
      dirty = true;
   };

   let id = 0, S_value = {};

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

   let removeObject = n => {
      if (S[n].remove === undefined)
         S[n].remove = 1;
   }

   let deleteObject = n => {
      let id = S[n].id;
      S.splice(n, 1);
      for (let n = 2 ; n < S.length ; n++)
         if (S[n].srcId == id)
            delete S[n].srcId;
   }

   let previousSpeech = '';

   this.update = () => {

      if (speech != previousSpeech && isSpeechKey) {
         textString = speech;
         dirty = true;
      }
      previousSpeech = speech;

      pen.pos = window.penXYN ? [ (penXYN.x - 320) / 320, (220 - penXYN.y) / 350 ] : null;

      let penSize = 0;
      if (window.penXYN)
         penSize = Math.sqrt(penXYN.n);

      let dragItem = () => {
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

      let resizeItem = () => {
         if (n >= 2) {
            let strokes = S[n].strokes;
            let s = 1 + 2 * (pos[1] - sy);
            let resize = pt => [ p[0] + s * (pt[0] - p[0]), p[1] + s * (pt[1] - p[1]) ];
            for (let i = 0 ; i < strokes.length ; i++)
               for (let j = 0 ; j < strokes[i].length ; j++)
                  strokes[i][j] = resize(strokes[i][j]);
            S[n].lo = resize(S[n].lo);
            S[n].hi = resize(S[n].hi);
            sy = pos[1];
            dirty = true;
         }
      }

      // RESPOND TO USER INPUT

      let respondToInput = (cursor, cursorId) => {
         pos = cursor.pos;

         switch (cursor.state) {

         case 'up':

            if (isDragging == cursorId)
               dragItem();

            else if (isResizing == cursorId)
               resizeItem();

            break;

         case 'press':

            // A MOUSE PRESS RESETS STATE

            n = -1;
            nm = -1;
            state = -1;

            // IF MOUSE DOWN AFTER A PREVIOUS CLICK ON THE BACKGROUND

            if (bgClick) {

               // FIND OUT WHAT OBJECT, IF ANY, THE MOUSE DOWN IS IN

               for (n = S.length - 1 ; n >= 2 ; n--)
                  if (contains(n, pos)) {
                     p = pos;
                     break;
                  }

               // IF IN AN OBJECT, COMPUTE STATE AS A 0...7 PIE CHART DIRECTION WRT THE PREVIOUS CLICK

               if (n >= 2)
                  state = (8.5 - 4 * Math.atan2(pos[1] - bgClick[1], bgClick[0] - pos[0]) / Math.PI) % 8 >> 0;
            }

            // IF THE MOUSE DOWN IS NOT AFTER A PREVIOUS CLICK ON THE BACKGROUND

            else {

               // IF NOT DRAGGING OR RESIZING OR LINKING, CHECK FOR MOUSE DOWN ON A MORPHED OBJECT

               if (! isDragging && ! isResizing && ! isLinking)
                  for (nm = S.length - 1 ; nm >= 2 ; nm--)
                     if (S[nm].morphData && contains(nm, pos)) {
                        p = pos;
                        break;
                     }

               // OTHERWISE, START A NEW STROKE

               if (nm < 2)
                  S[np].strokes[0] = [ pos ];
            }

            dirty = true;
            break;

         case 'down':

            if (bgClick) {
               ; // DRAGGING AFTER A CLICK ON THE BACKGROUND
            }
            else {
               if (nm < 2)
                  S[np].strokes[0].push(pos);
            }
            dirty = true;
            break;

         case 'release':

            // AFTER A PREVIOUS CLICK ON THE BACKGROUND

            if (bgClick) {
               bgClick = undefined;

               // IF THIS IS A CLICK

               if (cursor.isClick) {

                  // FIND OUT WHAT OBJECT, IF ANY, THIS CLICK IS IN

                  for (n = S.length - 1 ; n >= 2 ; n--)
                     if (contains(n, pos))
                        break;

                  switch (state) {

                  // IF THE PREVIOUS CLICK WAS EAST OF THIS CLICK

                  case 0:

                     // AND THIS CLICK IS IN AN OBJECT, DELETE THE OBJECT

                     if (n >= 2)
                        removeObject(n);

                     break;

                  // IF THE PREVIOUS CLICK WAS NORTH OR SOUTH OF THIS CLICK

                  case 2:
                  case 6:

                     // AND THIS CLICK IS IN AN OBJECT, BEGIN DRAGGING THE OBJECT

                     if (n >= 2)
                        isDragging = cursorId;

                     break;

                  // IF THE PREVIOUS CLICK WAS WEST OF THIS CLICK

                  case 4:

                     // AND THIS CLICK IS IN AN OBJECT, BEGIN RESIZING THE OBJECT

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

                  // IF DRAG STARTED EAST OF THE BACKGROUND CLICK, CREATE A LINK

                  case 4:
                     for (let nn = S.length - 1 ; nn >= 2 ; nn--)
                        if (S[nn].morphData && contains(nn, pos)) {
                           S[nn].srcId = S[n].id;
                           break;
                        }
                     break;
                  }
               }
            }

            // IF THIS IS A CLICK (NOT FOLLOWING A PREVIOUS CLICK ON THE BACKGROUND)

            else if (cursor.isClick) {

               // IF AFTER DRAGGING AN OBJECT, JUST TURN OFF DRAGGING MODE

               if (isDragging == cursorId)
                  isDragging = false;

               // IF AFTER RESIZING AN OBJECT, JUST TURN OFF RESIZING MODE

               else if (isResizing == cursorId)
                  isResizing = false;

               else if (isLinking == cursorId) {
                  isLinking = false;
                  for (let n = S.length - 1 ; n >= 2 ; n--)
                     if (S[n].morphData && contains(n, pos)) {
                        S[n].srcId = srcId;
                        break;
                     }
               }

               else if (nm < 2) {

                  // IF THE CLICK IS IN AN OBJECT, CONVERT THE OBJECT

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
            }

            // IF THIS IS A STROKE, NOT A CLICK

            else if (nm < 2) {

               let stroke = S[np].strokes[0];

               // IF THE STROKE INTERSECTS WITH AN EXISTING OBJECT
               // ADD THE STROKE TO THE OBJECT

               loop:
               for (n = S.length - 1 ; n >= 2 ; n--)
                  for (let j = 0 ; j < stroke.length ; j++)
                     if (contains(n, stroke[j])) {
                        S[n].strokes.push(stroke);
                        break loop;
                     }

               // IF THE STROKE DOESN'T INTERSECT WITH ANY EXISTING OBJECT
               // THEN CREATE A NEW OBJECT WITH JUST THIS STROKE

               if (n < 2) {
                  n = S.length;
                  S[n] = { strokes: [ stroke ], id: id++ };
                  clearBounds(n);
               }

               // IN EITHER CASE, UPDATE THE OBJECT'S BOUNDING BOX

               extendBounds(n, stroke);
            }

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

      if (pen.pos) {
         if (isPenDown && ! wasPenDown) {
            pen.state = 'press';
            pen.pressTime = time;
            respondToInput(pen, 'pen');
         }
         else if (isPenDown && wasPenDown) {
            pen.state = 'down';
            respondToInput(pen, 'pen');
         }
         else if (! isPenDown && wasPenDown) {
            pen.state = 'release';
            pen.isClick = time - pen.pressTime < .5;
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

      this.lineWidth(.008);
      for (let n = 0 ; n < S.length ; n++)
         if (S[n].srcId)
            for (let ns = 2 ; ns < S.length ; ns++)
               if (S[ns].id == S[n].srcId) {
                  let findEdge = (lo,hi,p) => {
                     let [cx,cy] = mix(lo, hi, .5),
                         [dx,dy] = subtract(p, [cx,cy]);
                     if (dx > 0 && dx*dx > dy*dy) return [hi[0]+.004, cy + dy/dx * (hi[1]-cy)];
                     if (dx < 0 && dx*dx > dy*dy) return [lo[0]-.004, cy - dy/dx * (hi[1]-cy)];
                     if (dy > 0 && dy*dy > dx*dx) return [cx + dx/dy * (hi[0]-cx), hi[1]+.004];
                                                  return [cx - dx/dy * (hi[0]-cx), lo[1]-.004];
                  }
                  let L0 = S[ns].lo, H0 = S[ns].hi,
                      L1 = S[n ].lo, H1 = S[n ].hi,
                      A = findEdge( L0, H0, mix(L1, H1, .5) ),
                      B = findEdge( L1, H1, mix(L0, H0, .5) ),
                      D = resize(normalize(subtract(B,A)),.02),
                      E = resize(D,1/3);

		  if (S[ns].remove || S[n].remove) {
		     octx.save();
		     octx.globalAlpha = ease(S[ns].remove ?? S[n].remove);
		  }

                  this.line(A,subtract(B,E));
                  this.fillPolygon([ add(B,E), add(B, [-2*D[0] - D[1], -2*D[1] + D[0]]),
                                               add(B, [-2*D[0] + D[1], -2*D[1] - D[0]]) ]);

		  if (S[ns].remove || S[n].remove)
		     octx.restore();

                  break;
               }


      // DRAW ALL THE OBJECTS

      for (let n = 0 ; n < S.length ; n++) {
         let object = S[n];

	 // IF MARKED FOR REMOVAL, FADE OUT THE OBJECT BEFORE DELETING IT

         if (object.remove) {
            object.remove -= 2 * elapsed;
	    if (object.remove <= 0) {
	       deleteObject(n--);
	       continue;
            }
            octx.save();
	    octx.globalAlpha = ease(object.remove);
         }

         let strokes = object.strokes,
             lo = object.lo,
             hi = object.hi;

         // REMOVE ANY OBJECT THAT HAS WANDERED OFF THE SCREEN

         if (hi && (hi[0] < -1 || hi[1] < -screen.height/screen.width) ||
             lo && (lo[0] >  1 || lo[1] >  screen.height/screen.width))
            removeObject(n);

         // HANDLE MORPHING A DRAWING TO A KNOWN DRAWING OR TO A CARD

         if (object.morphData && object.morphData[5] < 1) {
            object.morphData[5] += 2 * elapsed;
            strokes = matchCurves.update(object.morphData, object.morphData[5]);
            if (object.morphData[5] >= 1) {
               object.strokes = strokes;
               clearBounds(n);
               for (let i = 0 ; i < strokes.length ; i++)
                  extendBounds(n, strokes[i]);
               object.type = matchCurves.glyph(object.morphData[2]).name;

               // ACTIVATE A CARD FROM ITS TEXT OR FROM SPEECH

               if (object.type == 'card')
                  if (activateCardFromText(n, textString))
                     textString = '';
                  else
                     activateCardFromText(n, 'editor');

               // CONVERT DRAWING TO A SHADER CARD

               else if (object.type == 'shader') {
                  object.type = 'card';
                  object.card_type = 'shader';
               }

               // CONVERT DRAWING TO A CARD IF THERE IS A MATCHING CARD TYPE

               else
                  for (let word in dictionary)
                     if (object.type == word) {
                        object.type = 'card';
                        object.card_type = word;
                        break;
                     }
            }
         }

         // DRAW AN OBJECT THAT CONSISTS OF A SEQUENCE OF STROKES

         if (object.type != 'card') {
            this.lineWidth(.008);
            for (let i = 0 ; i < strokes.length ; i++)
               this.path(strokes[i]);
         }

         // HANDLE INTERPRETATION AND RENDERING OF A CARD OBJECT

         else {

            if (S_value[object.id] && object.text == 'editor' && object.state && object.state.lines)
               lo[1] = hi[1] - .029 * Math.max(1, object.state.lines.length);

            let isShader = object.card_type == 'shader';

            this.lineWidth(.004);

            let showFrame = ! isShader && object.state;

            if (object.state && object.state.hideFrame)
               showFrame = false;

            if (showFrame)
               this.drawRect([lo[0]-.002,lo[1]-.002], [hi[0]+.002,hi[1]+.002]);

            // TURN ON CLIPPING, SO THAT RENDERING IS CONFINED TO THE CARD.

            let isClipping = ! isShader && ! (object.state && object.state.noClipping);

            if (isClipping) {
               octx.save();
               this.clipToRect([lo[0]-.002,lo[1]-.002], [hi[0]+.002,hi[1]+.002]);
            }

            if (showFrame)
               this.fillColor('#ffffff').fillRect(lo, hi);

            // TEXT HEIGHT AND LINE THICKNESS WILL SCALE WITH CARD SIZE.

            let s = .1 * (hi[0] - lo[0]);

            // IF EVALUATION WAS TRIGGERED, SEE IF TEXT IS A VALID CARD TYPE NAME.

            if (object.card_type && ! S_value[object.id]) {
               switch (object.card_type) {
               case 'shader':
                  let shaderCard = new ShaderCard(octx);
                  shaderCard.setShader('rgb = vec3(0.,0.,1.);');
                  S_value[object.id] = shaderCard;
                  break;
               default:
	          console.log('creating a', object.card_type);
                  S_value[object.id] = dictionary[object.card_type];
                  break;
               }
            }

            if (! S_value[object.id])
               this.setFont(.95 * s).text(object.text, [lo[0] + s/3, hi[1] - s], 0, 1);

            // DRAW A SHADER CARD

            else if (isShader) {
               let shaderCard = S_value[object.id];
               if (object.srcId)

                  // IF THERE IS AN IN-LINK, LINK SHADER CODE FROM THE SOURCE CARD

                  for (let n = 2 ; n < S.length ; n++)
                     if (S[n].id == object.srcId) {
                        shaderCard.setShader(replaceNumberSigns(S[n].state.text));

                        // IF SRC CARD HAS AN IN-LINK, LINK SHADER T[] UNIFORMS FROM IT

                        if (S[n].srcId)
                           for (let nt = 2 ; nt < S.length ; nt++)
                              if (S[nt].id == S[n].srcId) {
                                 if (S[nt].state)
                                    shaderCard.setT(S[nt].state.T);
                                 break;
                              }

                        break;
                     }
               lo[1] = hi[1] + lo[0] - hi[0];
               let L = this.mxp(lo);
               let H = this.mxp(hi);
               shaderCard.draw((L[0]+H[0])/2, (L[1]+H[1])/2, H[0]-L[0]);
            }

            // IF THIS IS A VALID CARD TYPE, DO PROCEDURAL RENDERING.

            else {

               if (object.state && object.state.aspectRatio)
                  lo[1] = hi[1] - (hi[0] - lo[0]) / object.state.aspectRatio;
               else if (object.card_type != 'editor')
                  lo[1] = hi[1] - (hi[0] - lo[0]);

               // COORDINATE CONVERSIONS BETWEEN SCREEN AND INTERNAL CARD COORDS.

               let p0 = [ (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2 ];
               let dp = [ (hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2 ];
               let mf = p => [  p0[0] + p[0]  * dp[0],  p0[1] + p[1]  * dp[1] ];
               let mi = p => [ (p[0] - p0[0]) / dp[0], (p[1] - p0[1]) / dp[1] ];

               // IF A PROCEDURE, GIVE OBJECT A PLACE TO MAINTAIN THE CURRENT STATE.

               let activationText = null;

               let value = S_value[object.id];
               if (typeof value == 'function') {

                  if (object.state === undefined)
                     object.state = {
                        T: [.5,.5,.5,.5,.5,.5,.5,.5,.5,.5],
                     };
                  let state = object.state;

                  // ON CONTROL KEY RELEASE, CONVERT CARD TO THE CARD TYPE PRINTED ON THE CARD.

                  if (object.text == 'editor' && state.key == 'Control' && state.keyState == 'release') {
                     let text = object.state.text;
                     if (text.indexOf('.') > 0)
                        getFile('projects/' + project + '/' + text, text => object.state.newText = text);
                     else
                        activationText = text;
                  }

                  // IF CARD HAS AN IN-LINK, SET ITS PARAMETERS TO THAT CARD'S PARAMETER VALUES.

                  if (object.srcId)
                     for (let n = 2 ; n < S.length ; n++)
                        if (S[n].id == object.srcId) {
                           if (S[n].state)
                              state.T = S[n].state.T;
                           break;
                        }

                  // PROCEDURALLY EVALUATE THE CARD CONTENTS.

                  state.dirty = false;
                  value = value(state, time, mi(pos), n == nm);

		  // ADJUST COORDINATE TRANSFORM MATH FOR NON-SQUARE CARDS

		  if (state.aspectRatio && ! object.hasBeenAdjusted) {
		     let y = (lo[1] + hi[1]) / 2;
		     let h = (hi[0] - lo[0]) / object.state.aspectRatio;
                     lo[1] = y - h/2;
                     hi[1] = y + h/2;
                     dp[1] = (hi[1] - lo[1]) / 2;
                     value = S_value[object.id](state, time, mi(pos), n == nm);
		     object.hasBeenAdjusted = true;
		  }

		  // AFTER THE FIRST TIME EVALUATING A NON-SQUARE CARD FROM A TEXTSTRING,
		  // ADJUST ITS SIZE AND POSITION.

		  if (object.morphData == 1 && state.aspectRatio < 1) {
		     let x = (lo[0] + hi[0]) / 2, w = hi[0] - lo[0];
		     lo[0] = x - w / 2 * state.aspectRatio;
		     hi[0] = x + w / 2 * state.aspectRatio;
		     lo[1] = hi[1] - (hi[1] - lo[1]) * state.aspectRatio;
                     value = S_value[object.id](state, time, mi(pos), n == nm);
		     object.morphData = 2;
		  }
		  if (object.morphData == 1 && state.aspectRatio > 1) {
		     let h = (hi[0] - lo[0]) / state.aspectRatio;
		     hi[1] = this.input.mouse.pos[1] + h/2;
		     lo[1] = hi[1] - h;
                     value = S_value[object.id](state, time, mi(pos), n == nm);
		     object.morphData = 2;
		  }

		  // GIVE THE OBJECT THE OPTION TO MOVE THE POSITION OF THE CARD.

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

               // DRAW ALL THE LINES AND TEXT IN THE CARD OBJECT.

               let lineWidth = .1 * s;
               if (object.state && object.state.lineWidth)
                  lineWidth = object.state.lineWidth;

               let color = penColor;
               object.state.cardSize = hi[0] - lo[0];
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
                     this.setFont(item.size ?? (item.scale ?? .9)*s, 'Courier').text(item.text, mf(item.pos), j[0],j[1]);
                  }
                  else if (item.color)
                     color = item.color;
               }

               if (activationText) {
                  if (activationText == 'shader') {
                     let shaderCard = new ShaderCard(octx);
                     shaderCard.setShader('rgb = vec3(0.,0.,1.);');
                     S_value[object.id] = shaderCard;
                  }
                  else {
                     delete S_value[object.id];
                     activateCardFromText(n, activationText);
                  }
                  dirty = true;
               }
            }

            if (isClipping)
               octx.restore();
         }

	 if (object.remove)
	    octx.restore();
      }

      // IF USING A PEN, DISPLAY THE PEN TIP IN FRONT OF EVERYTHING ELSE

      if (penSize > 0)
         this.drawColor('#00000040').dot(pen.pos, .002 * penSize);

      // SHOW THE TEXT STRING OR USER'S LATEST SPOKEN WORDS AT THE BOTTOM LEFT OF THE SCREEN

      this.setFont(.02).drawColor('#00000060').text(textString, [-.993,-.625], 0);
      this.drawColor(penColor);
   }
}
