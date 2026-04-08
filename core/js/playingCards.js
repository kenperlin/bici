function PlayingCards() {

   let cards = [], cw = screen.width * .093, ch = cw * 7 / 5;
   const sw = 62, sh = 96;

   let cardsImage = new Image();
   cardsImage.src = 'core/images/cards.png';

   let drawCard = (card, isSelected) => {
      
      if (card.down)
         octx.drawImage(cardsImage, 937.75,16,46,.845*sh,
	                            card.x, card.y, cw, ch);
      else {
         let sx = 8 + card.value * 71;
         let sy = 8 + card.suit * 104.6;
         octx.drawImage(cardsImage, sx, sy, sw, sh,
	                            card.x, card.y, cw, ch);
      }

      octx.lineWidth = this.cw / 50;
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

   if (! window.SS)
      window.SS = '';

   this.cw = () => cw;
   this.ch = () => ch;

   this.packDeck = () => {
      SS = '';
      for (let n = 0 ; n < cards.length ; n++) {
         let card = cards[n];
	 let x = card.x * 1024 / screen.width;
	 let y = card.y * 1024 / screen.width;
         SS += toBase64(card.value << 2 | card.suit)
             + toBase64(x >> 6)
	     + toBase64(x & 63)
             + toBase64(y >> 6 | (card.down ? 1<<5 : 0))
	     + toBase64(y & 63);
      }
   }

   this.unpackDeck = () => {
      cards = [];
      let C = i => fromBase64(SS.charAt(i));
      for (let i = 0 ; i < SS.length ; i += 5) {
         let value =  C(i) >> 2, suit = C(i) & 3,
             x     =  C(i+1)     << 6 | C(i+2),
             y     = (C(i+3)&31) << 6 | C(i+4),
	     down  =  C(i+3)     >> 5;
         x = x * screen.width / 1024;
         y = y * screen.width / 1024;
         cards.push({suit: suit, value: value, x: x, y: y, down: down});
      }
   }

   this.emptyDeck = () => cards = [];

   this.cardCount = () => cards.length;

   this.drawDeck = c => {
      for (let n = 0 ; n < cards.length ; n++)
         drawCard(cards[n], n == c);
   }

   this.findCardAt = (x,y) => {
      for (let n = cards.length - 1 ; n >= 0 ; n--) {
         let card = cards[n];
         if ( card.x <= x && card.x + cw > x &&
	      card.y <= y && card.y + ch > y )
	    return n;
      }
   }

   this.addCard = (value, suit, x, y, down) => {
      cards.push({ value: value, suit: suit, down: down, x: x, y: y });
      return cards.length - 1;
   }

   this.moveCardToTop = c => {
      cards.push(cards.splice(c, 1)[0]);
      return cards.length - 1;
   }

   this.flipCard = c => cards[c].down = ! cards[c].down;

   this.isCardUp = c => ! cards[c].down;

   this.moveCardBy = (c, dx, dy) => {
      cards[c].x += dx;
      cards[c].y += dy;
   }

   this.moveCardTo = (c, x, y) => {
      cards[c].x = x;
      cards[c].y = y;
   }
}
