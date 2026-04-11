function Diagram() {
   this.isFullScreen = true;
   let h = screen.height, w = h * 1512 / 982, dirty, card, nDrags;

   let deck;

   this.init = () => {
      deck = new CardDeck();
      let cards = deck.getCards();
      for (let n = 0 ; n < 52 ; n++) {
	 cards[n].x = .008 * w + n * deck.cw() * .13 + (n/13>>0) * w/11;
	 cards[n].y = h - 1.5 * deck.ch();
	 cards[n].up = true;
      }
      dirty = true;
   }

   this.update = () => {

      let mouse = this.input.mouse;

      if (mouse.isDown && ! mouse.wasDown) {
         if (card = deck.findCardAt(mouse.x, mouse.y))
            deck.addCard(deck.removeCard(card));
	 nDrags = 0;
	 dirty = true;
      }

      if (mouse.isDown && mouse.wasDown) {
         if (card !== undefined) {
            card.x += mouse.x - mouse.x0;
	    card.y += mouse.y - mouse.y0;
	    nDrags++;
	    dirty = true;
	 }
      }

      if (! mouse.isDown && mouse.wasDown) {
         if (card !== undefined && nDrags < 25)
	    card.up = ! card.up;
	 dirty = true;
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
