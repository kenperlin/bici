let canvas2D = document.createElement('canvas');
document.body.appendChild(canvas2D);

canvas2D.style.position = 'absolute';
canvas2D.style.top = 0;
canvas2D.style.left = 0;

let canvas3D = document.createElement('canvas');
document.body.appendChild(canvas3D);

canvas3D.style.position = 'absolute';
canvas3D.style.top = 440;
canvas3D.style.left = -2000;
canvas3D.width = 500;
canvas3D.height = 500;

let canvasDiagram = document.createElement('canvas');
document.body.appendChild(canvasDiagram);

canvasDiagram.style.position = 'absolute';
canvasDiagram.style.top = 440;
canvasDiagram.style.left = -2000;
canvasDiagram.width = 500;
canvasDiagram.height = 500;

let _ = {};

let colors = [ '#ff0000', '#008f00', '#0080ff', '#ff00ff', '#000000' ];

let transition = (a,b,startTime) => {
   if (! startTime || startTime < 0)
      return a;
   let t = Math.max(0, Math.min(1, Date.now() / 1000 - startTime));
   return a + (b - a) * t * t * (3 - t - t);
}

let figureSequence = () => { return []; }

window.fontSize = 18;
let scene, sceneID, isAlt, isShift, isInfo, isOpaque;

let codeArea = new CodeArea(-2000, 20);
let chalktalk = new Chalktalk();
let pen = new Pen();

let shift3D = 0, t3D = 0, isDrawpad;

let gotoFigure = name => {
   for (let n = 0 ; n < figureNames.length ; n++)
      if (name === figureNames[n]) {
         figureIndex = n;
         break;
      }
}

let isFirstTime = true;
let figures = [], figureNames = [], figureIndex = 0, fq = {}, fqParsed = false;

let cubeVertices = [ [-1,-1,-1,1],[1,-1,-1,1],[-1,1,-1,1],[1,1,-1,1],
                     [-1,-1, 1,1],[1,-1, 1,1],[-1,1, 1,1],[1,1, 1,1] ];

let initFigures = () => {
   let ctx = D.ctx;
   let index = 0;
   for (let n = 0 ; n < slides.length ; n++) {

      let file = slides[n];
      let j = file.indexOf('//');
      if (j >= 0)
         file = file.substring(0, j);
      file = file.trim();
      if (file.length == 0)
         continue;

      let name = file;
      let i = file.indexOf('::');
      if (i >= 0) {
         name = file.substring(0, i).trim();
         file = file.substring(i+2).trim();
      }

      fq[name] = { index: index++ };

      let isDiagram = file.indexOf('.js') > 0;
      let isImage   = file.indexOf('.png') > 0 || file.indexOf('.jpg') > 0;

      if (isImage) {
         loadImage(file, image => fq[name].image = image);
      }

      else if (isDiagram) {
         console.log('diagram', file);
         loadScript('projects/' + project + '/diagrams/' + file, () => {
            let diagram = new Diagram();
	    addDiagramProperties(diagram, ctx);
            fq[name].diagram = diagram;
         });
      }

      else {
         fq[name].diagram = new (function() {
            this.width = 500;
            this.height = 400;
            this._beforeUpdate = () => { }
            let lines = file.split('\\n');
            this.update = () => {
	       ctx.save();
               ctx.fillStyle = 'white';
               ctx.fillRect(0,0,this.width,this.height);
               ctx.font = '40px Helvetica';
               ctx.fillStyle = 'black';
               for (let n = 0 ; n < lines.length ; n++) {
	          let line = lines[n], i, j;
	          if ((i=line.indexOf('<font'))>=0 && (j=line.indexOf('>',i))>=0) {
		     ctx.font = line.substring(i+6, j);
		     line = line.substring(j+1);
		  }
                  let w = ctx.measureText(line).width;
                  ctx.fillText(line, 250 - w/2, 210 + 60 * (n - (lines.length-1)/2));
               }
	       ctx.restore();
            }
         })();
      }
   }
}

