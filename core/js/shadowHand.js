
let shadowHandInfo = [{},{}];

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
   shadowHandInfo[hand].s = .017 * w * t;

   shadowHandInfo[hand].x = w * F[10].x;
   shadowHandInfo[hand].y = h * F[10].y;

   let D = [];
   D[0] = distance(4, 5) / t;
   for (let j = 1 ; j < 5 ; j++)
      D[j] = distance(0, 4*j+3) / t;

   if (hand == 0)
      screenMessage(round(D[0]));

   shadowHandInfo[hand].open = D[1] + D[2] + D[3] + D[4];

   shadowHandInfo[hand].gesture = null;

   if (Math.max(D[1],D[2],D[3],D[4]) < .3)
      shadowHandInfo[hand].gesture = 'fist';

   if (D[0] < .1 && D[1] > .3 && Math.max(D[2],D[3],D[4]) < .3)
      shadowHandInfo[hand].gesture = 'point';

   if (shadowHandInfo[hand].gesture == null && distance(4,8) / shadowHandInfo[hand].s < .002)
      shadowHandInfo[hand].gesture = 'pinch';

   if (shadowHandInfo[hand].gesture == null && D[0] > .1 && distance(4,8) < 1.5 * distance(5,8))
      shadowHandInfo[hand].gesture = 'gripper';

   if (! isDrawing)
      return;

   // If pointing, draw a ray out of the index finger.

   if (shadowHandInfo[hand].gesture == 'point') {
      let ax = s * w * F[5].x + x, ay = s * h * F[5].y + y;
      let bx = s * w * F[8].x + x, by = s * h * F[8].y + y;
      for (let i = 0 ; i <= 1 ; i++) {
         sctx.strokeStyle = i ? 'white' : 'black';
         sctx.lineWidth = s * (21 - 14*i);
         sctx.beginPath();
         sctx.moveTo(bx,by);
         sctx.lineTo(bx+100*(bx-ax),by+100*(by-ay));
         sctx.stroke();
      }
   }

   // Draw an opaque shadow of the hand to the shadow canvas.

   for (n = 1 ; n <= 20 ; n += 4) {
      let r = s * shadowHandInfo[hand].s * (n < 6 ? 1.1 : n < 11 ? 1 : .85);
      sctx.fillStyle = sctx.strokeStyle = 'black';
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

   // If making a gripper gesture, show the line between thumb and index fingers.

   if (shadowHandInfo[hand].gesture == 'gripper') {
      let p = toScreen(F[4], hand);
      let q = toScreen(F[8], hand);
      sctx.strokeStyle = 'white';
      sctx.lineWidth = s * 10;
      sctx.beginPath();
      sctx.moveTo(p.x, p.y);
      sctx.lineTo(q.x, q.y);
      sctx.stroke();
   }

   // If pinching, show pinch point.

   if (shadowHandInfo[hand].gesture == 'pinch') {
      let p = toScreen(F[4], hand);
      let q = toScreen(F[8], hand);
      sctx.beginPath();
      sctx.fillStyle = 'white';
      sctx.arc(p.x+q.x>>1, p.y+q.y>>1, .7*s * shadowHandInfo[hand].s, 0, 2*Math.PI);
      sctx.fill();
   }

   // Copy the shadow transparently onto the target canvas.

   ctx.globalAlpha = 0.3;
   ctx.drawImage(ctx.shadowCanvas, 0,0);
   ctx.globalAlpha = 1.0;
}
