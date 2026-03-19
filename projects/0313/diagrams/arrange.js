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

   let colors = '#ff0000,#ff8000,#ffff00,#30d030,#0080ff,#a000ff,#e800a0'.split(',');
   let cursorIds = { mouse:0, left:1, right:2 };
   let S = [], c = 0, X = .53, Y = .47;

   // USEFUL PROCEDURAL SHAPE DEFINITIONS.

   let superquadric = (t, C, R) => {
      let x = Math.sin(2 * Math.PI * t);
      let y = Math.cos(2 * Math.PI * t);
      let r = Math.pow(x*x*x*x + y*y*y*y, 1/4);
      return [C[0] + R * x / r, C[1] + R * y / r];
   }

   let regularPolygon = (t, C, R, n, isStar) => {
      let x = Math.sin(2 * Math.PI * t);
      let y = Math.cos(2 * Math.PI * t);
      let r = isStar && n * t >> 0 & 1 ? R/2 : R;
      return [C[0] + r * x, C[1] + r * y];
   }

   let heart = (t, C, R) => {
      let x = Math.sin(2 * Math.PI * t);
      let y = Math.cos(2 * Math.PI * t);
      let r = R * (1 - Math.pow(2 * (t < .5 ? t : 1-t), .7));
      return [C[0] + 1.25 * r * x, C[1] + .5*R - r * y];
   }

   // DRAW ONE OF THE SEVEN SHAPES, AT A GIVEN LOCATION AND WITH A GIVEN COLOR.

   drawShape = (type,x,y,c) => {
      if (c !== undefined)
         this.fillColor(colors[c]);
      switch (type) {
      case 0: this.fillCurve(10, t => regularPolygon(t, [x,y], .06 , 10, true)); break;
      case 1: this.fillCurve( 3, t => regularPolygon(t, [x,y], .055, 3)); break;
      case 2: this.fillCurve( 4, t => regularPolygon(t, [x,y], .055, 4)); break;
      case 3: this.fillCurve(32, t => heart(t, [x,y], .08)); break;
      case 4: this.fillArc([x,y],.048); break;
      case 5: this.fillRect([x-.042,y-.042],[x+.042,y+.042]); break;
      case 6: this.fillRect([x-.017,y-.045],[x+.017,y-.017]);
              this.fillRect([x-.045,y-.017],[x+.045,y+.017]);
              this.fillRect([x-.017,y+.045],[x+.017,y+.017]); break;
      }
   }

   // FIND WHICH SHAPE, IF ANY, IS AT THIS POSITION.

   let findShape = (x,y) => {
      for (let n = 0 ; n < S.length ; n += 4)
	 if (Math.abs(S[n+1] - x) < .05 && Math.abs(S[n+2] - y) < .05)
	    return n;
   }

   // METHOD TO DISPLAY VALUES ON-SCREEN WHEN DEBUGGING.

   let info = str => {
      octx.fillStyle = 'black';
      octx.font = '24px Helvetica';
      octx.fillText(str, screen.width/2, 30);
   }

   // UPDATE FOR THIS ANIMATION FRAME.

   let dirty = false;

   this.update = ctx => {

      // METHOD TO RESPOND TO ALL MOUSE EVENTS AND HAND GESTURES.

      let respondToInput = cursor => {
         let x     = cursor.pos[0];
         let y     = cursor.pos[1];
         let state = cursor.state;

         switch (state) {
	 case 'up':
	    if (x >= X)
               c = Math.max(0, Math.min(colors.length-1, (Y - y) / .15 + .5 >> 0));
            break;

	 case 'press':
	    if (x > -X-.12 && x <= -X) {
	       cursor.n = S.length;
               let type = Math.max(0, Math.min(7, (Y - y) / .15 + .5 >> 0));
	       S.push(type, x, y, c);
	       dirty = true;
	    }
	    if (x >= X && x < X+.12) {
	       cursor.c  = c;
	       cursor.cx = x;
	       cursor.cy = y;
            }
	    cursor.n = findShape(x, y);
	    console.log('---------------', cursor.n);
	    break;

         case 'down':
	    if (cursor.n !== undefined) {
	       S[cursor.n+1] += x - cursor.x0;
	       S[cursor.n+2] += y - cursor.y0;
	       dirty = true;
            }
	    if (cursor.c !== undefined) {
	       cursor.cx = x;
	       cursor.cy = y;
	    }
	    break;

         case 'release':

	    if (cursor.n !== undefined) {
	       if (Math.abs(S[cursor.n+1]) > X)
	          S.splice(cursor.n, 4);
	       dirty = true;
            }
	    delete cursor.n;

	    if (cursor.c !== undefined) {
	       let n = findShape(x,y);
	       if (n !== undefined) {
	          S[n+3] = cursor.c;
	          dirty = true;
	       }
	    }
	    delete cursor.c;

	    break;
         }

	 cursor.x0 = x;
	 cursor.y0 = y;
      }

      // UNPACK THE CURRENT STATE RETRIEVED FROM GLOBAL STORAGE.

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

      this.fillColor(colors[c] + '80');
      for (let n = 0 ; n < 7 ; n++)
         drawShape(n, -X - .06, Y - .15 * n);

      // DRAW ALL THE COLOR SWATCHES ALONG THE RIGHT OF THE BOARD.

      for (let n = 0 ; n < colors.length ; n++) {
         this.fillColor(colors[n] + '80');
	 this.fillCurve(32, t => superquadric(t, [X+.06, Y-.15*n], n==c ? .05 : .04));
      }

      // DRAW ALL THE SHAPES ON THE BOARD.

      for (let n = 0 ; n < S.length ; n += 4)
         drawShape(S[n], S[n+1], S[n+2], S[n+3]);

      // DRAW ANY COLOR SWATCHES THAT A CURRENTLY BEING DRAGGED ON THE BOARD.

      for (let cursorId in cursorIds) {
	 let cursor = this.input[cursorId];
	 if (cursor && cursor.c !== undefined) {
            this.fillColor(colors[cursor.c] + '80');
	    this.fillCurve(32, t => superquadric(t, [cursor.cx,cursor.cy], .04));
         }
      }

      // DRAW THE CURSORS FOR THE LEFT AND RIGHT HANDS

      for (let cursorId in cursorIds) {
	 let cursor = this.input[cursorId];
         if (cursor) {
            let pos = cursor.pos;
	    if (pos[2] > 0) {
               let state = cursor.state;
	       let r = .015 * pos[2], t = .004 * pos[2];
	       this.lineWidth(t);
	       this.drawColor('#00000080');
	       this.fillColor('#00000080');
	       let xy = [pos[0],pos[1]];
	       switch (state) {
	       case 'up'     : this.    arc(xy,r-t/2); break;
               case 'press'  : this.fillArc(xy,r    ); break;
               case 'down'   : this.fillArc(xy,r    ); break;
               case 'release': this.    arc(xy,r-t/2); break;
               }
            }
         }
      }

      // PACK THE CURRENT STATE AND SEND TO GLOBAL STORAGE ONLY IF LOCAL USER CHANGED IT.

      if (dirty) {
         packS();
         codeArea.setVar('SS', SS);
         dirty = false;
      }
   }
}

