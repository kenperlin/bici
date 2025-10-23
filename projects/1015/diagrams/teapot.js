function Diagram() {
   let I = -1; 

   _.theta = .1;
   _.phi = .1;

   let M = [ [-1,3,-3,1],[3,-6,3,0],[-3,3,0,0],[1,0,0,0] ];
   let T = (a,t) => a[0]*t*t*t + a[1]*t*t + a[2]*t + a[3];
   let Vi = (V,i,t) => V[i] * T(M[i],t);
   let C = (V,t) => Vi(V,0,t) + Vi(V,1,t) + Vi(V,2,t) + Vi(V,3,t);

   let state = 0, showGrid = false, xPrev = 0, yPrev = 0;
   this.onDown = (x,y) => {
      showGrid = x < -.8 && y < -.8;
      xPrev = x;
      yPrev = y;
   }
   this.onDrag = (x,y) => {
      _.theta += x - xPrev;
      _.phi   -= y - yPrev;
      xPrev = x;
      yPrev = y;
   }
   this.onUp = (x,y) => {
      showGrid = false;
      if (y > .5)
         state = Math.max(0, Math.min(1, state + Math.sign(x)));
   }

   let drawBezierPatch = (X,Y,Z) => {
      let Xu = [], Yu = [], Zu = [], Xv = [], Yv = [], Zv = [];
      for (let t = 0 ; t <= 1 ; t += 1/6) {
         for (let i = 0 ; i < 4 ; i++) {
            Xu[i] = C([ X[4*i+0],X[4*i+1],X[4*i+2],X[4*i+3] ], t);
            Yu[i] = C([ Y[4*i+0],Y[4*i+1],Y[4*i+2],Y[4*i+3] ], t);
            Zu[i] = C([ Z[4*i+0],Z[4*i+1],Z[4*i+2],Z[4*i+3] ], t);

            Xv[i] = C([ X[4*0+i],X[4*1+i],X[4*2+i],X[4*3+i] ], t);
            Yv[i] = C([ Y[4*0+i],Y[4*1+i],Y[4*2+i],Y[4*3+i] ], t);
            Zv[i] = C([ Z[4*0+i],Z[4*1+i],Z[4*2+i],Z[4*3+i] ], t);
         }
         this.curve(50, t => [ C(Xu, t), C(Yu, t), C(Zu, t) ]);
         this.curve(50, t => [ C(Xv, t), C(Yv, t), C(Zv, t) ]);
      }
   }

   let drawBezierControlGrid = (X,Y,Z,showPoints) => {
      if (showPoints)
         for (let n = 0 ; n < 16 ; n++)
            this.dot([X[n],Y[n],Z[n]], .028);
      for (let i = 0 ; i < 4 ; i++)
      for (let j = 1 ; j < 4 ; j++) {
         this.line([X[4*i + j-1],Y[4*i + j-1],Z[4*i + j-1]],[X[4*i+j],Y[4*i+j],Z[4*i+j]]);
         this.line([X[4*(j-1)+i],Y[4*(j-1)+i],Z[4*(j-1)+i]],[X[4*j+i],Y[4*j+i],Z[4*j+i]]);
      }
   }

   this.update = ctx => {
      this.move(0,-.35,0).turnY(_.theta).turnX(_.phi).scale(.25);

      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      for (let np = 0 ; np < 28 ; np++) {
         let index = 16 * 3 * np, X = [], Y = [], Z = [];
         for (let n = 0 ; n < 16 ; n++) {
            X.push(teapotData[index + 3 * n + 0]);
            Y.push(teapotData[index + 3 * n + 1]);
            Z.push(teapotData[index + 3 * n + 2]);
         }
         drawBezierPatch(X,Y,Z);
	 if (showGrid) {
	    ctx.strokeStyle = 'blue';
            ctx.lineWidth = .75;
            drawBezierControlGrid(X,Y,Z,false);
            ctx.lineWidth = 1;
	    ctx.strokeStyle = 'black';
         }
      }
   }
}

