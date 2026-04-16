function CardDeck(diagram) {

   let cw = .19, ch = cw * 7 / 5;

   let cards = [];
   for (let n = 0 ; n < 52 ; n++)
      cards.push({ value: n % 13, suit: n/13 >> 0 });

   let cardsImage = new Image();
   cardsImage.src = 'core/images/cards.png';

   let drawCard = (card, isSelected) => {

      if (! card.up)
         diagram.drawImage(cardsImage, 937.75,16,46,81, card.x,card.y,cw,ch);
      else {
         let sx = 8 + card.value * 71;
         let sy = 8 + card.suit * 104.6;
         diagram.drawImage(cardsImage, sx,sy,62,96,  card.x,card.y,cw,ch);
      }

      diagram.lineWidth = cw / 50;
      diagram.drawColor('#a0a0a0');
      diagram.drawRect([card.x,card.y],[card.x+cw,card.y+ch]);

      diagram.drawColor('#000000');
      diagram.line([card.x,card.y+ch],[card.x+cw,card.y+ch]);
      diagram.line([card.x+cw,card.y+ch],[card.x+cw,card.y]);
      if (isSelected) {
         diagram.fillColor('#ff000030');
         diagram.fillRect([card.x,card.y],[card.x+cw,card.y+ch]);
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

   this.shuffleDeck = () => {
      for (let n = 0 ; n < cards.length ; n++)
         cards[n].order = Math.random();
      cards.sort((a,b) => a.order - b.order);
      for (let n = 0 ; n < cards.length ; n++)
         delete cards[n].order;
   }

   this.drawDeck = card => {
      for (let n = 0 ; n < cards.length ; n++) {
         console.log(n, cards[n]);
         drawCard(cards[n], card ? cards[n].value == card.value &&
	                           cards[n].suit == card.suit : false);
      }
   }

   this.findCardAt = pos => {
      for (let n = cards.length - 1 ; n >= 0 ; n--) {
         let card = cards[n];
         if ( card.x <= pos[0] && card.x + cw > pos[0] &&
	      card.y <= pos[1] && card.y + ch > pos[1] )
	    return card;
      }
   }

   this.removeCard = card => {
      for (let n = 0 ; n < cards.length ; n++)
         if (cards[n] == card)
	    cards.splice(n--, 1);
      return card;
   }
}
