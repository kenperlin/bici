function Diagram() {
   this.isFullScreen = true;

   if (! window.SS)
      window.SS = '';

   let pack = () => { 
      SS = '';
      for (let n = 0 ; n < pieces.length ; n++) {
         let piece = pieces[n];
         SS += toBase64(piece.type << 1 | piece.side)
             + toBase64(piece.col)
             + toBase64(piece.row)
      }
   }  
      
   let unpack = () => {
      pieces = [];
      let C = i => fromBase64(SS.charAt(i));
      for (let i = 0 ; i < SS.length ; i += 3) {
         let type = C(i) >> 1,
	     side = C(i) & 1,
             col  = C(i+1),
	     row  = C(i+2);
         pieces.push({type: type, side: side, col: col, row: row});
      }
   }  

   let chessImage = new Image();
   chessImage.onload = () => {}
   chessImage.src = 'projects/' + project + '/images/chess_pieces.png';

   const rook = 0, knight = 1, bishop = 2, queen = 3, king = 4, pawn = 5;

   let pieces = [];

   let addPieces = side => {
      let row = 7 * side;
      if (side == 0)
         for (let n = 0 ; n < 8 ; n++)
            pieces.push({type: pawn, side: side, col: n, row: side ? 6 : 1});
      pieces.push({type: rook  , side: side, col: 0, row: row});
      pieces.push({type: knight, side: side, col: 1, row: row});
      pieces.push({type: bishop, side: side, col: 2, row: row});
      pieces.push({type: queen , side: side, col: 3, row: row});
      pieces.push({type: king  , side: side, col: 4, row: row});
      pieces.push({type: bishop, side: side, col: 5, row: row});
      pieces.push({type: knight, side: side, col: 6, row: row});
      pieces.push({type: rook  , side: side, col: 7, row: row});
      if (side == 1)
         for (let n = 0 ; n < 8 ; n++)
            pieces.push({type: pawn, side: side, col: n, row: side ? 6 : 1});
   }
   addPieces(1);
   addPieces(0);
   pack();

   let dy = 50, mn, dirty = false;

   this.update = () => {
      let side = isFirstPlayer() ? 0 : 1;

      let colw = row => 120 / (.85 + .4 * row / 8);
      let rowh = row =>  30 / (.85 + .4 * row / 8);
      let colx = (col,row) => screen.width/2 + (col - 3.7) * colw(row);
      let rowy = row => screen.height - (row + 5.0) * rowh(row);

      let mouse = this.input.mouse;

      let mRow, mCol;

      octx.clearRect(0,0,screen.width,screen.height);

      for (let loop = 0 ; loop < 2 ; loop++)
      for (let row = 0 ; row < 8 ; row++)
      for (let col = 0 ; col < 8 ; col++) {

	 let x00 = colx(col  ,row-.5);
	 let y00 = rowy(      row-.5)+rowh(row-.5) + dy;
	 let x10 = colx(col+1,row-.5);
	 let y10 = rowy(      row-.5)+rowh(row-.5) + dy;

	 let x01 = colx(col  ,row+.5);
	 let y01 = rowy(      row+.5)+rowh(row+.5) + dy;
	 let x11 = colx(col+1,row+.5);
	 let y11 = rowy(      row+.5)+rowh(row+.5) + dy;

	 octx.beginPath();
	 octx.moveTo(x00,y00);
	 octx.lineTo(x10,y10);
	 octx.lineTo(x11,y11);
	 octx.lineTo(x01,y01);
	 octx.lineTo(x00,y00);

	 if (loop == 0) {
            octx.fillStyle = '#ffffff40';
	    octx.fill();
         }
         else {
            octx.stroketyle = 'black';
	    octx.stroke();

	    if (mouse.y >= y01 && mouse.y < y00) {
	       let t = (mouse.y - y01) / (y00 - y01);
	       let x0 = x01 + t * (x01 - x00);
	       let x1 = x11 + t * (x11 - x10);
	       if (mouse.x >= x0 && mouse.x < x1) {
	          octx.fillStyle = '#ff000060';
	          octx.fill();
	          mRow = row;
	          mCol = col;
	       }
	    }
         }
      }

      let pieceAt = (col,row) => {
         for (let n = 0 ; n < pieces.length ; n++)
	    if (pieces[n].row == row && pieces[n].col == col)
	       return n;
      }

      if (mouse.isDown && ! mouse.wasDown)
         mn = pieceAt(mCol, mRow);

      if (! mouse.isDown && mouse.wasDown && mn !== undefined) {
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
         else if (pieceAt(mCol, mRow) === undefined) {
            pieces[mn].row = mRow;
            pieces[mn].col = mCol;
	    dirty = true;
         }
	 mn = undefined;
      }

      mouse.wasDown = mouse.isDown;

      {
         let x0 = colx(0, -.5);
         let x1 = colx(8, -.5);
         let y0 = rowy(-.5)+rowh(-.5) + dy;
         octx.fillStyle = '#00000080';
         octx.fillRect(x0, y0, x1-x0+2, 30);
      }

      let drawPiece = (n, col, row) => {
         let r = side==0 ? row : 7 - row;
         let w = colw(r);
         let x = .98*colx(col,r) + w/3 + .4 * (7 - r) * (col - 3.5);
         let y = .72*rowy(r) + 100 + w/8;
         octx.drawImage(chessImage, (n%6) * 120, (n/6>>0) * 220, 105, 220,
	                            x, y + dy, .5 * w, .5 * w * .968 / .462);
      }

      if (! dirty)
         unpack();

      let ordered = [];
      for (let n = 0 ; n < pieces.length ; n++)
         ordered.push(pieces[n]);
      ordered.sort((a,b) => side==0 ? b.row - a.row : a.row - b.row);

      for (let n = 0 ; n < pieces.length ; n++) {
         let s = ordered[n];
         drawPiece(s.type + 6 * s.side, s.col, s.row);
      }

      if (dirty) {
         pack();
         if (typeof webrtcClient !== 'undefined' && webrtcClient)
            webrtcClient.sendStateUpdate({ SS: SS });
         dirty = false;
      }
   }
}

