let addDiagramProperties = (diagram, ctx) => {
   let w  = diagram.width ;
   let h  = diagram.height;
   let xp = x => (.5     + x * .5) * w;
   let yp = y => (.5*h/w - y * .5) * w;
   let M = new M4();

   diagram._px   = x => (x / w - .5    ) /  .5;
   diagram._py   = y => (y / w - .5*h/w) / -.5;
   diagram._beforeUpdate = () => {
      M.identity();
      M.perspective(0,0,-10);
   }

   let mxp = a => {
      a = M.transform([a[0],a[1],a[2]??0,1]);
      return [xp(a[0]), yp(a[1])];
   }
   let fill = () => {
      let saveFillStyle = ctx.fillStyle;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
      ctx.fillStyle = saveFillStyle;
   }

   diagram.identity  = ()      => { M.identity()      ; return diagram; }
   diagram.move      = (x,y,z) => { M.translate(x,y,z); return diagram; }
   diagram.pop       = ()      => { M.restore  ()     ; return diagram; }
   diagram.push      = ()      => { M.save     ()     ; return diagram; }
   diagram.scale     = (x,y,z) => { M.scale    (x,y,z); return diagram; }
   diagram.turnX     = a       => { M.rotateX  (a)    ; return diagram; }
   diagram.turnY     = a       => { M.rotateY  (a)    ; return diagram; }
   diagram.turnZ     = a       => { M.rotateZ  (a)    ; return diagram; }
   diagram.getMatrix = () => M.m();

   diagram.lineWidth = lw => { ctx.lineWidth = lw * w/2; return diagram; }
   diagram.drawColor = lc => { ctx.strokeStyle = lc    ; return diagram; }
   diagram.fillColor = fc => { ctx.fillStyle = fc      ; return diagram; }
   diagram.font      = f  => { ctx.font      = f       ; return diagram; }
   diagram.setFont   = (size,face) => {
      ctx.font = (size*w/2) + 'px ' + (face ?? 'Helvetica');
      return diagram;
   }

   diagram.arc = (a,r,t0,t1) => {
      let A = mxp(a);
      ctx.beginPath();
      ctx.arc(A[0], A[1], r*w/2, t0??0, t1??2*Math.PI);
      ctx.stroke();
      return diagram;
   }
   diagram.dot = (a,r) => {
      let A = mxp(a);
      ctx.beginPath();
      ctx.arc(A[0], A[1], (r??.04)*w/2, 0, 2*Math.PI);
      fill();
      return diagram;
   }
   diagram.drawRect = (lo,hi,r) => {
      lo = mxp(lo);
      hi = mxp(hi);
      ctx.beginPath();
      if (r)
         ctx.roundRect(lo[0],lo[1],hi[0]-lo[0],hi[1]-lo[1],r*w/2);
      else {
         ctx.moveTo(lo[0],lo[1]);
         ctx.lineTo(hi[0],lo[1]);
         ctx.lineTo(hi[0],hi[1]);
         ctx.lineTo(lo[0],hi[1]);
         ctx.lineTo(lo[0],lo[1]);
      }
      ctx.stroke();
      return diagram;
   }
   diagram.fillRect = (lo,hi,r) => {
      lo = mxp(lo);
      hi = mxp(hi);
      ctx.beginPath();
      if (r)
         ctx.roundRect(lo[0],lo[1],hi[0]-lo[0],hi[1]-lo[1],r*w/2);
      else {
         ctx.moveTo(lo[0],lo[1]);
         ctx.lineTo(hi[0],lo[1]);
         ctx.lineTo(hi[0],hi[1]);
         ctx.lineTo(lo[0],hi[1]);
      }
      ctx.fill();
      return diagram;
   }
   diagram.fillPolygon = P => {
      ctx.beginPath();
      for (let n = 0 ; n < P.length ; n++) {
         let p = mxp(P[n]);
         ctx[n==0 ? 'moveTo' : 'lineTo'](p[0], p[1]);
      }
      ctx.fill();
      return diagram;
   }
   diagram.path = P => {
      for (let i = 0 ; i < P.length-1 ; i++)
         diagram.line(P[i], P[i+1]);
   }
   diagram.line = (a,b,arrowHead) => {
      let A = mxp(a), B = mxp(b);

      if (arrowHead) {
         let a = Math.abs(arrowHead);
         let dx = B[0]-A[0], dy = B[1]-A[1], ds = Math.sqrt(dx*dx+dy*dy);
         dx *= 10 / ds * a;
         dy *= 10 / ds * a;

	 if (arrowHead < 0) {
	    A[0] += dx;
	    A[1] += dy;
            ctx.beginPath();
            ctx.moveTo(A[0]-dx   , A[1]-dy   );
            ctx.lineTo(A[0]+dx-dy, A[1]+dy+dx);
            ctx.lineTo(A[0]+dx+dy, A[1]+dy-dx);
            fill();
	 }

	 B[0] -= dx;
	 B[1] -= dy;
         ctx.beginPath();
         ctx.moveTo(B[0]+dx   , B[1]+dy   );
         ctx.lineTo(B[0]-dx+dy, B[1]-dy-dx);
         ctx.lineTo(B[0]-dx-dy, B[1]-dy+dx);
         fill();
      }

      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      ctx.stroke();

      return diagram;
   }
   diagram.curve = (n, f) => {
      ctx.beginPath();
      for (let i = 0 ; i <= n ; i++) {
         let A = mxp(f(i/n));
         if (i == 0)
            ctx.moveTo(A[0], A[1]);
         else
            ctx.lineTo(A[0], A[1]);
      }
      ctx.stroke();
   }
   diagram._images = {};
   diagram.image = (image, a, scale) => {
      if (typeof image == 'string')
         if (diagram._images[image] === undefined) {
            diagram._images[image] = null;
            loadImage(image, img => diagram._images[image] = img);
         }
	 else
	    diagram.image(diagram._images[image], a, scale);
      else if (image) {
         let A = mxp(a);
	 let width = scale * w/2;
	 let height = width * image.height / image.width;
	 ctx.drawImage(image, A[0]-width/2, A[1]-height/2, width, height);
      }
   }
   diagram.text = (text, a, justify = .5) => {
      let A = mxp(a);
      let lines = ('' + text).split('\n'), n = lines.length;
      let lh = parseInt(ctx.font);
      let saveFillStyle = ctx.fillStyle;
      ctx.fillStyle = ctx.strokeStyle;
      for (let i = 0 ; i < n ; i++) {
         let dx = ctx.measureText(lines[i]).width * justify;
         ctx.fillText(lines[i], A[0] - dx, A[1] - (i-n/2+.1411) * lh);
      }
      ctx.fillStyle = saveFillStyle;
      return diagram;
   }
   diagram.textBox = (text, a, r, opacity) => {
      let lines = text.split('\n'), n = lines.length;

      let lh = parseInt(ctx.font) * 2.5/w, th = n * lh + lh;

      let lw = [], tw = 0;
      for (let i = 0 ; i < n ; i++)
         lw.push(ctx.measureText(lines[i]).width * 2/w);
      for (let i = 0 ; i < n ; i++)
         tw = Math.max(tw, lw[i]);
      tw += lh;

      r = r ?? lh/2;

      if (opacity && opacity < 1)
         octx.globalAlpha = 0.5;
      diagram.fillRect([ a[0]-tw/2, a[1]-th/2+lh/4 ], [ a[0]+tw/2, a[1]+th/2-lh/16 ], r);
      if (opacity && opacity < 1)
         octx.globalAlpha = 1.0;

      let saveStrokeStyle = ctx.strokeStyle;
      ctx.strokeStyle = 'black';

      let saveLineWidth = ctx.lineWidth;
      ctx.lineWidth = lh*w/40;
      diagram.drawRect([ a[0]-tw/2, a[1]-th/2+lh/4 ], [ a[0]+tw/2, a[1]+th/2-lh/16 ], r);
      ctx.lineWidth = saveLineWidth;;

      for (let i = 0 ; i < n ; i++)
         diagram.text(lines[i], [ a[0], a[1] - (i-n/2+.5) * lh ]);
      ctx.strokeStyle = saveStrokeStyle;

      return diagram;
   }

   return diagram;
}

let overlayDiagram = () => addDiagramProperties({ width: screen.width, height: screen.height }, octx);

