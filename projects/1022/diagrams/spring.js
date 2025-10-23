function Diagram() {
   let spring = new Spring();
   let state = 0, C = [.5,0,0], isDragging;
   let pos = [0,0,0];
   let force = 0;

   this.onDrag = (x,y) => {
      pos = [x,0,0];
      isDragging = true;
   }
   this.onUp   = (x,y) => {
      force = x;
      isDragging = false;
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);

      ctx.fillStyle = '#a0a0a0';
      this.fillRect([-1,-.1],[1,.1]);

      if (! isDragging) {
         spring.setForce(force *= .9);
         spring.update(.03);
	 pos[0] = spring.getPosition();
      }

      ctx.fillStyle = 'red';
      this.dot(pos, 20);
      _.x = pos[0];
   }
}

