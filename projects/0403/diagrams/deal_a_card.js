function Diagram() {
   this.isFullScreen = true;
   let w = screen.width, h = screen.height, dirty = false, nDrags = 0;

   let deck = new PlayingCards();

   let card = [];
   for (let n = 0 ; n < 52 ; n++)
      card.push({value: n%13, suit: n/13>>0, s: Math.random()});
   card.sort((a,b) => a.s - b.s);

   this.init = () => {
      deck.emptyDeck();
      deck.addCard(13, 0, w/10, h/2, true);
      deck.packDeck();
   }

   let nc;

   this.update = () => {

      let mouse = this.input.mouse;

      // Mouse down

      if (mouse.isDown && ! mouse.wasDown) {
         nc = deck.findCardAt(mouse.x, mouse.y);
         nDrags = 0;
      }

      // Mouse drag

      if (mouse.isDown && mouse.wasDown) {

         // Drag on a card to move it.

         if (nc !== undefined) {
            deck.moveCardBy(nc, mouse.x - mouse.x0, mouse.y - mouse.y0);
            nDrags++;
            dirty = true;
         }
      }

      // Mouse up

      if (! mouse.isDown && mouse.wasDown) {

         // Click on the down card to deal a new card.

         if (nDrags < 25 && nc == 0) {
            let n = deck.cardCount();
            let x = w/10 + (1 + .14 * n) * deck.cw(), y = h/2;
            deck.addCard(card[n].value, card[n].suit, x, y);
            dirty = true;
         }

	 // Click on an up card to remove it and put it at the end of the deck.

         if (nDrags < 25 && nc > 0) {
            deck.removeCard(card[nc].value, card[nc].suit);
            card.push(card.splice(nc, 1)[0]);
            dirty = true;
         }
      }

      mouse.wasDown = mouse.isDown;
      mouse.x0 = mouse.x;
      mouse.y0 = mouse.y;

      if (! dirty)
         deck.unpackDeck();

      deck.drawDeck();

      if (dirty) {
         deck.packDeck();
         if (typeof webrtcClient !== 'undefined' && webrtcClient)
            webrtcClient.sendStateUpdate({ SS: SS });
         dirty = false;
      }
   }
}

