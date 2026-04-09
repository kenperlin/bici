function Diagram() {
   this.isFullScreen = true;
   let w = screen.width, h = screen.height, dirty = false, nc, nDrag = 0;

   let deck = new PlayingCards();

   this.init = () => {
      deck.emptyDeck();
      for (let suit = 0 ; suit < 4 ; suit++)
      for (let value = 0 ; value < 13 ; value++)
         deck.addCard(value, suit, value * deck.cw() * .13 + (.005 + suit/4) * w, .7 * h);
      deck.packDeck();
   }

   this.update = () => {

      let mouse = this.input.mouse;

      if (mouse.isDown && ! mouse.wasDown) {
         nc = deck.findCardAt(mouse.x, mouse.y);
	 if (nc !== undefined) {
	    nc = deck.moveCardToTop(nc);
            nDrags = 0;
	 }
	 nDrags = 0;
	 dirty = true;
      }

      if (! mouse.isDown && mouse.wasDown) {
         if (nc !== undefined && nDrags < 12)
	    deck.flipCard(nc);
         nc = undefined;
	 delete mouse.x0;
	 delete mouse.y0;
	 dirty = true;
      }

      if (nc !== undefined && mouse.x0 !== undefined) {
         deck.moveCardBy(nc, mouse.x - mouse.x0, mouse.y - mouse.y0);
	 nDrags++;
	 dirty = true;
      }

      mouse.wasDown = mouse.isDown;
      mouse.x0 = mouse.x;
      mouse.y0 = mouse.y;

      if (! dirty)
         deck.unpackDeck();

      deck.drawDeck(nc);

      if (dirty) {
         deck.packDeck();
         if (typeof webrtcClient !== 'undefined' && webrtcClient)
            webrtcClient.sendStateUpdate({ SS: SS });
         dirty = false;
      }
   }
}

