function Diagram() {
   this.isFullScreen = true;

   let w = screen.width, h = screen.height;
   let deck = new PlayingCards();
   let dirty = false;

   let id = [];
   for (let n = 0 ; n < 52 ; n++)
      id.push({value: n%13, suit: n/13>>0, s: Math.random()});
   id.sort((a,b) => a.s - b.s);

   this.init = () => {
      deck.emptyDeck();
      deck.addCard(13, 0, w/10, h/2, true);
      deck.packDeck();
   }

   let nc;

   this.update = () => {

      let mouse = this.input.mouse;

      if (mouse.isDown && ! mouse.wasDown) {
         nc = deck.findCardAt(mouse.x, mouse.y);
      }

      if (mouse.isDown && mouse.wasDown) {
         if (nc !== undefined && nc > 0) {
	    deck.moveCardBy(nc, mouse.x - mouse.x0, mouse.y - mouse.y0);
	    dirty = true;
         }
      }

      if (! mouse.isDown && mouse.wasDown) {
         if (nc == 0) {
            let n = deck.cardCount();
            let x = w/10 + (1 + .14 * n) * deck.cw(), y = h/2;
            deck.addCard(id[n].value, id[n].suit, x, y);
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

