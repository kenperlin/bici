
document.addEventListener('keydown', e => {
   if (document.activeElement == codeArea.getElement())
      return;

   let scriptTextarea = document.getElementById('scriptInput');
   if (scriptTextarea && document.activeElement === scriptTextarea)
      return;

   if (e.key.indexOf('Arrow') == 0)
      e.preventDefault();
   keyDown(e.key);
});

document.addEventListener('keyup', e => {
   help.isSplash = false;
   if (document.activeElement == codeArea.getElement())
      return;

   let scriptTextarea = document.getElementById('scriptInput');
   if (scriptTextarea && document.activeElement === scriptTextarea)
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

let isOpeningURL, isJumpingToSlide, isLoadingSrcFile;

let openURL = key => {
   let url = URLs[key];
   if (url)
      window.open(url, '_blank');
}

let choiceKey = '0123456789\
abcdefghijklmnopqrstuvwxyz\
ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
   let toggleCode = () => codeArea.setVisible(isCode = ! isCode);

   let toggleScriptPanel = () => {
      let textarea = document.getElementById('scriptInput');
      if (!textarea || document.activeElement !== textarea) {
         scriptPanel.toggle();
      }
   }

   if (isOpeningURL) {
      isOpeningURL = false;
      openURL(key);
      return;
   }

   if (isJumpingToSlide) {
      let i = choiceKey.indexOf(key);
      if (i >= 0)
         slideIndex = Math.min(slides.length-1, choiceKey.indexOf(key));
      isJumpingToSlide = false;
      return;
   }

   if (isLoadingSrcFile) {
      let i = choiceKey.indexOf(key);
      if (i >= 0 && i < srcFiles.length)
         getFile('core/js/' + srcFiles[i].trim() + '.js', str => {
	    codeArea.getElement().value = str;
         });
      isLoadingSrcFile = false;
      if (! isCode)
         toggleCode();
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
   case 'ArrowLeft' : slideIndex = (slideIndex + slides.length - 1) % slides.length; break;
   case 'ArrowRight': slideIndex = (slideIndex                  + 1) % slides.length; break;
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
   case 'a' : isOpeningURL = true; break;
   case 'b' : webcam.isBlur = ! webcam.isBlur; break;
   case 'c' : toggleCode(); break;
   case 'd' : isDrawpad = ! isDrawpad; break;
   case 'e' : isLoadingSrcFile = true; break;
   case 'f' : webcam.isFloaters = ! webcam.isFloaters; break;
   case 'F' : tracking_frameHands = ! tracking_frameHands; break;
   case 'g' : webcam.grabImage(); break;
   case 'h' : help.isHelp = ! help.isHelp; break;
   case 'H' : isSeparateHandAvatars = ! isSeparateHandAvatars; break;
   case 'i' : isInfo = ! isInfo; break;
   case 'j' : isJumpingToSlide = true; break;
   case 'l' : isLightPen = ! isLightPen; break;
   case 'm' : isMove = false; break;
   case 'L' : tracking_isLarge = ! tracking_isLarge; break;
   case 'M' : mediapipe.toggleRunning(); break;
   case 'N' : tracking_isObvious = ! tracking_isObvious; break;
   case 'o' : isOpaque = ! isOpaque; break;
   case 'p' : webcam.isPen = ! webcam.isPen; break;
   case 'r' : shift3D = 1 - shift3D; break;
   case 's' : isScene = ! isScene; break;
   case 't' : webcam.opacity = 1.5 - webcam.opacity; break;
   case 'T' : webcam.opacity = 1.01 - webcam.opacity; break;
   case 'u' : webcam.ufoTime = webcam.ufoTime ? 0 : Date.now() / 1000; break;
   case 'V' : 
      mediapipe.debugMode = !mediapipe.debugMode;
      tracking_debugMode = !tracking_debugMode;
      break;
   case 'w' : webcam.isWorld = ! webcam.isWorld; break;
   case 'x' : navigator.clipboard.readText()
                       .then(text => console.log('Clipboard content:', text))
		       .catch(err => {}); break;
   case 'X' : toggleScriptPanel(); break;
   }
}

