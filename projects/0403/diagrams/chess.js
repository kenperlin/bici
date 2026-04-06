function Diagram() {
   this.isFullScreen = true;

   let chessImage = new Image();
   chessImage.onload = () => {}
   chessImage.src = 'projects/' + project + '/images/chess_pieces.png';
   const rook = 0, knight = 1, bishop = 2, queen = 3, king = 4, pawn = 5;

   let pieces = [];
   let addPieces = color => {
      let row = 7 * color;
      if (color == 0)
         for (let n = 0 ; n < 8 ; n++)
            pieces.push({type: pawn, color: color, col: n, row: color ? 6 : 1});
      pieces.push({type: rook  , color: color, col: 0, row: row});
      pieces.push({type: knight, color: color, col: 1, row: row});
      pieces.push({type: bishop, color: color, col: 2, row: row});
      pieces.push({type: queen , color: color, col: 3, row: row});
      pieces.push({type: king  , color: color, col: 4, row: row});
      pieces.push({type: bishop, color: color, col: 5, row: row});
      pieces.push({type: knight, color: color, col: 6, row: row});
      pieces.push({type: rook  , color: color, col: 7, row: row});
      if (color == 1)
         for (let n = 0 ; n < 8 ; n++)
            pieces.push({type: pawn, color: color, col: n, row: color ? 6 : 1});
   }
   addPieces(1);
   addPieces(0);

   let dy = 50, mn = -1;

   this.update = () => {
      let colw = row => 120 / (.85 + .4 * row / 8);
      let rowh = row =>  30 / (.85 + .4 * row / 8);
      let colx = (col,row) => screen.width/2 + (col - 3.7) * colw(row);
      let rowy = row => screen.height - (row + 5.0) * rowh(row);

      let mouse = this.input.mouse;

      let mRow = -1, mCol = -1;

      octx.clearRect(0,0,screen.width,screen.height);
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

         octx.fillStyle = row + col & 1 ? '#ffffff80' : '#80808080';
	 octx.beginPath();
	 octx.moveTo(x00,y00);
	 octx.lineTo(x10,y10);
	 octx.lineTo(x11,y11);
	 octx.lineTo(x01,y01);
	 octx.fill();

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

      if (mouse.isDown && ! mouse.wasDown) {
         mn = -1;
         for (let n = 0 ; n < pieces.length ; n++) {
	    let piece = pieces[n];
	    if (piece.row == mRow && piece.col == mCol)
	       mn = n;
	 }
      }

      if (! mouse.isDown && mouse.wasDown && mn >= 0 && mRow >= 0) {
         pieces[mn].row = mRow;
         pieces[mn].col = mCol;
      }

      mouse.wasDown = mouse.isDown;

      {
         let x0 = colx(0, -.5);
         let x1 = colx(8, -.5);
         let y0 = rowy(-.5)+rowh(-.5) + dy;
         octx.fillStyle = '#00000080';
         octx.fillRect(x0, y0, x1-x0, 30);
      }

      let drawPiece = (n, col, row) => {
         let w = colw(row);
         let x = .98*colx(col,row) + w/3 + .4 * (7 - row) * (col - 3.5);
         let y = .72*rowy(row) + 100 + w/8;
         octx.drawImage(chessImage, (n%6) * 120, (n/6>>0) * 220, 105, 220,
	                            x, y + dy, .5 * w, .5 * w * .968 / .462);
      }

      let ordered = [];
      for (let n = 0 ; n < pieces.length ; n++)
         ordered.push(pieces[n]);
      ordered.sort((a,b) => b.row - a.row);

      for (let n = 0 ; n < pieces.length ; n++) {
         let s = ordered[n];
         drawPiece(s.type + 6 * s.color, s.col, s.row);
      }
   }
}

