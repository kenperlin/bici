function Diagram() {
   let state = 0, mx = 0, radius = .08;
   this.onDrag = (x,y) => mx = x;
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(8, x > 0 ? state+1 : state-1));
   }

text = `\
Host processor sends updates of display list to wearable
Wearable's camera captures image of real world
Wearable sends camera image to host processor
Host processor computes view left/right matrices via VIO
Host processor sends left/right view matrices to wearable
Wearable does the following final steps:
     Use view matrices to transform display list
     Use wearable's IMU to do final 2D image shift
     Render display list to internal pixel buffer
     Display rendered image with 2D image shift\
`;

   let lines = text.split('\n');

   this.update = ctx => {
      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      this.font('15px Arial');
      for (let n = 0 ; n < lines.length ; n++) {
         let y = .93-.202*n;
         this.text(lines[n], [-.8,y], 1);
         this.lineWidth(.004);
	 this.drawRect([n>=6 ? -.73 : -.81,y-.06],[n>=6 ? .51 : .73,y+.02]);
	 if (n < lines.length-1) {
	    let x = n>=6 ? -.1 : -.3;
            this.lineWidth(.008);
	    this.line([x,y-.06],[x,y-.17],.5);
         }
      }
   }
}

