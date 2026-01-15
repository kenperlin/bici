
let drawShadowHand = (ctx, F, x=0, y=0, s=1) => {

   // Behind the scenes, create a separate shadow canvas.

   if (! ctx.shadowCanvas) {
      ctx.shadowCanvas = document.createElement('canvas');
      document.body.appendChild(ctx.shadowCanvas);
      ctx.shadowCanvas.style = '{position:absolute;left:-2000px}';
      ctx.shadowCanvas.width = ctx.canvas.width;
      ctx.shadowCanvas.height = ctx.canvas.height;
   }

   // Clear the shadow canvas before drawing the hand.

   let sctx = ctx.shadowCanvas.getContext('2d');
   let w = ctx.canvas.width, h = ctx.canvas.height;
   sctx.clearRect(0,0,w,h);

   // Scale finger thickness depending on visible hand size.

   let t = 0;
   for (n = 1 ; n <= 20 ; n += 4)     // loop over 5 fingers
   for (let i = 0 ; i < 3 ; i++) {    // loop over 3 finger joints
      let x = F[n+i+1].x - F[n+i].x;
      let y = F[n+i+1].y - F[n+i].y;
      let z = F[n+i+1].z - F[n+i].z;
      t += Math.sqrt(x*x + y*y + z*z);
   }
   let handSize = .017 * s * w * (t < 1 ? Math.sqrt(t) : t);

   // Draw an opaque shadow of the hand to the shadow canvas.

   for (n = 1 ; n <= 20 ; n += 4) {
      let r = handSize * (n < 6 ? 1.1 : n < 11 ? 1 : .85);
      sctx.fillStyle = ctx.strokeStyle = 'black';
      sctx.lineWidth = 2 * r;
      let i0 = n > 1 ? 0 : 1;         // skip first thumb joint
      for (let i = i0 ; i < 4 ; i++) {
         if (i > i0) {
            sctx.beginPath();
            sctx.arc(w*F[n+i].x*s+x,h*F[n+i].y*s+y,r,0,2*Math.PI);
            sctx.fill();
         }
         if (i < 3) {
            sctx.beginPath();
            sctx.moveTo(w*F[n+i  ].x*s+x,h*F[n+i  ].y*s+y);
            sctx.lineTo(w*F[n+i+1].x*s+x,h*F[n+i+1].y*s+y);
            sctx.stroke();
         }
      }
   }

   // Copy the shadow transparently onto the target canvas.

   ctx.globalAlpha = 0.3;
   ctx.drawImage(ctx.shadowCanvas, 0,0);
   ctx.globalAlpha = 1.0;
}
