function Diagram() {
   this.isFullScreen = true;
   let ctx, w, h;
   let cards = [];

   let image = new Image();
   image.onload = () => {}
   image.src = 'projects/' + project + '/images/cards.png';

   let sw = 62, sh = 96, cw = 140, ch = cw * 7 / 5;
   let nc;

   let findCard = (x,y) => {
      for (let n = cards.length - 1 ; n >= 0 ; n--) {
         let card = cards[n];
         if (card.x <= x && card.x + cw > x && card.y <= y && card.y + ch > y)
	    return n;
      }
   }

   let drawCard = (card, isSelected) => {
      
      let sx = 8 + (card.down ? 13 : card.value) * 71;
      let sy = 8 + card.suit * 104.6;
      ctx.drawImage(image, sx, sy, sw, sh, card.x, card.y, cw, ch);

      ctx.lineWidth = cw / 50;
      ctx.strokeStyle = '#a0a0a0';
      ctx.strokeRect(card.x,card.y,cw,ch);

      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(card.x+cw, card.y   );
      ctx.lineTo(card.x+cw, card.y+ch);
      ctx.lineTo(card.x   , card.y+ch);
      ctx.stroke();
      if (isSelected) {
         ctx.fillStyle = '#ff000030';
         ctx.fillRect(card.x,card.y,cw,ch);
      }
   }
/*
   for (let suit = 0, row = 0 ; suit < 4 ; suit++, row++)
   for (let value = 2.7 * suit, col = 0 ; col < 5 ; value++, col++)
      cards.push({ value : value>>0,
                   suit  : suit,
                   x     : .5 * w + (0*row/7 + col - 3) * (cw + 5),
                   y     : .5 * h + row * ch / 6 });
*/
   for (let suit = 0 ; suit < 4 ; suit++)
   for (let value = 0 ; value < 13 ; value++)
      cards.push({ value: value, suit: suit,
                   x: value * cw * .13 + (.005 + suit * .25) * w,
                   y: .7   * h });

   this.update = () => {
      if (! octx.overlay) { 
         octx.overlay = document.createElement('canvas');
         document.body.appendChild(octx.overlay);
         octx.overlay.style = '{position:absolute;left:-2000px}';
         octx.overlay.width = screen.width;
         octx.overlay.height = screen.height;
      }     
      ctx = octx.overlay.getContext('2d');
      w = octx.overlay.width;
      h = octx.overlay.height;
      ctx.clearRect(0,0,w,h);

      let mouse = this.input.mouse;

      if (mouse.isDown && ! mouse.wasDown) {
         nc = findCard(mouse.x, mouse.y);
	 if (nc !== undefined) {
	    card = cards.splice(nc, 1)[0];
	    card.nMoves = 0;
	    nc = cards.length;
	    cards.push(card);
	 }
      }

      if (! mouse.isDown && mouse.wasDown) {
         if (nc !== undefined) {
	    if (cards[nc].nMoves < 12)
	       cards[nc].down = ! cards[nc].down;
	    cards[nc].nMoves = 0;
         }
         nc = undefined;
	 delete mouse.x0;
	 delete mouse.y0;
      }

      if (nc !== undefined && mouse.x0 !== undefined) {
         cards[nc].x += mouse.x - mouse.x0;
         cards[nc].y += mouse.y - mouse.y0;
	 cards[nc].nMoves++;
      }

      mouse.wasDown = mouse.isDown;
      mouse.x0 = mouse.x;
      mouse.y0 = mouse.y;

      for (let n = 0 ; n < cards.length ; n++)
         drawCard(cards[n], n == nc);

      //octx.globalAlpha = 0.3;
      octx.drawImage(octx.overlay, 0,0); 
      //octx.globalAlpha = 1.0; 
   }
}

