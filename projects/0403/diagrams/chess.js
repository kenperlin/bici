function Diagram() {
   this.isFullScreen = true;

   let h = screen.height, w = h * 1512 / 982;

   let chessImage = new Image();
   chessImage.onload = () => {}
   chessImage.src = 'projects/' + project + '/images/chess_pieces.png';

   const rook = 0, knight = 1, bishop = 2, queen = 3, king = 4, pawn = 5;
   const p = [rook,knight,bishop,king,queen,bishop,knight,rook];

   let dy = .05 * h, mn, pieces, dirty;

   this.init = () => {
      pieces = [];
      for (let side = 0 ; side <= 1 ; side++)
	 for (let col = 0 ; col < 8 ; col++) {
            pieces.push({type: p[col], side: side, col: col, row: 7 * side    });
            pieces.push({type: pawn  , side: side, col: col, row: 5 * side + 1});
         }
      dirty = true;
   }

   this.update = () => {
      let side = isFirstPlayer() ? 0 : 1;

      let colw = row => .123 * h / (.85 + .4 * row / 8);
      let rowh = row => colw(row) / 4;
      let colx = (col,row) => w/2 + (col - 3.7) * colw(row);
      let rowy = row => h - (row + 5.0) * rowh(row);

      let mouse = this.input.mouse;

      let mRow, mCol;

      octx.clearRect(0,0,w,h);

      for (let loop = 0 ; loop < 2 ; loop++)
      for (let row = 0 ; row < 8 ; row++)
      for (let col = 0 ; col < 8 ; col++) {

         // COMPUTE POSITIONS OF SQUARE VERTICES

	 let x00 = colx(col  ,row-.5);
	 let y00 = rowy(      row-.5)+rowh(row-.5) + dy;
	 let x10 = colx(col+1,row-.5);
	 let y10 = rowy(      row-.5)+rowh(row-.5) + dy;

	 let x01 = colx(col  ,row+.5);
	 let y01 = rowy(      row+.5)+rowh(row+.5) + dy;
	 let x11 = colx(col+1,row+.5);
	 let y11 = rowy(      row+.5)+rowh(row+.5) + dy;

	 // BOARD SQUARE WILL BE RENDERED IN PERSPECTIVE

	 octx.beginPath();
	 octx.moveTo(x00,y00);
	 octx.lineTo(x10,y10);
	 octx.lineTo(x11,y11);
	 octx.lineTo(x01,y01);
	 octx.lineTo(x00,y00);

	 // FIRST TIME THROUGH LOOP, FILL IN SQUARE

	 if (loop == 0) {
            octx.fillStyle = '#ffffff40';
	    octx.fill();
         }

	 // SECOND TIME THROUGH LOOP, DRAW SQUARE OUTLINE

         else {
            octx.lineWidth = (y11-y10) / 100;
            octx.stroketyle = 'black';
	    octx.stroke();

	    // IF SQUARE IS AT CURSOR, HIGHLIGHT SQUARE

	    if (mouse.y >= y01 && mouse.y < y00) {
	       let t = (mouse.y - y01) / (y00 - y01);
	       let x0 = x01 + t * (x01 - x00);
	       let x1 = x11 + t * (x11 - x10);
	       if (mouse.x >= x0 && mouse.x < x1) {
	          octx.fillStyle = '#ff000060';
	          octx.fill();
	          mRow = side==0 ? row : 7 - row;
	          mCol = col;
	       }
	    }
         }
      }

      // FIND THE PIECE AT A SQUARE, IF ANY

      let pieceAt = (col,row) => {
         for (let n = 0 ; n < pieces.length ; n++)
	    if (pieces[n].row == row && pieces[n].col == col)
	       return n;
      }

      switch (mouse.state) {
      case 'press':
         mn = pieceAt(mCol, mRow);
	 break;

      case 'release':
         if (mn !== undefined) {

            // REMOVE A PIECE FROM THE BOARD

            if (mRow === undefined || mCol === undefined) {
	       outerLoop:
	       for (let col = 8 ; col < 12 ; col++)
	       for (let row = 0 ; row < 8 ; row++)
	          if (pieceAt(col, row) === undefined) {
	             pieces[mn].col = col;
	             pieces[mn].row = row;
	             break outerLoop;
                  }
	       dirty = true;
            }

            // MOVE A PIECE IF DESTINATION SQUARE IS EMPTY

            else if (pieceAt(mCol, mRow) === undefined) {
               pieces[mn].row = mRow;
               pieces[mn].col = mCol;
	       dirty = true;
            }
	    mn = undefined;
         }
	 break;
      }

      // UPDATE SHARED STATE

      if (! dirty)
         pieces = this.getState(); // IF NO CHANGES, GET SHARED STATE
      else
         this.setState(pieces);    // IF ANY CHANGE, SET SHARED STATE
      dirty = false;

      /////////////////// DRAW EVERYTHING //////////////////

      // DRAW THE THICK FRONT EDGE OF THE 3D BOARD

      {
         let x0 = colx(0, -.5);
         let x1 = colx(8, -.5);
         let y0 = rowy(-.5)+rowh(-.5) + dy;
         octx.fillStyle = '#00000080';
         octx.fillRect(x0, y0, x1-x0+2, .03 * h);
      }

      // DRAW ALL PIECES IN BACK TO FRONT ORDER

      let drawPiece = (n, col, row) => {
         let r = side==0 ? row : 7 - row;
         let w = colw(r);
         let x = colx(col+.25,r);
         let y = rowy(r) + rowh(r) + dy - w;
         octx.drawImage(chessImage, (n%6) * 120, (1-(n/6>>0)) * 220, 105, 220,
	                            x, y, .5 * w, .5 * w * .968 / .462);
      }

      let ordered = [];
      for (let n = 0 ; n < pieces.length ; n++)
         ordered.push(pieces[n]);
      ordered.sort((a,b) => side==0 ? b.row - a.row : a.row - b.row);

      for (let n = 0 ; n < pieces.length ; n++) {
         let s = ordered[n];
         drawPiece(s.type + 6 * s.side, s.col, s.row);
      }
   }
}

