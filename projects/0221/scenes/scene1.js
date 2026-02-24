function Scene() {
   this.update = () => {
      if (window.handPose) {
         octx.fillStyle = '#0080ff';
         octx.font = '30px Courier';
	 let x = 100;
	 for (let hand = 0 ; hand < 2 ; hand++) {
            let data = handPose.getData(hand);
	    if (data.hand) {
	       let line = 0;
	       let hy = 100 + 250 * hand;
	       octx.fillText(data.hand.toUpperCase(), x, hy);
	       for (let key in data) {
	          if (key != 'hand') {
	             let y = hy + 60 + 30 * line;
                     octx.fillText(key, x, y);
	             let v = data[key];
	             if (Array.isArray(v))
	                for (let i = 0 ; i < v.length ; i++)
	                   octx.fillText(round(v[i]), x + 150 + 150 * i, y);
                     else
	                octx.fillText(round(v), x + 150, y);
	             line++;
	          }
	       }
	    }
	 }
      }
   }
}