let setScene = id => {
   sceneID = id;
   let url = 'projects/' + project + '/scenes/scene' + id + '.js';
   loadScript(url, () => {
      autodraw = true;
      gl_start(canvas3D, scene = new Scene());
      getFile(url, str => codeArea.getElement().value = str);
   });
}

setScene('1');

let isLightPen = false, isHelp = false;

codeArea.callback = () => isReloadScene = true;

let w = canvas2D.width = screen.width;
let h = canvas2D.height = screen.height;
let ctx = canvas2D.getContext('2d');
let isMove = false, isScene = false, isCode = false, isDrag = false;
pen.setContext(ctx);

let D = {
   ctx : canvasDiagram.getContext('2d'),
   left : screen.width - 20 - 500, top : 20, w : 500, h : 500,
   isIn : () => D.x >= 0 && D.x < D.w && D.y >= 0 && D.y < D.h,
};
D.ctx.font = '30px Helvetica';
D.ctx.lineCap = 'round';
D.ctx.lineWidth = 3;

let startTime = Date.now() / 1000;
let timePrev = startTime;
let isReloadScene = false, reloadTime = 0;

animate = () => {
   if (isFirstTime) {
      initFigures();
      isFirstTime = false;
   }

   let time = Date.now() / 1000;
   let deltaTime = time - timePrev;
   timePrev = time;

   if (isReloadScene && time - reloadTime > .1) {
      eval(codeArea.getElement().value);
      autodraw = true;
      gl_start(canvas3D, scene = new Scene());
      reloadTime = time;
      isReloadScene = false;
   }

   if (time - startTime > 1 && ! fqParsed) {
      for (let name in fq) {
         let index = fq[name].index;
         figures[index] = fq[name].image ? fq[name].image : fq[name].diagram;
         figureNames[index] = name;
      }
      fqParsed = true;
   }

   let scrollPosition = window.pageYOffset;
   document.body.style.overflow = 'hidden';
   window.scrollTo(0, scrollPosition);

   t3D = Math.max(0, Math.min(1, t3D + (shift3D ? deltaTime : -deltaTime)));
   canvas3D.style.left = isScene ? 500 + ease(t3D) * 300 : -2000;

   let p = webcam.update();
   codeArea.update();
   ctx.drawImage(webcam.canvas, 0,0,640,440, 0,0,w,h);

   if (isInfo) {
      ctx.globalAlpha = isOpaque ? 1 : .5;
      let figure = figures[figureIndex];
      if (! figure.update)
         ctx.drawImage(figure, D.left, D.top, 500, 500*figure.height/figure.width);
      else {
         figure._beforeUpdate();
         figure.update(D.ctx);
         let x = D.left, y = D.top, w = figure.width, h = figure.height;
         ctx.save();
            ctx.beginPath();
            ctx.moveTo(x,y);
            ctx.lineTo(x+w,y);
            ctx.lineTo(x+w,y+h);
            ctx.lineTo(x,y+h);
            ctx.clip();
            ctx.drawImage(canvasDiagram, x, y);
         ctx.restore();
      }
      ctx.globalAlpha = 1;
   }

   if (isDrawpad) {
      let w = 500, h = 400, x = screen.width - 20 - w, y = screen.height - 60 - h;
      ctx.fillStyle = '#ffffff80';
      ctx.fillRect(x, y, w, h);
   }

   if (isLightPen && p)
      penMove(p.x * w / 640, p.y * h / 440);
   pen.draw(pen.strokes);
   chalktalk.update(pen.draw);
   if (scene.update)
      scene.update(webcam.headPos);
   help.display(ctx);

   if (isLightPen) {
      ctx.fillStyle = 'black';
      ctx.fillRect(screen.width-8,screen.height-8,8,8);
   }
}

