function Diagram() {
   this.isFullScreen = true;
   let dirty = false, deck, card;

   this.init = () => {
      deck = new CardDeck(this);
      deck.shuffleDeck();

      let cards = deck.getCards();
      for (let n = 0 ; n < cards.length ; n++) {
	 cards[n].x = -.95 - .0005 * n;
	 cards[n].y =  .32 + .0003 * n;
      }
      dirty = true;
   }

   this.update = () => {

      let mouse = this.input.mouse;

      switch (mouse.state) {

      // Press on a card to bring it to the front.

      case 'press':
         if (card = deck.findCardAt(mouse.pos))
            deck.addCard(deck.removeCard(card));
         dirty = true;
	 break;


      // Drag on a card to move it.

      case 'down':
         if (card !== undefined) {
	    card.x += mouse.dpos[0];
	    card.y += mouse.dpos[1];
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

