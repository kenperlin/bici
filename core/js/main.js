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
canvas3D.width = 600;
canvas3D.height = 600;

let canvasDiagram = document.createElement('canvas');
document.body.appendChild(canvasDiagram);

canvasDiagram.style.position = 'absolute';
canvasDiagram.style.top = 440;
canvasDiagram.style.left = -2000;
canvasDiagram.width = 500;
canvasDiagram.height = 500;

let figureSequence = () => { return []; }

window.fontSize = 18;
let codeArea = new CodeArea(-2000, 20), scene, sceneID, isAlt, isShift, isInfo, isInfoOpaque;
let shift3D = 0, t3D = 0, isDrawpad;
let ease = t => t * t * (3 - t - t);

let gotoFigure = name => {
   for (let n = 0 ; n < figureNames.length ; n++)
      if (name === figureNames[n]) {
         figureIndex = n;
	 break;
      }
}

let isFirstTime = true;
let figures = [], figureNames = [], figureIndex = 0, fq = {}, fqParsed = false;

let initFigures = () => {
   let index = 0;
   for (let n = 0 ; n < slides.length ; n++) {
      let file = slides[n].trim();
      let name = file.substring(0, file.indexOf('.'));

      let i = file.indexOf(':');
      if (i >= 0) {
         name = file.substring(0, i).trim();
         file = file.substring(i+1).trim();
      }

      if (file.length > 0) {
         fq[name] = { index: index++ };
         if (file.indexOf('.js') < 0)
            loadImage(file, image => fq[name].image = image);
         else
            loadScript('projects/' + project + '/diagrams/' + file, () => fq[name].diagram = new Diagram());
      }
   }
}
/*
async function getFile(url, callback) {
    try {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
	callback(await response.text());
    } catch (error) { }
}
*/
let setScene = id => {
   sceneID = id;
   let url = 'projects/' + project + '/scenes/scene' + id + '.js';
   loadScript(url, () => {
      gl_start(canvas3D, scene = new Scene());
      getFile(url, str => codeArea.getElement().value = str);
   });
}

setScene('1');

let pen = new Pen();
let chalktalk = new Chalktalk();
let isLightPen = true, isHelp = false;

codeArea.callback = () => {
   eval(codeArea.getElement().value);
   gl_start(canvas3D, scene = new Scene());
}

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

let penDown = () => {
   if (isInfo) {
      let figure = figures[figureIndex];
      if (D.isIn() && (figure.mouseDown || figure.mouseDrag || figure.mouseUp)) {
         if (figure.mouseDown)
            figure.mouseDown(D.x, D.y);
	 D.isDown = true;
	 return;
      }
   }

   pen.down();
}

let penUp = () => {
   if (isInfo) {
      let figure = figures[figureIndex];
      if (D.isDown) {
         if (figure.mouseUp)
            figure.mouseUp(D.x, D.y);
	 D.isDown = false;
	 return;
      }
   }

   pen.up();
}

let penMove = (x,y) => {
   if (isInfo) {
      D.x = x - D.left;
      D.y = y - D.top;
      let figure = figures[figureIndex];
      if (D.isDown && figure.mouseDrag) {
         figure.mouseDrag(D.x, D.y);
	 return;
      }
      if (D.isIn() && figure.mouseMove) {
         figure.mouseMove(D.x, D.y);
	 return;
      }
   }

   pen.move(x,y);
   if (isMove)
      chalktalk.move(x,y);
   if (isDrag)
      chalktalk.drag(x,y);
}

document.addEventListener('mousemove', e => penMove(e.x,e.y));

let isPenKey = (e,key) => document.activeElement != codeArea.getElement() && e.key == key;

document.addEventListener('keydown', e => {
   if (document.activeElement == codeArea.getElement())
      return;
   if (e.key.indexOf('Arrow') == 0)
      e.preventDefault();
   keyDown(e.key);
});

document.addEventListener('keyup', e => {
   help.isSplash = false;
   if (document.activeElement == codeArea.getElement())
      return;
   if (e.key.indexOf('Arrow') == 0)
      e.preventDefault();
   keyUp(e.key);
});

midiDown = key => keyDown("            / m  ;       ".substring(key,key+1));
//                         '|'|''|'|'|''|'|''|'|'|''
midiUp   = key => keyUp  ("b1u2wc3s4p5D/,m.'; f g tT".substring(key,key+1));

