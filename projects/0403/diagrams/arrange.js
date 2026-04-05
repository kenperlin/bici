function Diagram() {
   this.isFullScreen = true;

   // MAKE SURE THAT THE GLOBAL VARIABLE EXISTS.

   if (! window.SS)
      window.SS = '';

   // METHODS TO PACK/UNPACK ALL THE SHAPES DATA INTO/FROM A COMPACT STRING.

   let packS = () => {
      SS = '';
      for (let n = 0 ; n < S.length ; n += 4) {
         let type = S[n], x = S[n+1], y = S[n+2], c = S[n+3];
         let X = 2048.5 + 2048 * x >> 0,
             Y = 2048.5 + 2048 * y >> 0;
         SS += toBase64(type << 3 | c)
             + toBase64(X >> 6) + toBase64(X & 63)
             + toBase64(Y >> 6) + toBase64(Y & 63);
      }
   }

   let unpackS = () => {
      S = [];
      let C = i => fromBase64(SS.charAt(i));
      for (let i = 0 ; i < SS.length ; i += 5) {
         let type = C(i) >> 3, c = C(i) & 7,
             X = C(i+1) << 6 | C(i+2), x = (X - 2048) / 2048,
             Y = C(i+3) << 6 | C(i+4), y = (Y - 2048) / 2048;
         S.push(type, x, y, c);
      }
   }

   let cursorIds = { mouse:0, left:1, right:2 };
   let S = [], X = .53, Y = .47, e = .06;

   // DRAW ONE OF THE SEVEN SHAPES, AT A GIVEN LOCATION AND WITH A GIVEN COLOR.

   drawShape = (type,x,y,c) => {
      if (c !== undefined)
         this.fillColor(game.colors[c]);
      switch (type) {
      case 0: this.fillCurve(10, t => game.regularPolygon(t, [x,y], .06 , 10, true)); break;
      case 1: this.fillCurve( 3, t => game.regularPolygon(t, [x,y], .055, 3)); break;
      case 2: this.fillCurve( 4, t => game.regularPolygon(t, [x,y], .055, 4)); break;
      case 3: this.fillCurve(32, t => game.heart(t, [x,y], .08)); break;
      case 4: this.fillArc([x,y],.048); break;
      case 5: this.fillRect([x-.042,y-.042],[x+.042,y+.042]); break;
      case 6: this.fillPolygon(game.cross([x,y], .045, .017)); break;
      }
   }

   // FIND WHICH SHAPE, IF ANY, IS AT THIS POSITION.

   let findShape = (x,y) => {
      for (let n = S.length - 4 ; n >= 0 ; n -= 4)
         if (Math.abs(S[n+1] - x) < .05 && Math.abs(S[n+2] - y) < .05)
            return n;
   }

   // UPDATE FOR THIS ANIMATION FRAME.

   let dirty = false;

   this.update = ctx => {
      let y2n = y => Math.max(0, Math.min(7, (Y - y) / .15 + .5 >> 0));
      let n2y = n => Y - .15 * n;

      // METHOD TO RESPOND TO ALL MOUSE EVENTS AND HAND GESTURES.

      let respondToInput = cursor => {
         let x = cursor.pos[0];
         let y = cursor.pos[1];

         switch (cursor.state) {
         case 'up':                         // MOUSE MOVE DOES NOT CURRENTLY DO ANYTHING
            break;

         case 'press':
            if (x > -X-e-e && x <= -X) {    // PRESS ON A SHAPE ICON TO CREATE A NEW SHAPE
               cursor.n = S.length;
               let type = y2n(y);
               S.push(type, -X-e, n2y(type), 7);
               dirty = true;
            }
            if (x >= X && x < X+e+e) {      // PRESS ON A COLOR SWATCH TO START COLOR DRAGGING
               let c = y2n(y);
               cursor.c  = c;
               cursor.cx = X+e;
               cursor.cy = n2y(c);
            }
            cursor.n = findShape(x, y);     // SELECT AN EXISTING SHAPE
            break;

         case 'down':
            if (cursor.n !== undefined) {   // DRAGGING A SHAPE
               S[cursor.n+1] += x - cursor.x0;
               S[cursor.n+2] += y - cursor.y0;
               dirty = true;
            }
            if (cursor.c !== undefined) {   // DRAGGING A COLOR SWATCH
               cursor.cx += x - cursor.x0;
               cursor.cy += y - cursor.y0;
            }
            break;

         case 'release':

            if (cursor.n !== undefined) {   // FINISHED DRAGGING A SHAPE
               if (Math.abs(S[cursor.n+1]) > X)
                  S.splice(cursor.n, 4);
               dirty = true;
            }
            delete cursor.n;

            if (cursor.c !== undefined) {   // IF DRAGGED A COLOR SWATCH ONTO A SHAPE
               let n = findShape(x,y);      // THEN CHANGE THE COLOR OF THAT SHAPE
               if (n !== undefined) {
                  S[n+3] = cursor.c;
                  dirty = true;
               }
            }
            delete cursor.c;

            break;
         }

         cursor.x0 = x;                     // REMEMBER PREVIOUS CURSOR POSITION
         cursor.y0 = y;
      }

      // UNPACK THE CURRENT STATE FROM GLOBAL STORAGE (SKIP IF LOCAL USER IS ACTIVELY INTERACTING).

      if (! dirty)
         unpackS();

      // RESPOND TO INPUT EVENTS.

      for (let cursorId in cursorIds) {
         let cursor = this.input[cursorId];
         if (cursor)
            respondToInput(cursor);
      }

      // DRAW THE FRAME AROUND THE BOARD.

      this.drawColor('black');
      this.lineWidth(.001);
      this.drawRect([-X,-.5],[X,.55]);

      // DRAW ALL THE SHAPE ICONS ALONG THE LEFT OF THE BOARD.

      this.fillColor(game.colors[7] + '80');
      for (let n = 0 ; n < 7 ; n++)
         drawShape(n, -X-e, n2y(n));

      // DRAW ALL THE COLOR SWATCHES ALONG THE RIGHT OF THE BOARD.

      for (let n = 0 ; n < 7 ; n++) {
         this.fillColor(game.colors[n] + '80');
         this.fillCurve(32, t => game.superquadric(t, [X+e, n2y(n)], .04));
      }

      // DRAW ALL THE SHAPES ON THE BOARD.

      for (let n = 0 ; n < S.length ; n += 4)
         drawShape(S[n], S[n+1], S[n+2], S[n+3]);

      // DRAW ANY COLOR SWATCHES THAT A CURRENTLY BEING DRAGGED ON THE BOARD.

      for (let cursorId in cursorIds) {
         let cursor = this.input[cursorId];
         if (cursor && cursor.c !== undefined) {
            this.fillColor(game.colors[cursor.c] + '80');
            this.fillCurve(32, t => game.superquadric(t, [cursor.cx,cursor.cy], .04));
         }
      }

      // DRAW THE CURSORS FOR THE LEFT AND RIGHT HANDS

      for (let cursorId in cursorIds) {
         let cursor = this.input[cursorId];
         if (cursor && cursor.pos[2] > 0) {
            let r = .015 * cursor.pos[2],
                t = .004 * cursor.pos[2];
            this.lineWidth(t);
            this.drawColor('#00000080');
            this.fillColor('#00000080');
            let xy = [cursor.pos[0],cursor.pos[1]];
            switch (cursor.state) {
            case 'up'     : this.    arc(xy,r-t/2); break;
            case 'press'  : this.fillArc(xy,r    ); break;
            case 'down'   : this.fillArc(xy,r    ); break;
            case 'release': this.    arc(xy,r-t/2); break;
            }
         }
      }

      // PACK THE CURRENT STATE AND SEND TO GLOBAL STORAGE ONLY IF LOCAL USER CHANGED IT.

      if (dirty) {
         packS();
         codeArea.setVar('SS', SS);
         if (typeof webrtcClient !== 'undefined' && webrtcClient)
            webrtcClient.sendStateUpdate({ SS: SS });
         dirty = false;
      }
   }
}

