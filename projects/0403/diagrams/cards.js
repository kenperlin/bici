function Diagram() {
   this.isFullScreen = true;

   if (! window.SS)
      window.SS = '';

   let pack = () => {
      SS = '';
      for (let n = 0 ; n < cards.length ; n++) {
         let card = cards[n];
         SS += toBase64(card.value << 2 | card.suit)
             + toBase64(card.x >> 6)
	     + toBase64(card.x & 63)
             + toBase64(card.y >> 6 | (card.down ? 1<<5 : 0))
	     + toBase64(card.y & 63);
      }
   }

   let unpack = () => {
      cards = [];
      let C = i => fromBase64(SS.charAt(i));
      for (let i = 0 ; i < SS.length ; i += 5) {
         let value =  C(i) >> 2, suit = C(i) & 3,
             x     =  C(i+1)     << 6 | C(i+2),
             y     = (C(i+3)&31) << 6 | C(i+4),
	     down  =  C(i+3)     >> 5;
         cards.push({suit: suit, value: value, x: x, y: y, down: down});
      }
   }


   let cards = [], nDrags = 0, dirty = false;

   let cardsImage = new Image();
   cardsImage.onload = () => {}
   cardsImage.src = 'projects/' + project + '/images/cards.png';

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
      
      if (card.down)
         octx.drawImage(cardsImage, 938,16,46,.85*sh, card.x,card.y,cw,ch);
      else {
         let sx = 8 + card.value * 71;
         let sy = 8 + card.suit * 104.6;
         octx.drawImage(cardsImage, sx, sy, sw, sh, card.x, card.y, cw, ch);
      }

      octx.lineWidth = cw / 50;
      octx.strokeStyle = '#a0a0a0';
      octx.strokeRect(card.x,card.y,cw,ch);

      octx.strokeStyle = '#000000';
      octx.beginPath();
      octx.moveTo(card.x+cw, card.y   );
      octx.lineTo(card.x+cw, card.y+ch);
      octx.lineTo(card.x   , card.y+ch);
      octx.stroke();
      if (isSelected) {
         octx.fillStyle = '#ff000030';
         octx.fillRect(card.x,card.y,cw,ch);
      }
   }

   for (let suit = 0 ; suit < 4 ; suit++)
   for (let value = 0 ; value < 13 ; value++)
      cards.push({ value: value, suit: suit,
                   x: value * cw * .13 + (.005 + suit * .25) * w,
                   y: .7   * h });
   pack();

   this.update = () => {
      let w = screen.width, h = screen.height;

      let mouse = this.input.mouse;

      if (mouse.isDown && ! mouse.wasDown) {
         nc = findCard(mouse.x, mouse.y);
	 if (nc !== undefined) {
	    let card = cards.splice(nc, 1)[0];
	    nDrags = 0;
	    nc = cards.length;
	    cards.push(card);
	 }
	 nDrags = 0;
	 dirty = true;
      }

      if (! mouse.isDown && mouse.wasDown) {
         if (nc !== undefined && nDrags < 12)
	    cards[nc].down = ! cards[nc].down;
         nc = undefined;
	 delete mouse.x0;
	 delete mouse.y0;
	 dirty = true;
      }

      if (nc !== undefined && mouse.x0 !== undefined) {
         cards[nc].x += mouse.x - mouse.x0;
         cards[nc].y += mouse.y - mouse.y0;
	 nDrags++;
	 dirty = true;
      }

      mouse.wasDown = mouse.isDown;
      mouse.x0 = mouse.x;
      mouse.y0 = mouse.y;

      if (! dirty)
         unpack();

      for (let n = 0 ; n < cards.length ; n++)
         drawCard(cards[n], n == nc);

      if (dirty) {
         pack();
         codeArea.setVar('SS', SS);
         if (typeof webrtcClient !== 'undefined' && webrtcClient)
            webrtcClient.sendStateUpdate({ SS: SS });
         dirty = false;
      }
   }
}

