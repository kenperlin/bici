function Diagram() {
   this.isFullScreen = true;
   tracking_isDrawingShadowAvatar = false;

   this.keyUp = key => {
      let n;
      for (n = S.length - 1 ; n >= 2 ; n--)
         if (contains(n, pos))
            break;

      if (n >= 2 && S[n].type == 'window') {
         if (S[n].text === undefined)
            S[n].text = '';
         switch (key) {
         case 'Backspace':
            S[n].text = S[n].text.substring(0,S[n].text.length-1);
            break;
         case 'Enter':
            S[n].text += '\n';
            break;
         case 'Shift':
            break;
         case 'Escape':
            let value = dictionary[S[n].text];
	    if (typeof value == 'string')
               S[n].text = value;
            else if (value !== undefined)
               S[n].window_type = S[n].text;
            break;
         default:
            S[n].text += key;
            break;
         }
	 dirty = true;
         return;
      }

      switch (key) {
      case 'Backspace':
         if (S.length == 3) {
            S.splice(2, 1);
            dirty = true;
         }
         else if (n >= 2) {
            remove(n);
            dirty = true;
         }
         break;
      }
   }

   let matchCurves = new MatchCurves();
   matchCurves.flipY(false);
   glyphs(matchCurves);

   let cursorIds = { mouse:0, left:1, right:2 };
   let dirty, bgClick, state = -1, stroke = [], p = [], n = -1;
   let isDragging = false, isResizing = false, sy, isLinking, srcId;
   let np = isFirstPlayer() ? 0 : 1;
   let nm = -1;
   let pos = [0,0], time;

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

   let remove = n => {
      let id = S[n].id;
      S.splice(n, 1);
/*
      for (let n = 2 ; n < S.length ; n++)
         if (S[n].srcId == id)
	    delete S[n].srcId;
*/
   }

   this.update = () => {

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

            if (nm < 2)
               S[np].strokes[0].push(pos);
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
                        remove(n);

                     break;

                  // IF THE PREVIOUS CLICK WAS NORTH OF THIS CLICK

                  case 2:

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

                  // IF THE PREVIOUS CLICK WAS SOUTH OF THIS CLICK

                  case 6:

                     // AND THIS CLICK IS IN AN OBJECT, CREATE A LINK

                     if (n >= 2 && S[n].morphData) {
                        isLinking = cursorId;
			srcId = S[n].id;
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

      // RESPOND TO INPUT FROM ALL KINDS OF CURSORS

      for (let cursorId in cursorIds) {
         let cursor = this.input[cursorId];
         if (cursor)
            respondToInput(cursor, cursorId);
      }

      // SYNCHRONIZE WITH OTHER THE PLAYER

      window.SS_hold = [ np ];
      if (! dirty)
         S = this.getState();
      else
         this.setState(S);
      dirty = false;

      // COMPUTE THE CURRENT TIME AND THE TIME ELAPSED SINCE THE PREVIOUS FRAME

      let elapsed = .03, newTime = Date.now() / 1000;
      if (time !== undefined)
         elapsed = newTime - time;
      time = newTime;

      // DRAW EVERY LINK AS A CONNECTING LINE WITH AN ARROWHEAD IN THE MIDDLE

      this.lineWidth(.008);
      for (let n = 0 ; n < S.length ; n++)
         if (S[n].srcId)
            for (let ns = 2 ; ns < S.length ; ns++)
	       if (S[ns].id == S[n].srcId) {
	          let x0 = (S[ns].lo[0] + S[ns].hi[0]) / 2,
		      y0 = (S[ns].lo[1] + S[ns].hi[1]) / 2,
	              x1 = (S[n ].lo[0] + S[n ].hi[0]) / 2,
		      y1 = (S[n ].lo[1] + S[n ].hi[1]) / 2,
		      x  = (x0 + x1) / 2,
		      y  = (y0 + y1) / 2,
		      dx = x1 - x0,
		      dy = y1 - y0,
		      s  = .02 / Math.sqrt(dx * dx + dy * dy);
	          this.line([x0,y0],[x1,y1]);
	          this.fillPolygon([ [x + s*dx       , y + s*dy       ],
		                     [x - s*dx - s*dy, y - s*dy + s*dx],
		                     [x - s*dx + s*dy, y - s*dy - s*dx] ]);
	          break;
               }

      // DRAW ALL THE OBJECTS

      for (let n = 0 ; n < S.length ; n++) {
         let object = S[n];
         let strokes = object.strokes;

         // HANDLE OBJECT MORPHING

         if (object.morphData && object.morphData[5] < 1) {
            object.morphData[5] += 2 * elapsed;
            strokes = matchCurves.update(object.morphData, object.morphData[5]);
            if (object.morphData[5] >= 1) {
               object.strokes = strokes;
               clearBounds(n);
               for (let i = 0 ; i < strokes.length ; i++)
                  extendBounds(n, strokes[i]);
               object.type = matchCurves.glyph(object.morphData[2]).name;
	       if (object.type == 'window')
	          object.text = '';
            }
         }

	 // DRAW OBJECTS THAT CONSIST OF SEQUENCES OF STROKES

         this.lineWidth(.015);
         for (let i = 0 ; i < strokes.length ; i++)
            this.path(strokes[i]);

         // HANDLE INTERPRETATION AND RENDERING OF WINDOW OBJECTS

         if (object.type == 'window') {
            let lo = object.lo, hi = object.hi;

	    // TURN ON CLIPPING, SO THAT RENDERING IS CONFINED TO THE WINDOW.

	    octx.save();
	    this.clipToRect(lo, hi);

            this.fillColor('#ffffff').fillRect(lo, hi);

	    // TEXT HEIGHT AND LINE THICKNESS WILL SCALE WITH WINDOW SIZE.

            let s = .1 * (hi[1] - lo[1]);

	    // IF EVALUATION WAS TRIGGERED, SEE IF TEXT IS A VALID WINDOW TYPE NAME.

	    if (object.window_type && ! S_value[object.id])
	       S_value[object.id] = dictionary[object.window_type];

	    if (! S_value[object.id])
               this.setFont(.95 * s).text(object.text, [lo[0] + s/3, hi[1] - s], 0, 1);

            // IF THIS IS A VALID WINDOW TYPE, DO PROCEDURAL RENDERING.

            else {

               // COORDINATE CONVERSIONS BETWEEN SCREEN AND INTERNAL WINDOW COORDS.

	       let p0 = [ (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2 ];
	       let dp = [ (hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2 ];
               let mf = p => [  p0[0] + p[0]  * dp[0],  p0[1] + p[1]  * dp[1] ];
               let mi = p => [ (p[0] - p0[0]) / dp[0], (p[1] - p0[1]) / dp[1] ];

	       // IF A PROCEDURE, GIVE OBJECT A PLACE TO MAINTAIN THE CURRENT STATE.

               let value = S_value[object.id];
	       let params;
               if (typeof value == 'function') {
	          if (object.state === undefined)
		     object.state = {};

                  if (object.srcId)
		     for (let n = 2 ; n < S.length ; n++)
		        if (S[n].id == object.srcId) {
			   object.state.T = S[n].state.T;
			   break;
                        }

                  value = value(object.state, time, mi(pos), n == nm); // FIX THIS!!!!
               }

	       // DRAW ALL THE LINES AND TEXT IN THE WINDOW OBJECT.

               this.lineWidth(.1*s);
               for (let i = 0 ; i < value.length ; i++) {
                  let item = value[i];
		  if (item.draw) {
                     let path = [];
                     for (let j = 0 ; j < item.draw.length ; j++)
                        path.push(mf(item.draw[j]));
                     this.drawColor(item.color ?? '#000000');
                     this.path(path);
                  }
		  else if (item.fill) {
                     let path = [];
                     for (let j = 0 ; j < item.fill.length ; j++)
                        path.push(mf(item.fill[j]));
                     this.fillColor(item.color ?? '#000000');
                     this.fillPolygon(path);
		  }
                  else if (item.text) {
                     this.fillColor(item.color ?? '#000000');
                     this.setFont(.9*s, 'Courier').text(item.text, mf(item.pos));
                  }
               }
            }

	    octx.restore();
         }
      }
   }
}
