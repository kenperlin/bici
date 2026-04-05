function Diagram() {
   this.isFullScreen = true;
   let image = new Image();
   image.onload = () => {
      console.log(image.width, image.height);
   }
   image.src = 'projects/' + project + '/images/cards.png';

   let e = 8;
   let sw = 992/14, sh = 104.6;

   this.update = ctx => {
      for (let suit = 0, row = 0 ; suit < 4 ; suit++, row++)
      for (let card = suit, col = 0 ; col < 5 ; card++, col++) {

         let sx = 8 + card * 992 / 14;
         let sy = 8 + suit * 104.6;
         let sw = 64;
         let sh = 98;

	 let dw = 150;
	 let dh = dw * 7 / 5;
	 let dx = screen.width/2 + (col - 3) * (dw + 5);
	 let dy = .6 * screen.height + row * dh/5;

         octx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

         octx.lineWidth = dw / 50;
	 octx.strokeStyle = '#404040';
         octx.strokeRect(dx,dy,dw,dh);
	 octx.strokeStyle = '#000000';
	 octx.beginPath();
	 octx.moveTo(dx+dw,dy);
	 octx.lineTo(dx+dw,dy+dh);
	 octx.lineTo(dx,dy+dh);
	 octx.stroke();
      }
   }
}

