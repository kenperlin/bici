function Diagram() {
   this.isFullScreen = true;
   let w = screen.width, h = screen.height, dirty = false;
   let deck, card;

   this.init = () => {
      deck = new CardDeck();
      deck.shuffleDeck();

      let cards = deck.getCards();
      for (let n = 0 ; n < cards.length ; n++) {
	 cards[n].x = w/20 - n/2;
	 cards[n].y = w/20 - n/4;
      }
      dirty = true;
   }

   this.update = () => {

      let mouse = this.input.mouse;

      switch (mouse.state) {

      // Press on a card to bring it to the front.

      case 'press':
         if (card = deck.findCardAt(mouse.x, mouse.y))
            deck.addCard(deck.removeCard(card));
         dirty = true;
	 break;


      // Drag on a card to move it.

      case 'down':
         if (card !== undefined) {
	    card.x += mouse.dx;
	    card.y += mouse.dy;
            dirty = true;
         }
	 break;

      // Click on a card to flip it.

      case 'release':
         if (card && mouse.isClick) {
	    card.up = ! card.up;
            dirty = true;
         }
	 break;
      }

      if (! dirty)
	 deck.setCards(this.getState());
      else
         this.setState(deck.getCards());
      dirty = false;

      deck.drawDeck();
   }
}

