function Diagram() {
   this.isFullScreen = true;
   let w = screen.width, h = screen.height, dirty = false, nDrags = 0;
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

      // Mouse down on a card to bring it to the front.

      if (mouse.isDown && ! mouse.wasDown) {
         if (card = deck.findCardAt(mouse.x, mouse.y))
            deck.addCard(deck.removeCard(card));
         nDrags = 0;
         dirty = true;
      }

      // Drag on a card to move it.

      if (mouse.isDown && mouse.wasDown) {
         if (card !== undefined) {
	    card.x += mouse.x - mouse.x0;
	    card.y += mouse.y - mouse.y0;
            nDrags++;
            dirty = true;
         }
      }

      // Click on a card to flip it.

      if (! mouse.isDown && mouse.wasDown) {
         if (card && nDrags < 25) {
	    card.up = ! card.up;
            dirty = true;
         }
      }

      mouse.wasDown = mouse.isDown;
      mouse.x0 = mouse.x;
      mouse.y0 = mouse.y;

      if (! dirty)
	 deck.setCards(this.getState());

      deck.drawDeck();

      if (dirty) {
         this.setState(deck.getCards());
         dirty = false;
      }
   }
}

