function Diagram() {
   this.isFullScreen = true;

   let r = .95 * screen.height / screen.width / 8.5, e = r / 5;

   let dirty, tile, tiles;
   
   let X = col => r * (col - 7);
   let Y = row => r * (row - 6);
   let C = x => x / r + 7.5 >> 0;
   let R = y => y / r + 6.5 - (y / r + 6.5 < 0 ? 1 : 0) >> 0;

   this.init = () => {
      tiles = [];
      for (let n = 0 ; n < 26 ; n++)
         tiles.push({ value: n, x: X((n%13)+1), y: Y(-1-(n/13>>0)), inRack: true });
      dirty = true;
   }

   let removeTile = tile => {
      for (let n = 26 ; n < tiles.length ; n++)
         if (tiles[n] == tile)
            tiles.splice(n, 1);
   }

   this.update = () => {

      // RESPOND TO MOUSE INPUT

      let mouse = this.input.mouse;

      switch (mouse.state) {
      case 'press':
         tile = undefined;
         for (let n = 0 ; n < tiles.length ; n++) {
	    let value = tiles[n].value, x = tiles[n].x, y = tiles[n].y;
	    if ( mouse.pos[0] >= x-r/2 && mouse.pos[0] < x+r/2 &&
	         mouse.pos[1] >= y-r/2 && mouse.pos[1] < y+r/2 ) {
               if (tiles[n].inRack)
	          tiles.push(tile = { value: n, x: x, y: y });
	       else
	          tile = tiles[n];
               tile.xDown = x;
               tile.yDown = y;
	       break;
            }
         }
	 dirty = true;

      case 'down':
         if (tile !== undefined) {
            tile.x += mouse.dpos[0];
	    tile.y += mouse.dpos[1];
	    dirty = true;
	 }
	 break;

      case 'release':
         if (tile !== undefined) {

	    if (mouse.isClick) {
	       removeTile(tile);
	       dirty = true;
	       break;
            }

	    let col = C(mouse.pos[0]);
	    let row = R(mouse.pos[1]);
	    if (col < 0 || col > 14 || row < 0 || row > 14)
	       removeTile(tile);
            else {
	       let isEmptySquare = true;
	       for (let n = 26 ; n < tiles.length ; n++)
	          if (tiles[n] != tile && C(tiles[n].x) == col && R(tiles[n].y) == row) {
		     isEmptySquare = false;
		     break;
	          }
               if (! isEmptySquare && ! tile.onGrid)
	          removeTile(tile);
               else {
	          tile.onGrid = true;
	          tile.x = isEmptySquare ? X(col) : tile.xDown;
	          tile.y = isEmptySquare ? Y(row) : tile.yDown;
               }
            }
	    dirty = true;
	 }
	 break;
      }

      // UPDATE SHARED STATE

      if (! dirty)
	 tiles = this.getState(); // IF NO CHANGES, GET SHARED STATE
      else
         this.setState(tiles);    // IF ANY CHANGE, SET SHARED STATE
      dirty = false;

      // DRAW THE BOARD AND TILES

      this.fillColor('#000000');
      for (let n = -7.5 ; n <= 7.5 ; n++) {
         let x = r * n;
         let y = r * (n+1);
         this.fillRect([x-.0005,-r*6.5],[x+.0005,r*8.5]);
         this.fillRect([-r*7.5,y-.0005],[r*7.5,y+.0005]);
      }
      this.setFont(.8*r);
      for (let n = 0 ; n < tiles.length ; n++) {
	 let x = tiles[n].x-r/2, y = tiles[n].y-r/2, c = String.fromCharCode(65 + tiles[n].value);
         this.fillColor('#00000040').fillRect([x,y],[x+r,y+r],e);
         this.fillColor('#ffc08040').fillRect([x+e/3,y+e/3],[x+r-e/3,y+r-e/3],e/2);
         this.drawColor('#000000'  ).text(c, [x+.5*r,y+.5*r]);
      }
   }
}
