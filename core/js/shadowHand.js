
let shadowHandSize = [0,0];

let drawShadowHand = (ctx, hand, F, x=0, y=0, s=1, isDrawing=true) => {

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

   // Function to measure distance between two hand joints

   let distance = (i,j) => {
      let x = F[i].x - F[j].x;
      let y = F[i].y - F[j].y;
      let z = F[i].z - F[j].z;
      return Math.sqrt(x*x + y*y + z*z);
   }

   // Scale finger thickness depending on visible hand size.

   let t = 0;
   for (let n = 1 ; n <= 20 ; n += 4) // loop over 5 fingers
   for (let i = 0 ; i < 3 ; i++)      // loop over 3 finger joints
      t += distance(n+i, n+i+1);
   t = t < 1 ? Math.sqrt(t) : t;
   shadowHandSize[hand] = .017 * w * t;

   let D = [];
   for (let j = 0 ; j < 5 ; j++)
      D[j] = distance(0, 4*j+3) / t;

   if (! isDrawing)
      return D[1] + D[2] + D[3] + D[4];

   // Draw an opaque shadow of the hand to the shadow canvas.

   for (n = 1 ; n <= 20 ; n += 4) {
      let r = s * shadowHandSize[hand] * (n < 6 ? 1.1 : n < 11 ? 1 : .85);
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

   return D[1] + D[2] + D[3] + D[4];
}
