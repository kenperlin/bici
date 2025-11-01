
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

   let key = e.key;

   // Check if this is a master or secondary client
   if (typeof webrtcClient !== 'undefined' && webrtcClient && !webrtcClient.isMaster()) {
      // Secondary client: send key action to master
      webrtcClient.sendAction({type: 'keyUp', key: key});
   }

   // Execute key handler locally (both master and secondary for immediate feedback)
   window.keyUp(key);

   // Master broadcasts state after execution
   if (typeof broadcastState === 'function') broadcastState();
});

midiDown = key => keyDown("            / m  ;       ".substring(key,key+1));
//                         '|'|''|'|'|''|'|''|'|'|''
midiUp   = key => window.keyUp("b1u2wc3s4p5D/,m.'; f g tT".substring(key,key+1));

let URLs = {
   'v': 'http://cs.nyu.edu/~perlin/video_links.html',
   'w': 'https://kenperlin.com/web.html',
};

let isOpeningURL = false;
let openURL = index => {
   let url = URLs[index];
   if (url)
      window.open(url, '_blank');
}

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

window.keyUp = key => {
   if (isOpeningURL) {
      isOpeningURL = false;
      openURL(key);
      return;
   }

   if (isAlt) {
      switch (key) {
      case 'ArrowDown' : webcam.A /= 1.1; break;
      case 'ArrowLeft' : webcam.B /= 1.1; break;
      case 'ArrowRight': webcam.B *= 1.1; break;
      case 'ArrowUp'   : webcam.A *= 1.1; break;
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
   case '[' : pen.setColor('#ff0000'); break;
   case ']' : pen.setColor('#0080ff'); break;
   case '\\': pen.setColor('#000000'); break;
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
   //case 'a' : window.open('http://cs.nyu.edu/~perlin/video_links.html', '_blank'); break;
   case 'a' : isOpeningURL = true; break;
   case 'b' : webcam.isBlur = ! webcam.isBlur; break;
   case 'c' : codeArea.getElement().style.left = (isCode = ! isCode) ? 20 : -2000; break;
   case 'd' : isDrawpad = ! isDrawpad; break;
   case 'f' : webcam.isFloaters = ! webcam.isFloaters; break;
   case 'g' : webcam.grabImage(); break;
   case 'h' : help.isHelp = ! help.isHelp; break;
   case 'i' : isInfo = ! isInfo; break;
   case 'l' : isLightPen = ! isLightPen; break;
   case 'm' : isMove = false; break;
   case 'o' : isOpaque = ! isOpaque; break;
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

