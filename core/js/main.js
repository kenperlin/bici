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
let scene, sceneID, isAlt, isInfo, isOpaque;
window.isShift = false;

// Initialize Yjs for collaborative code editing
let ydoc, ytext, ypenStrokes, yjsProvider;

let codeArea = new CodeArea(-2000, 20);
let chalktalk = new Chalktalk();
let pen = new Pen();

// Initialize WebRTC
let webrtcClient, videoUI;
if (typeof WebRTCClient !== 'undefined') {
   webrtcClient = new WebRTCClient();
   webrtcClient.init().then(localStream => {
      videoUI = new VideoUI(webrtcClient);
      videoUI.setLocalStream(localStream);

      // Initialize Yjs with custom WebSocket connection
      if (typeof Y !== 'undefined') {
         ydoc = new Y.Doc();
         ytext = ydoc.getText('codemirror');

         // Create separate WebSocket for Yjs (different from WebRTC signaling)
         const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
         const yjsWs = new WebSocket(`${protocol}//${window.location.host}/bici-code-editor`);
         yjsWs.binaryType = 'arraybuffer';

         yjsWs.onopen = () => {
            console.log('Yjs WebSocket connected');
         };

         yjsWs.onmessage = (event) => {
            if (event.data instanceof ArrayBuffer) {
               const update = new Uint8Array(event.data);
               Y.applyUpdate(ydoc, update);
            }
         };

         // Send Yjs updates through the dedicated Yjs WebSocket
         ydoc.on('update', (update) => {
            if (yjsWs.readyState === WebSocket.OPEN) {
               yjsWs.send(update);
            }
         });

         // Setup textarea binding
         const textarea = codeArea.getElement();
         let isLocalUpdate = false;
         let reloadTimer = null;
	 let isReloading = false;

         // When Yjs text changes, update textarea
         ytext.observe(event => {
            if (isLocalUpdate) return;
            isLocalUpdate = true;
            const newText = ytext.toString();

            // Check if slider marker was added (slider reload trigger)
            const hasSliderMarker = newText.includes('\u200B');

            // Reload in three cases:
            // 1. Explicit reload
            // 2. Slider marker detected (real-time slider sync)
            // 3. Local shift is held down (local number slider)
            if ((isReloading || hasSliderMarker || window.isShift) && typeof codeArea.callback === 'function') {
               codeArea.callback();
	       isReloading = false;
            }

            isLocalUpdate = false;
         });

         // When textarea changes, update Yjs text
         textarea.addEventListener('input', () => {
            if (isLocalUpdate) return;
            isLocalUpdate = true;
            const currentText = ytext.toString();
            let newText = textarea.value;

            if (currentText !== newText) {
               // Add invisible slider marker for real-time sync when shift is held
               if (window.isShift) {
                  newText = newText + '\u200B';
               }

               ydoc.transact(() => {
                  ytext.delete(0, currentText.length);
                  ytext.insert(0, newText);
               });
            }
            isLocalUpdate = false;
         });

         // Setup Yjs pen strokes synchronization
         ypenStrokes = ydoc.getArray('penStrokes');
         let isUpdatingFromYjs = false;

         // All clients observe pen strokes changes and render
         ypenStrokes.observe(event => {
            // Master client already has the correct pen.strokes locally
            // Only secondary clients need to update from Yjs
            if (webrtcClient && webrtcClient.isMaster()) {
               return;
            }

            isUpdatingFromYjs = true;
            // Update pen.strokes in place to preserve reference
            const yjsArray = ypenStrokes.toArray();
            pen.strokes.length = 0;
            pen.strokes.push(...yjsArray);
            isUpdatingFromYjs = false;
         });

         // Set up callback to sync local pen changes to Yjs (only master will actually sync)
         pen.setOnStrokesChanged(() => {
            if (!isUpdatingFromYjs) {
               syncPenStrokesToYjs();
            }
         });

         console.log('Yjs collaborative editing initialized');
      }

      console.log('WebRTC initialized successfully');
   }).catch(err => {
      console.log('WebRTC not available:', err.message);
   });
}

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
let cubeEdges = [ [0,1],[2,3],[4,5],[6,7],
                  [0,2],[1,3],[4,6],[5,7],
                  [0,4],[1,5],[2,6],[3,7] ];

