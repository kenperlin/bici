function Diagram() {
   this.isFullScreen = true;
   let w = screen.width, h = screen.height, dirty = false, nDrags = 0;
   let deck = new CardDeck(), card;

   this.init = () => {
      deck.emptyDeck();
      for (let n = 0 ; n < 52 ; n++)
         deck.addCard({
	    value: n % 13,
	    suit : n/13 >> 0,
	    up   : false,
	    order: Math.random(),
         });
      deck.sortDeck();
      for (let n = 0 ; n < 52 ; n++) {
         let card = deck.getCard(n);
	 card.x = w/20 - n/2;
	 card.y = w/20 - n/4;
      }
      window.SS = deck;
   }

   this.update = () => {

      let mouse = this.input.mouse;

      // Mouse down on a card to bring it to the front.

      if (mouse.isDown && ! mouse.wasDown) {
         if (card = deck.findCardAt(mouse.x, mouse.y)) {
            deck.removeCard(card);
            deck.addCard(card);
         }
         nDrags = 0;
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
	 deck = SS;

      deck.drawDeck();

      if (dirty) {
	 SS = deck;
         if (typeof webrtcClient !== 'undefined' && webrtcClient)
            webrtcClient.sendStateUpdate({ SS: SS });
         dirty = false;
      }
   }
}

