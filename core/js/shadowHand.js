
window.zMin =  1000;
window.zMax = -1000;
let drawShadowHand = (ctx, F, x=0, y=0, s=1) => {
   
   let scanvas = ctx.shadowCanvas;
   if (! scanvas) {
      scanvas = document.createElement('canvas');
      document.body.appendChild(scanvas);
      scanvas.style = '{position:absolute;left:-2000px}';
      scanvas.width = ctx.canvas.width;
      scanvas.height = ctx.canvas.height;
      ctx.shadowCanvas = scanvas;
   }
   let sctx = scanvas.getContext('2d');
   let w = scanvas.width, h = scanvas.height;
   sctx.clearRect(0,0,w,h);

   let z = 0;
   for (n = 1 ; n <= 20 ; n++)
      z -= F[n].z;

   let rScale = .017 * s * w * Math.sqrt(z);

   for (n = 1 ; n <= 20 ; n += 4) {
      let r = rScale * (n < 6 ? 1.1 : n < 11 ? 1 : .85);
      sctx.fillStyle = ctx.strokeStyle = 'black';
      sctx.lineWidth = 2 * r;
      let i0 = n > 1 ? 0 : 1;
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
   ctx.globalAlpha = 0.3;
   ctx.drawImage(ctx.shadowCanvas, 0,0);
   ctx.globalAlpha = 1.0;
}