let keyDown = key => {
   switch (key) {
   case 'Alt': isAlt = true; break;
   case 'Shift': isShift = true; break;
   case '/': penDown(); break;
   case ';': isDrag = true; break;
   case 'm':
      if (! isMove)
         chalktalk.moveStart(pen.x,pen.y);
      isMove = true;
      break;
   }
}

let keyUp = key => {
   if (isAlt) {
      switch (key) {
      case 'ArrowDown' : webcam.A /= 1.1; console.log('webcam.A', webcam.A >> 0); break;
      case 'ArrowLeft' : webcam.B /= 1.1; console.log('webcam.B', webcam.B >> 0); break;
      case 'ArrowRight': webcam.B *= 1.1; console.log('webcam.B', webcam.B >> 0); break;
      case 'ArrowUp'   : webcam.A *= 1.1; console.log('webcam.A', webcam.A >> 0); break;
      }
      return;
   }
   if (key >= '0' && key <= '9') {
      setScene(key);
      return;
   }
   switch (key) {
   case 'Alt': isAlt = false; break;
   case 'Shift': isShift = false; break;
   case 'ArrowUp'   : fontSize *= 1.1; break;
   case 'ArrowDown' : fontSize /= 1.1; break;
   case 'ArrowLeft' : figureIndex = (figureIndex + figures.length - 1) % figures.length; break;
   case 'ArrowRight': figureIndex = (figureIndex                     + 1) % figures.length; break;
   case "'" : chalktalk.add(pen.strokes,pen.x,pen.y); break;
   case ',' : pen.width *= .707; break;
   case '.' : pen.width /= .707; break;
   case '/' : penUp(); break;
   case ';' : isDrag = false; break;
   case 'D':
   case 'Backspace' :
      if (isShift) {
         chalktalk.clear();
         pen.clear();
      }
      else if (! chalktalk.delete(pen.x,pen.y))
         pen.delete();
      break;
   case 'b' : webcam.isBlur = ! webcam.isBlur; break;
   case 'c' : codeArea.getElement().style.left = (isCode = ! isCode) ? 20 : -2000; break;
   case 'd' : isDrawpad = ! isDrawpad; break;
   case 'f' : webcam.isFloaters = ! webcam.isFloaters; break;
   case 'g' : webcam.grabImage(); break;
   case 'h' : help.isHelp = ! help.isHelp; break;
   case 'i' : isInfo = ! isInfo; break;
   case 'l' : isLightPen = ! isLightPen; break;
   case 'm' : isMove = false; break;
   case 'o' : isInfoOpaque = ! isInfoOpaque; break;
   case 'p' : webcam.isPen = ! webcam.isPen; break;
   case 'r' : shift3D = 1 - shift3D; break;
   case 's' : isScene = ! isScene; break;
   case 't' : webcam.opacity = 1.5 - webcam.opacity; break;
   case 'T' : webcam.opacity = 1.01 - webcam.opacity; break;
   case 'u' : webcam.ufoTime = webcam.ufoTime ? 0 : Date.now() / 1000; break;
   case 'v' : webcam.isTrackHead = ! webcam.isTrackHead; break;
   case 'V' : webcam.showTrackHead = ! webcam.showTrackHead; break;
   case 'w' : webcam.isWorld = ! webcam.isWorld; break;
   }
}

let startTime = Date.now() / 1000;
let timePrev = startTime;

animate = () => {
   if (isFirstTime) {
      initFigures();
      isFirstTime = false;
   }

   let time = Date.now() / 1000;
   let deltaTime = time - timePrev;
   timePrev = time;

   if (time - startTime > 1 && ! fqParsed) {
      for (let name in fq) {
         let index = fq[name].index;
         if (fq[name].image)
	    figures[index] = fq[name].image;
	 else {
            let diagram = fq[name].diagram;
            let w = diagram.width  = diagram.width  ?? D.w;
            let h = diagram.height = diagram.height ?? D.h;
	    diagram.w2p = x => .5 * x * w;
	    diagram.x2p = x => (.5     + x * .5) * w;
	    diagram.y2p = y => (.5*h/w - y * .5) * w;
            figures[index] = diagram;
         }
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
      ctx.globalAlpha = isInfoOpaque ? 1 : .5;
      let figure = figures[figureIndex];
      if (! figure.update)
         ctx.drawImage(figure, D.left, D.top, 500, 500*figure.height/figure.width);
      else {
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
   scene.update(webcam.headPos);
   help.display(ctx);
}
