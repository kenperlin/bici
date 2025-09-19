
function Chalktalk() {
   let matchCurves = new MatchCurves();
   glyphs(matchCurves);

   let preSketch, morphData, T = 1, oldTime, sketches = [];

   let isAt = (s,x,y) => s.xlo <= x && s.xhi >= x && s.ylo <= y && s.yhi >= y;

   this.add = (strokes,x,y) => {
      let isIntersect = (a,b) => a.xlo < b.xhi && b.xlo < a.xhi &&
                                 a.ylo < b.yhi && b.ylo < a.yhi ;
      preSketch = {strokes:[]};
      for (let n = 0 ; n < strokes.length ; n++) {
         let stroke = strokes[n];
         if (isAt(stroke,x,y)) {
            preSketch.strokes.push(stroke);
	    preSketch.lineWidth = stroke.lineWidth;
	    console.log('stroke.lineWidth', stroke.lineWidth);
            strokes.splice(n, 1);
            let addStroke = () => {
               for (let n = 0 ; n < strokes.length ; n++)
                  for (let i = 0 ; i < preSketch.strokes.length ; i++)
                     if (isIntersect(preSketch.strokes[i], strokes[n])) {
                        preSketch.strokes.push(strokes[n]);
                        strokes.splice(n, 1);
                        return true;
                     }
               return false;
            }
            while (addStroke())
               ;
         }
      }
      if (preSketch.strokes.length > 0) {
         morphData = matchCurves.recognize(preSketch.strokes);
         T = 0;
         oldTime = Date.now() / 1000;
      }
   }
   
   this.delete = (x,y) => {
      for (let i = sketches.length - 1 ; i >= 0 ; i--)
         if (isAt(sketches[i].strokes,x,y)) {
            sketches.splice(i, 1);
            return true;
         }
      return false;
   }

   this.clear = () => sketches = [];
   
   let iMove, xMove, yMove;
   
   this.moveStart = (x,y) => {
      iMove = -1;
      for (let i = sketches.length-1 ; i >= 0 ; i--)
         if (isAt(sketches[i].strokes, x,y)) {
            iMove = i;
            xMove = x;
            yMove = y;
            return;
         }
   }
   
   this.move = (x,y) => {
      if (iMove == -1)
         return;
   
      let dx = x - xMove;
      let dy = y - yMove;
      xMove = x;
      yMove = y;
   
      let sketch = sketches[iMove];
      if (sketch.method) {
         sketch.xys[0] += dx;
         sketch.xys[1] -= dy;
         return;
      }
   
      let strokes = sketch.strokes;
      strokes.xlo += dx;
      strokes.ylo += dy;
      strokes.xhi += dx;
      strokes.yhi += dy;
      for (let n = 0 ; n < strokes.length ; n++) {
         let s = strokes[n];
         for (let i = 0 ; i < s.length ; i++) {
            s[i][0] += dx;
            s[i][1] += dy;
         }
      }
   } 
   
   this.drag = (x,y) => {
      for (let i = sketches.length-1 ; i >= 0 ; i--) {
         let sketch = sketches[i];
         if (sketch.method && sketch.method.drag) {
            let s = sketch.strokes;
            if (isAt(s,x,y)) {
	       let u = (x - s.xlo) / (s.xhi - s.xlo);
	       let v = (s.yhi - y) / (s.yhi - s.ylo);
	       sketch.method.drag(2*u-1, 2*v-1);
	       return;
	    }
	 }
      }
   }

   let computeBounds = ss => {
      ss.xlo = ss.ylo =  10000;
      ss.xhi = ss.yhi = -10000;
      for (let n = 0 ; n < ss.length ; n++) {
         let s = ss[n];
         for (let i = 0 ; i < s.length ; i++) {
            ss.xlo = Math.min(ss.xlo, s[i][0] - 5);
            ss.ylo = Math.min(ss.ylo, s[i][1] - 5);
            ss.xhi = Math.max(ss.xhi, s[i][0] + 5);
            ss.yhi = Math.max(ss.yhi, s[i][1] + 5);
         }
      }
   }
   
   this.update = drawStrokes => {
      let newTime = Date.now() / 1000;
      let deltaTime = newTime - oldTime;
      oldTime = newTime;
   
      if (T < 1) {
         T = Math.min(1, T + 2 * deltaTime);
         preSketch.strokes = matchCurves.update(morphData, T);
         drawStrokes(preSketch.strokes, preSketch.lineWidth);
         if (T == 1) {
            preSketch.xys = morphData[3];
            preSketch.method = morphData[4];
            computeBounds(preSketch.strokes);
            preSketch.time = 0;
            sketches.push(preSketch);
	    console.log('lineWidth', preSketch.lineWidth);
         }
      }
   
      for (let i = 0 ; i < sketches.length ; i++) {
         let sketch = sketches[i];
         if (sketch.method && sketch.method.update) {
            sketch.strokes = sketch.method.update(sketch.time += deltaTime);
            let xys = sketch.xys;
            for (let i = 0 ; i < sketch.strokes.length ; i++) {
               let s = sketch.strokes[i];
               for (let n = 0 ; n < s.length ; n++)
                  s[n] = [ xys[0]+xys[2]*s[n][0], -xys[1]-xys[2]*s[n][1] ];
            }
            computeBounds(sketch.strokes);
         }
         drawStrokes(sketch.strokes, sketch.lineWidth);
      }
   }
}

