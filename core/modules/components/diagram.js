import { centeredText } from '../canvasUtils.js';
import { M4 } from '../M4.js'

export function addDiagramProperties (diagram) {
   let w  = diagram.width  = diagram.width  ?? 500;
   let h  = diagram.height = diagram.height ?? 500;
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
      let saveFillStyle = diagram.ctx.fillStyle;
      diagram.ctx.fillStyle = diagram.ctx.strokeStyle;
      diagram.ctx.fill();
      diagram.ctx.fillStyle = saveFillStyle;
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

   diagram.lineWidth = lw => { diagram.ctx.lineWidth = lw * w/2; return diagram; }
   diagram.drawColor = lc => { diagram.ctx.strokeStyle = lc    ; return diagram; }
   diagram.fillColor = fc => { diagram.ctx.fillStyle = fc      ; return diagram; }
   diagram.font      = f  => { diagram.ctx.font      = f       ; return diagram; }

   diagram.arc = (a,r,t0,t1) => {
      let A = mxp(a);
      diagram.ctx.beginPath();
      diagram.ctx.arc(A[0], A[1], r*w/2, t0??0, t1??2*Math.PI);
      diagram.ctx.stroke();
      return diagram;
   }
   diagram.dot = (a,r) => {
      let A = mxp(a);
      diagram.ctx.beginPath();
      diagram.ctx.arc(A[0], A[1], (r??.04)*w/2, 0, 2*Math.PI);
      fill();
      return diagram;
   }
   diagram.drawRect = (lo,hi) => {
      lo = mxp(lo);
      hi = mxp(hi);
      diagram.ctx.beginPath();
      diagram.ctx.moveTo(lo[0],lo[1]);
      diagram.ctx.lineTo(hi[0],lo[1]);
      diagram.ctx.lineTo(hi[0],hi[1]);
      diagram.ctx.lineTo(lo[0],hi[1]);
      diagram.ctx.lineTo(lo[0],lo[1]);
      diagram.ctx.stroke();
      return diagram;
   }
   diagram.fillRect = (lo,hi) => {
      lo = mxp(lo);
      hi = mxp(hi);
      diagram.ctx.beginPath();
      diagram.ctx.moveTo(lo[0],lo[1]);
      diagram.ctx.lineTo(hi[0],lo[1]);
      diagram.ctx.lineTo(hi[0],hi[1]);
      diagram.ctx.lineTo(lo[0],hi[1]);
      diagram.ctx.fill();
      return diagram;
   }
   diagram.fillPolygon = P => {
      diagram.ctx.beginPath();
      for (let n = 0 ; n < P.length ; n++) {
         let p = mxp(P[n]);
         diagram.ctx[n==0 ? 'moveTo' : 'lineTo'](p[0], p[1]);
      }
      diagram.ctx.fill();
      return diagram;
   }
   diagram.path = P => {
      for (let i = 0 ; i < P.length-1 ; i++)
         diagram.line(P[i], P[i+1]);
   }
   diagram.line = (a,b,arrowHead) => {
      let A = mxp(a), B = mxp(b);

      diagram.ctx.beginPath();
      diagram.ctx.moveTo(A[0], A[1]);
      diagram.ctx.lineTo(B[0], B[1]);
      diagram.ctx.stroke();

      if (arrowHead) {
         let dx = B[0]-A[0], dy = B[1]-A[1], ds = Math.sqrt(dx*dx+dy*dy);
         dx *= 10 / ds * arrowHead;
         dy *= 10 / ds * arrowHead;

         diagram.ctx.beginPath();
         diagram.ctx.moveTo(B[0]+dx*.4  , B[1]+dy*.4  );
         diagram.ctx.lineTo(B[0]-2*dx+dy, B[1]-2*dy-dx);
         diagram.ctx.lineTo(B[0]-2*dx-dy, B[1]-2*dy+dx);
         fill();
      }
      return diagram;
   }
   diagram.curve = (n, f) => {
      diagram.ctx.beginPath();
      for (let i = 0 ; i <= n ; i++) {
         let A = mxp(f(i/n));
         if (i == 0)
            diagram.ctx.moveTo(A[0], A[1]);
         else
            diagram.ctx.lineTo(A[0], A[1]);
      }
      diagram.ctx.stroke();
   }
   diagram.text = (str, a, isLeft) => {
      let A = mxp(a);
      let w = isLeft ? 0 : diagram.ctx.measureText(str).width;

      let saveFillStyle = diagram.ctx.fillStyle;
      diagram.ctx.fillStyle = diagram.ctx.strokeStyle;
      diagram.ctx.fillText(str, A[0] - w/2, A[1] + 10);
      diagram.ctx.fillStyle = saveFillStyle;

      return diagram;
   }
}

export class TextDiagram {
   constructor(lines) {
      this.width = 500;
      this.height = 400;
      this._beforeUpdate = () => {};
      this.ctx = null;
      this.lines = lines;
   }
   
   update() {
      this.ctx.save();
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.font = "40px Helvetica";
      this.ctx.fillStyle = "black";
      for (let n = 0; n < this.lines.length; n++) {
         let line = this.lines[n], i, j;
         if (
            (i = line.indexOf("<font")) >= 0 &&
            (j = line.indexOf(">", i)) >= 0
         ) {
            this.ctx.font = line.substring(i + 6, j);
            line = line.substring(j + 1);
         }
         centeredText(this.ctx, line, 250, 210 + 60 * (n - (this.lines.length - 1) / 2));
      }
      this.ctx.restore();
   };
}
