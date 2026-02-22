function Scene() {
   let round = t => (1000 * t >> 0) / 1000;
   this.update = () => {
      octx.fillStyle = 'black';
      if (window.handPose) {
	 let x = 100;
	 for (let hand = 0 ; hand < 2 ; hand++) {
            let data = handPose.getData(hand);
            octx.font = '30px Courier';
	    let line = 0;
	    let hy = 100 + 200 * hand;
	    octx.fillText(hand==0 ? 'RIGHT' : 'LEFT', x, hy);
	    for (let key in data) {
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
