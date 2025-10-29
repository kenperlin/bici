function Diagram() {
   let x0 = width() / 3;
   let mx = -1, my = -1;
   this.onMove = (x,y) => {
      mx = .5 * x + .5;
      my = .5 * y + .5;
   }
   this.update = ctx => {
      let mb = r => {
         r = Math.abs(r);
         return r < 1/3 ? 1 - 3*r*r : r < 1 ? 1.5*(1-r)*(1-r) : 0;
      }
      let x2f = x => x / s;
      let f2y = f => y0 - s * f;

      let w = 500, h = 500;
      let epsilon = 0.1;
      let s = w / 4, y0 = h*3/8, dx = w / 60;
      let x1 = w/2;
      let ms = x => mb(x2f(x - x0)) + mb(x2f(x - x1));

      let isMouseOverFigure = false;
      if ( mx >= 0.05 * w && mx <= 0.95 * w &&
           my >= 0.05 * h && my <= 0.95 * h) {
         x0 = mx;
         isMouseOverFigure = true;
      }

      for (let x = 0 ; x < w ; x += dx) {
         let f00 = x2f(x - x0);
         let f10 = x2f(x - x1);
         let f01 = x2f(x - x0 + dx);
         let f11 = x2f(x - x1 + dx);
         let m00 = mb(f00);
         let m10 = mb(f10);
         let m01 = mb(f01);
         let m11 = mb(f11);

         ctx.strokeStyle = 'black';
         this.line([x   , f2y(m00 + m10)],
                   [x+dx, f2y(m01 + m11)]);

         if (isMouseOverFigure) {
            ctx.strokeStyle = '#a0a0a0';
            this.line([x, f2y(m00)], [x+dx, f2y(m01)]);
            this.line([x, f2y(m10)], [x+dx, f2y(m11)]);
         }
      }

      if (isMouseOverFigure) {
         ctx.strokeStyle = '#008080';
         this.line([0, f2y(0.1)], [w, f2y(0.1)]);
      }

      y0 = 3*h/4;
      let xx, yy, rr0;
      let r = 0.21*w;

      let xLo = Math.min(x0-r, x1-r);
      let xHi = Math.max(x0+r, x1+r);

      let xy2rr = (x, y) => x2f(x) * x2f(x) + x2f(y) * x2f(y);

      for (let x = xLo ; x < xHi ; x += dx)
      for (let y = y0-r ; y < y0+r ; y += dx) {

         let rr0 = xy2rr(x - x0, y - y0);
         let rr1 = xy2rr(x - x1, y - y0);

         if (rr0 > 1 && rr1 > 1)
            continue;

         let sum = mb(Math.sqrt(rr0)) + mb(Math.sqrt(rr1));

         if (sum > 0) {

            let d = sum < 1.5 * epsilon ? dx / 4 : dx;

            for (let xx = x ; xx < x + dx ; xx += d)
            for (let yy = y ; yy < y + dx ; yy += d) {

               if (xx > x || yy > y) {
                  rr0 = xy2rr(xx - x0, yy - y0);
                  rr1 = xy2rr(xx - x1, yy - y0);
                  sum = mb(Math.sqrt(rr0)) + mb(Math.sqrt(rr1));
               }

               if (sum >= epsilon) {
                  let c = sum;
                  c = 1 - c / 2;
                  c = c * c;
                  c = 1 - .8 * c;
                  c = Math.min(255, Math.floor(255 * c));
                  color(0,c,c);
                  fillRect(xx,yy,d,d);
                  if (d < dx)
                     drawRect(xx,yy,d,d);
               }
            }
         }
      }
   }
}

