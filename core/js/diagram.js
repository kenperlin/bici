let addDiagramProperties = (diagram, ctx) => {
   let w  = diagram.width  = diagram.width  ?? D.w;
   let h  = diagram.height = diagram.height ?? D.h;
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

   diagram.move  = (x,y,z) => { M.translate(x,y,z); return diagram; }
   diagram.pop   = ()      => { M.restore  ()     ; return diagram; }
   diagram.push  = ()      => { M.save     ()     ; return diagram; }
   diagram.scale = (x,y,z) => { M.scale    (x,y,z); return diagram; }
   diagram.turnX = a       => { M.rotateX  (a)    ; return diagram; }
   diagram.turnY = a       => { M.rotateY  (a)    ; return diagram; }
   diagram.turnZ = a       => { M.rotateZ  (a)    ; return diagram; }
   diagram.getMatrix = () => M.m();
   diagram.arc = (a,r,t0,t1) => {
      let A = mxp(a);
      ctx.beginPath();
      ctx.arc(A[0], A[1], r*w/2, t0, t1);
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
   diagram.drawRect = (lo,hi) => {
      lo = mxp(lo);
      hi = mxp(hi);
      ctx.beginPath();
      ctx.moveTo(lo[0],lo[1]);
      ctx.lineTo(hi[0],lo[1]);
      ctx.lineTo(hi[0],hi[1]);
      ctx.lineTo(lo[0],hi[1]);
      ctx.lineTo(lo[0],lo[1]);
      ctx.stroke();
      return diagram;
   }
   diagram.fillRect = (lo,hi) => {
      lo = mxp(lo);
      hi = mxp(hi);
      ctx.beginPath();
      ctx.moveTo(lo[0],lo[1]);
      ctx.lineTo(hi[0],lo[1]);
      ctx.lineTo(hi[0],hi[1]);
      ctx.lineTo(lo[0],hi[1]);
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
   diagram.line = (a,b,isArrow) => {
      let A = mxp(a), B = mxp(b);

      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      ctx.stroke();

      if (isArrow) {
         let dx = B[0]-A[0], dy = B[1]-A[1], ds = Math.sqrt(dx*dx+dy*dy);
         dx *= 10 / ds;
         dy *= 10 / ds;

         ctx.beginPath();
         ctx.moveTo(B[0]+dx*.4  , B[1]+dy*.4  );
         ctx.lineTo(B[0]-2*dx+dy, B[1]-2*dy-dx);
         ctx.lineTo(B[0]-2*dx-dy, B[1]-2*dy+dx);
         fill();
      }
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
   diagram.text = (str, a) => {
      let A = mxp(a);
      let w = ctx.measureText(str).width;

      let saveFillStyle = ctx.fillStyle;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(str, A[0] - w/2, A[1] + 10);
      ctx.fillStyle = saveFillStyle;

      return diagram;
   }
}