let initFigures = () => {
   let ctx = D.ctx;
   let index = 0;
   for (let n = 0 ; n < slides.length ; n++) {

      let file = slides[n];

      if (file.indexOf('URL') == 0) {
         let info = file.split(' ');
	 URLs[info[1]] = info[2];
	 continue;
      }

      if (file.indexOf('SRC') == 0) {
         let info = file.split(' ');
         loadScript('projects/' + project + '/' + info[1]);
         continue;
      }

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

// Setup state synchronization after all variables are initialized
if (webrtcClient) {
   webrtcClient.onStateUpdate = (fromClientId, state) => {
      // Apply state updates from other clients
      if (state.figureIndex !== undefined) {
         figureIndex = state.figureIndex;
      }
      if (state.sceneID !== undefined && state.sceneID !== sceneID) {
         setScene(state.sceneID);
      }
      if (state.isInfo !== undefined) {
         isInfo = state.isInfo;
      }
      if (state.isScene !== undefined) {
         isScene = state.isScene;
         shift3D = state.isScene ? 1 : 0;
      }
      if (state.isCode !== undefined) {
         isCode = state.isCode;
         codeArea.getElement().style.left = isCode ? 20 : -2000;
      }
      if (state.isOpaque !== undefined) {
         isOpaque = state.isOpaque;
      }
      if (state.isDrawpad !== undefined) {
         isDrawpad = state.isDrawpad;
      }
      if (state.isMove !== undefined) {
         isMove = state.isMove;
      }
      if (state.isDrag !== undefined) {
         isDrag = state.isDrag;
      }
      if (state.isShift !== undefined) {
         window.isShift = state.isShift;
      }
      if (state.fontSize !== undefined) {
         fontSize = state.fontSize;
      }
      // penStrokes now synced via Yjs, no longer via WebRTC state updates
   };

   // Handle actions from secondary clients (master only)
   webrtcClient.onActionReceived = (fromClientId, action) => {
      console.log('Master received action:', action.type, 'from:', fromClientId);
      // Process the action and update state
      processAction(action, fromClientId);

      // Broadcast the new state to all clients
      broadcastState();
   };
}

// Track ownership of drag and move modes (master only)
let dragOwner = null;
let moveOwner = null;

// Helper to sync pen.strokes to Yjs (master only)
let syncPenStrokesTimer = null;
let syncPenStrokesToYjs = () => {
   if (!ypenStrokes || !webrtcClient || !webrtcClient.isMaster()) return;

   // Throttle updates to avoid excessive syncing (sync immediately, then debounce)
   if (syncPenStrokesTimer) {
      clearTimeout(syncPenStrokesTimer);
   }

   const doSync = () => {
      ydoc.transact(() => {
         // Clear and repopulate Yjs array with current pen.strokes
         ypenStrokes.delete(0, ypenStrokes.length);
         ypenStrokes.insert(0, pen.strokes);
      });
   };

   // Sync immediately for responsiveness
   doSync();

   // Also schedule a final sync after 100ms to ensure we catch the last update
   syncPenStrokesTimer = setTimeout(doSync, 100);
};

// Process actions (called by master when receiving actions from secondary clients)
let processAction = (action, fromClientId) => {
   switch (action.type) {
      case 'keyUp':
         // Re-execute the key event on master
         if (typeof window.keyUp === 'function') {
            window.keyUp(action.key);
         }
         break;

      case 'penDown':
         console.log('Master received penDown from:', fromClientId, 'dragOwner:', dragOwner);
         // First person to pen down gets drag ownership
         if (!dragOwner) {
            dragOwner = fromClientId;
            console.log('Assigned drag ownership to:', fromClientId);
         }
         if (dragOwner === fromClientId) {
            pen.x = action.x;
            pen.y = action.y;
            pen.width = action.width;
            pen.down();
            console.log('Called pen.down(), pen.strokes length:', pen.strokes.length);
            syncPenStrokesToYjs();
         }
         break;

      case 'penUp':
         // Release drag ownership when pen up
         if (dragOwner === fromClientId) {
            pen.up();
            dragOwner = null;
            syncPenStrokesToYjs();
         }
         break;

      case 'penMove':
         // Handle move ownership (first person to move in diagram)
         if (action.isMove && !moveOwner) {
            moveOwner = fromClientId;
         }

         // Process move from owner
         if (moveOwner === fromClientId && action.isMove) {
            pen.move(action.x, action.y);
            if (typeof chalktalk !== 'undefined') {
               chalktalk.move(action.x, action.y);
            }
         }

         // Process drag from drag owner
         if (dragOwner === fromClientId && action.isDrag) {
            console.log('Master processing drag move from:', fromClientId, 'pos:', action.x, action.y);
            pen.move(action.x, action.y);
            if (typeof chalktalk !== 'undefined') {
               chalktalk.drag(action.x, action.y);
            }
            syncPenStrokesToYjs();
         }

         // Always update pen position
         if (dragOwner === fromClientId || moveOwner === fromClientId) {
            pen.move(action.x, action.y);
         }
         break;
   }
};

// Helper function to broadcast current state (only master calls this)
let broadcastStateTimer = null;
let broadcastState = () => {
   if (!webrtcClient || !webrtcClient.isMaster()) return;

   // Debounce: wait 50ms after last change before broadcasting
   clearTimeout(broadcastStateTimer);
   broadcastStateTimer = setTimeout(() => {
      webrtcClient.broadcastState({
         figureIndex: figureIndex,
         sceneID: sceneID,
         isInfo: isInfo,
         isScene: isScene,
         isCode: isCode,
         isOpaque: isOpaque,
         isDrawpad: isDrawpad,
         isMove: isMove,
         isDrag: isDrag,
         isShift: window.isShift,
         fontSize: fontSize,
         // penStrokes now synced via Yjs instead of WebRTC
         timestamp: Date.now()
      });
   }, 50);
};

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

   // Video source is remote video if available, otherwise webcam
   if (videoUI && videoUI.hasRemoteVideo) {
      videoUI.update();
      videoSrc = videoUI.canvas;
   } else
      videoSrc = webcam;

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

      // Show the id of the current figure in the bottom right corner.
      ctx.font = '20px Courier';
      ctx.fillText(choiceKey.charAt(figureIndex), screen.width-15, screen.height-37);
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

