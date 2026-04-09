function CardDeck() {

   let cards = [], cw = screen.width * .093, ch = cw * 7 / 5;
   const sw = 62, sh = 96;

   let cardsImage = new Image();
   cardsImage.src = 'core/images/cards.png';

   let drawCard = (card, isSelected) => {

      if (! card.up)
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

   this.cw = () => cw;
   this.ch = () => ch;
   this.emptyDeck = () => cards = [];
   this.sortDeck = () => cards.sort((a,b) => a.order - b.order);
   this.cardCount = () => cards.length;
   this.addCard = card => cards.push(card);
   this.getCard = n => cards[n];
   this.getCards = () => cards;
   this.setCards = newCards => cards = newCards;

   this.drawDeck = card => {
      for (let n = 0 ; n < cards.length ; n++)
         drawCard(cards[n], card ? cards[n].value == card.value &&
	                           cards[n].suit == card.suit : false);
   }

   this.findCardAt = (x,y) => {
      for (let n = cards.length - 1 ; n >= 0 ; n--) {
         let card = cards[n];
         if ( card.x <= x && card.x + cw > x &&
	      card.y <= y && card.y + ch > y )
	    return card;
      }
   }

   this.removeCard = card => {
      for (let n = 0 ; n < cards.length ; n++)
         if (cards[n] == card)
	    cards.splice(n--, 1);
   }
}
