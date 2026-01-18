export function Diagram() {
   let px = 0, py = 0;
   this.onDrag = (x,y) => {
      codeArea.setVar('red'  , .5 + .5 * x);
      codeArea.setVar('green', .5 + .5 * y);
      px = x;
      py = y;
   }
   this.update = ctx => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      this.drawColor('red').line([-.5,0],[.5,0],1);
      this.drawColor('green').line([0,-.5],[0,.5],1);
      this.fillColor('black').fillRect([px-.05, py-.05],
                                       [px+.05, py+.05]);
   }
}

