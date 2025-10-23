function Diagram() {
   let state = 0, C = [.5,0,0], isDragging;
   this.onDrag = (x,y) => { C = [x,y,0]; isDragging = true; }
   this.onUp   = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(1, state + Math.sign(x)));
      isDragging = false;
   }
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = 'black';

      let D = state == 0 ? [0,.2,0] : [0,-.2,0];
      let A = [-.5,0,0];
      let B = ik(A, .8, .6, C, D);

      this.dot(A);
      this.text('A', [A[0]-.1,A[1],0]);

      ctx.lineWidth = 5;
      this.line(A,B);
      this.text('a', add(mix(A,B,.5),[0,-.1,0]));
      this.line(B,C);
      this.text('b', add(mix(B,C,.5),[0,-.1,0]));

      this.dot(C);
      this.text('C', [C[0]+.1,C[1],0]);
      ctx.strokeStyle = 'white';
      this.dot(C,.02);

      ctx.strokeStyle = '#0080ff';
      this.dot(B);
      this.text('B', [B[0],B[1]+(state?.1:-.1),0]);
      this.line(B, add(B,D), 1);
      if (isDragging) {
         ctx.lineWidth = 2;
         this.arc(A, .8, 0, 2*Math.PI);
         this.arc(C, .6, 0, 2*Math.PI);
      }
   }
}

