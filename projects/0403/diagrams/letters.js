function Diagram() {
   this.isFullScreen = true;
   let h = screen.height, w = h * 1512 / 982, dirty, tile, nDrags;
   let r = w / 55;

   let tiles;

   let X = col => .24 * w + w * col / 27.5 >> 0;
   let Y = row => .88 * h - w * (row + 1) / 27.5 >> 0;
   let C = x => (x - .24 * w) * 27.5 / w + .5 >> 0;
   let R = y => (.88 * h - y) * 27.5 / w - .5 >> 0;

   this.init = () => {
      tiles = [];
      for (let n = 0 ; n < 26 ; n++)
         tiles.push({ value: n, x: X((n%13)+1), y: Y(-1-(n/13>>0)), inRack: true });
      dirty = true;
   }

   this.update = () => {

      let mouse = this.input.mouse;

      if (mouse.isDown && ! mouse.wasDown) {
         tile = undefined;
         for (let n = 0 ; n < tiles.length ; n++) {
	    let value = tiles[n].value, x = tiles[n].x, y = tiles[n].y;
	    if ( mouse.x >= x-r && mouse.x < x+r &&
	         mouse.y >= y-r && mouse.y < y+r ) {
               if (tiles[n].inRack)
	          tiles.push(tile = { value: n, x: x, y: y });
	       else
	          tile = tiles[n];
               tile.xDown = x;
               tile.yDown = y;
            }
         }
	 nDrags = 0;
	 dirty = true;
      }

      if (mouse.isDown && mouse.wasDown) {
         if (tile !== undefined) {
            tile.x += mouse.x - mouse.x0;
	    tile.y += mouse.y - mouse.y0;
	    nDrags++;
	    dirty = true;
	 }
      }

      let removeTile = tile => {
	 for (let n = 26 ; n < tiles.length ; n++)
	    if (tiles[n] == tile)
	       tiles.splice(n, 1);
      }

      if (! mouse.isDown && mouse.wasDown) {
         if (tile !== undefined && nDrags < 25)
	    removeTile(tile);

         if (tile !== undefined && nDrags >= 25) {
	    let col = C(tile.x);
	    let row = R(tile.y);
	    if (col < 0 || col > 14 || row < 0 || row > 14)
	       removeTile(tile);
            else {
	       let isOccupied = false;
	       for (let n = 26 ; n < tiles.length ; n++)
	          if (tiles[n] != tile && C(tiles[n].x) == col && R(tiles[n].y) == row) {
		     isOccupied = true;
		     break;
	          }
               if (isOccupied && ! tile.onGrid)
	          removeTile(tile);
               else {
	          tile.onGrid = true;
	          tile.x = isOccupied ? tile.xDown : X(col);
	          tile.y = isOccupied ? tile.yDown : Y(row);
               }
            }
	 }
	    
	 dirty = true;
      }

      mouse.wasDown = mouse.isDown;
      mouse.x0 = mouse.x;
      mouse.y0 = mouse.y;

      if (! dirty)
	 tiles = this.getState();

      let drawTile = (value,x,y) => {
         octx.fillStyle = '#00000040';
         octx.beginPath();
         octx.roundRect(x - r, y - r, 2 * r, 2 * r, r/3, r/3);
         octx.fill();

         octx.fillStyle = '#ffc08050';
         octx.beginPath();
	 let s = .9 * r;
         octx.roundRect(x - s, y - s, 2 * s, 2 * s, s/3, s/3);
         octx.fill();

         octx.fillStyle = '#000000';
         let c = String.fromCharCode(65 + value);
         octx.fillText(c, x - octx.measureText(c).width/2, y + .5 * r);
      }

      octx.font = (w/40 >> 0) + 'px Helvetica';
      for (let n = 0 ; n < tiles.length ; n++) {
         let value = tiles[n].value, x = tiles[n].x, y = tiles[n].y;
	 drawTile(value, x, y);
      }

      for (let i = -.5 ; i <= 14.5 ; i++) {
          octx.strokeRect(X(i),Y(14.5),1,Y(-.5)-Y(14.5));
          octx.strokeRect(X(14.5),Y(i),X(-.5)-X(14.5),1);
      }

      if (dirty) {
         this.setState(tiles);
         dirty = false;
      }
   }
}
