function Diagram() {
   this.isFullScreen = true;
   let dirty, card;

   let deck;

   this.init = () => {
      deck = new CardDeck(this);
      let cards = deck.getCards();
      for (let n = 0 ; n < 52 ; n++) {
	 cards[n].x = -.99 + n * deck.cw() * .13 + (n/13>>0) * .175;
	 cards[n].y = -2.3 * deck.ch();
	 cards[n].up = true;
      }
      dirty = true;
   }

   this.update = () => {
      let mouse = this.input.mouse;

      switch (mouse.state) {
      case 'press':
         if (card = deck.findCardAt(mouse.pos))
            deck.addCard(deck.removeCard(card));
	 dirty = true;
	 break;

      case 'down':
         if (card !== undefined) {
            card.x += mouse.dpos[0];
	    card.y += mouse.dpos[1];
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
