function HandTyping(scene) {

   let text = '';

   let I, J;
   scene.onUp = (x,y) => {
      text += 'X';
   }

   scene.update = () => {
      if (tracking_isLarge) {
         tracking_isSteadyEnabled = false;
         let w = screen.width, h = screen.height;
         octx.strokeStyle = '#00000020';
         octx.fillStyle = '#00000020';
         octx.lineWidth = 8;
         octx.fillStyle = '#00000020';
         for (let j = 0 ; j < 3 ; j++)
         for (let i = 0 ; i < 3 ; i++) {
            let x = w/2 + h/3 * (i - 1);
            let y = h - h/3 * (j + .5);
            octx.strokeRect(x - h/6, y - h/6, h/3, h/3);
	    if ( headX >= x - h/6 && headX < x + h/6 &&
	         headY >= y - h/6 && headY < y + h/6 ) {
               octx.fillRect(x - h/6, y - h/6, h/3, h/3);
	       I = i;
	       J = j;
            }
         }
         octx.font = '30px Helvetica';
         octx.fillStyle = 'black';
         centeredText(octx, text, w/2, 50);
      }
   }
}

