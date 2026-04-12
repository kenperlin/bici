function Diagram() {
   this.isFullScreen = true;
   let h = screen.height, w = h * 1512 / 982, dirty, card;

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

      switch (mouse.state) {
      case 'press':
         if (card = deck.findCardAt(mouse.x, mouse.y))
            deck.addCard(deck.removeCard(card));
	 dirty = true;
	 break;

      case 'down':
         if (card !== undefined) {
            card.x += mouse.dx;
	    card.y += mouse.dy;
	    dirty = true;
	 }
	 break;

      case 'release':
         if (card !== undefined && mouse.isClick)
	    card.up = ! card.up;
	 dirty = true;
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
