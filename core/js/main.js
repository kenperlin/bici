let canvas2D = document.createElement('canvas');
document.body.appendChild(canvas2D);

canvas2D.style.position = 'absolute';
canvas2D.style.top = 0;
canvas2D.style.left = 0;

let canvas3D = document.createElement('canvas');
document.body.appendChild(canvas3D);

const CANVAS3D_TOP    = 440;
const CANVAS3D_LEFT   = 500;
const CANVAS3D_WIDTH  = 500;
const CANVAS3D_HEIGHT = 500;

canvas3D.style.position = 'absolute';
canvas3D.style.top = CANVAS3D_TOP;
canvas3D.style.left = -2000;
canvas3D.width = CANVAS3D_WIDTH;
canvas3D.height = CANVAS3D_HEIGHT;

let xToScene = event => {
   let rect = event.srcElement.getBoundingClientRect();
   return 2 * (event.clientX - rect.left) / rect.width - 1;
}
let yToScene = event => {
   let rect = event.srcElement.getBoundingClientRect();
   return 1 - 2 * (event.clientY - rect.top) / rect.width;
}

canvas3D.addEventListener('mousemove', event => {
   if (scene && scene.onMove && ! canvas3D.isDown)
      scene.onMove(xToScene(event), yToScene(event));
   if (scene && scene.onDrag && canvas3D.isDown)
      scene.onDrag(xToScene(event), yToScene(event));
});
canvas3D.addEventListener('mousedown', event => {
   canvas3D.isDown = true;
   if (scene && scene.onDown)
      scene.onDown(xToScene(event), yToScene(event));
});
canvas3D.addEventListener('mouseup', event => {
   canvas3D.isDown = false;
   if (scene && scene.onUp)
      scene.onUp(xToScene(event), yToScene(event));
});
canvas2D.addEventListener('mouseup', event => {
   canvas3D.isDown = false;
});

let canvasDiagram = document.createElement('canvas');
document.body.appendChild(canvasDiagram);

canvasDiagram.style.position = 'absolute';
canvasDiagram.style.top = CANVAS3D_TOP;
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

window.fontSize = 18;
let scene, sceneID, isAlt, isInfo, isOpaque;
window.isShift = false;

// Initialize Yjs for collaborative code editing
let ydoc, ytext, ypenStrokes, yjsProvider;

let codeArea = new CodeArea(-2000, 20);
let chalktalk = new Chalktalk();
let pen = new Pen();

// Show error notification to user
function showErrorNotification(title, message, details) {
   const notification = document.createElement('div');
   notification.className = 'error-notification';
   notification.innerHTML = `
      <div class="notification-content">
         <h3>${title}</h3>
         <p>${message}</p>
         ${details ? `
         <details>
            <summary>Technical Details</summary>
            <pre>${details}</pre>
         </details>
         ` : ''}
         <button class="close-notification-btn">Close</button>
      </div>
   `;

   document.body.appendChild(notification);

   notification.querySelector('.close-notification-btn').addEventListener('click', () => {
      notification.remove();
   });

   return notification;
}

// Initialize WebRTC
let webrtcClient, videoUI;
if (typeof WebRTCClient !== 'undefined') {
   webrtcClient = new WebRTCClient();

   // Handle room joined successfully
   webrtcClient.onRoomJoined = (roomId) => {
      console.log('[BICI] Room joined:', roomId);
      showInvitationUI(roomId);

      // Initialize Yjs after room is joined to use room-specific document
      console.log('[BICI] Calling initializeYjs with roomId:', roomId);
      initializeYjs(roomId);
   };

   // Handle room full error
   webrtcClient.onRoomFull = (roomId) => {
      console.error('Room is full:', roomId);
      showRoomFullNotification(roomId);
   };

   webrtcClient.init().then(localStream => {
      console.log('[BICI] WebRTC initialized successfully');

      // Set the webcam stream to use WebRTC's local stream
      // This eliminates dual webcam access conflict
      if (typeof webcam !== 'undefined') {
         webcam.srcObject = localStream;
         console.log('[BICI] Set webcam to use WebRTC stream');
      }

      videoUI = new VideoUI(webrtcClient);
      videoUI.setLocalStream(localStream);
      // Yjs will be initialized after room is joined
   }).catch(error => {
      console.error('[BICI] Failed to initialize WebRTC:', error);

      // Show user-friendly error notification
      showErrorNotification(
         'Camera/Microphone Access Error',
         error.userMessage || 'Could not access camera or microphone.',
         `Error: ${error.name}\nMessage: ${error.message}`
      );
   });
}

// Initialize Yjs for collaborative editing (called after room is joined)
function initializeYjs(roomId) {
   console.log('[BICI] initializeYjs called with roomId:', roomId);

   if (typeof Y === 'undefined') {
      console.error('[BICI] Y (Yjs) is undefined!');
      return;
   }

   ydoc = new Y.Doc();
   ytext = ydoc.getText('codemirror');

   // Create separate WebSocket for Yjs (different from WebRTC signaling)
   // Scope Yjs document to room
   const docName = roomId ? `bici-code-editor-${roomId}` : 'bici-code-editor';

   console.log('[BICI] Creating Yjs WebSocket connection for document:', docName);

   const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
   const yjsWs = new WebSocket(`${protocol}//${window.location.host}/${docName}`);
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

      // Only update textarea and reload when there's a trigger (Meta key or shift+drag)
      // NOT on every keystroke from remote user
      if (isReloading || hasSliderMarker || window.isShift) {
         // Update textarea with Yjs text
         if (textarea.value !== newText) {
            const cursorPos = textarea.selectionStart;
            textarea.value = newText;
            // Try to restore cursor position
            textarea.selectionStart = textarea.selectionEnd = Math.min(cursorPos, newText.length);
         }

         // Reload the scene
         if (typeof codeArea.callback === 'function') {
            codeArea.callback();
            isReloading = false;
         }
      }

      isLocalUpdate = false;
   });

   // When textarea changes, update Yjs text
   textarea.addEventListener('input', () => {
      if (isLocalUpdate) {
         return;
      }
      isLocalUpdate = true;
      const currentText = ytext.toString();
      let newText = textarea.value;

      // Update Yjs if text changed OR if we're reloading (even with same text)
      if (currentText !== newText || isReloading) {
         // Add invisible marker for real-time sync when shift is held OR when reloading
         if (window.isShift || isReloading) {
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

let shift3D = 0, t3D = 0, isDrawpad;

let gotoSlide = name => {
   for (let n = 0 ; n < slideNames.length ; n++)
      if (name === slideNames[n]) {
         slideIndex = n;
         break;
      }
}

let isFirstTime = true;
let slides = [], slideNames = [], slideIndex = 0, fq = {}, fqParsed = false;

let cubeVertices = [ [-1,-1,-1,1],[1,-1,-1,1],[-1,1,-1,1],[1,1,-1,1],
                     [-1,-1, 1,1],[1,-1, 1,1],[-1,1, 1,1],[1,1, 1,1] ];
let cubeEdges = [ [0,1],[2,3],[4,5],[6,7],
                  [0,2],[1,3],[4,6],[5,7],
                  [0,4],[1,5],[2,6],[3,7] ];

let initSlides = () => {
   if (!project || !slideData) return;
   
   let ctx = D.ctx;
   let index = 0;
   for (let n = 0 ; n < slideData.length ; n++) {

      let file = slideData[n];

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
   if (!project) {
      console.log('No project loaded yet, skipping setScene');
      return;
   }
   sceneID = id;
   let url = 'projects/' + project + '/scenes/scene' + id + '.js';
   loadScript(url, () => {
      autodraw = true;
      gl_start(canvas3D, scene = new Scene());
      getFile(url, str => codeArea.getElement().value = str);
   });
}

// Initialize project (called when project is loaded or switched)
// Made global so bici.js can call it
window.initProject = () => {
   if (!project || !slideData) {
      console.log('Project or slideData not ready');
      return;
   }
   
   console.log('Initializing project:', project);
   
   // Reset slides state for new project
   slides = [];
   slideNames = [];
   slideIndex = 0;
   fq = {};
   fqParsed = false;
   isFirstTime = true;
   
   // Update project switcher UI
   const currentProjectEl = document.getElementById('current-project');
   if (currentProjectEl) {
      currentProjectEl.textContent = project;
   }
   const projectSwitcher = document.getElementById('project-switcher');
   if (projectSwitcher) {
      projectSwitcher.style.display = 'block';
   }
   
   // Load the first scene
   setScene('1');
}

// Show project selector (for switching projects)
window.showProjectSelector = () => {
   const selector = document.getElementById('project-selector');
   if (selector) {
      selector.style.display = 'flex';
   }
}

// Don't auto-load scene until project is selected
// setScene('1');

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
      if (state.slideIndex !== undefined) {
         slideIndex = state.slideIndex;
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
         slideIndex: slideIndex,
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
   // Only init slides if a project is loaded
   if (isFirstTime && project && slideData) {
      initSlides();
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
         slides[index] = fq[name].image ? fq[name].image : fq[name].diagram;
         slideNames[index] = name;
      }
      fqParsed = true;
   }

   let scrollPosition = window.pageYOffset;
   document.body.style.overflow = 'hidden';
   window.scrollTo(0, scrollPosition);

   t3D = Math.max(0, Math.min(1, t3D + (shift3D ? deltaTime : -deltaTime)));
   canvas3D.style.left = isScene ? CANVAS3D_LEFT + ease(t3D) * 300 : -2000;

   // Video source is remote video if available, otherwise webcam
   if (videoUI && videoUI.hasRemoteVideo) {
      videoUI.update();
      videoSrc = videoUI.canvas;
   } else
      videoSrc = webcam;

   let p = webcam.update();
   codeArea.update();
   ctx.drawImage(webcam.canvas, 0,0,640,440, 0,0,w,h);

   if (isInfo && slides.length > 0 && slides[slideIndex]) {
      ctx.globalAlpha = isOpaque ? 1 : .5;
      let slide = slides[slideIndex];
      D.left = window.innerWidth - 500 - 20;
      if (! slide.update)
         ctx.drawImage(slide, D.left, D.top, 500, 500*slide.height/slide.width);
      else {
         slide._beforeUpdate();
         slide.update(D.ctx);
         let x = D.left, y = D.top, w = slide.width, h = slide.height;
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

      // Show the id of the current slide in the bottom right corner.
      ctx.font = '20px Courier';
      ctx.fillText(choiceKey.charAt(slideIndex), screen.width-15, screen.height-37);
   }

   if (isDrawpad) {
      let w = 500, h = 400, x = window.innerWidth - 20 - w, y = screen.height - 60 - h;
      ctx.fillStyle = isOpaque ? 'white' : '#ffffff80';
      ctx.fillRect(x, y, w, h);
   }

   if (isLightPen && p)
      penMove(p.x * w / 640, p.y * h / 440);
   pen.draw(pen.strokes);
   chalktalk.update(pen.draw);
   if (scene && scene.update)
      scene.update(webcam.headPos);
   help.display(ctx);

   if (isLightPen) {
      ctx.fillStyle = 'black';
      ctx.fillRect(screen.width-8,screen.height-8,8,8);
   }

   let logTracking = (name, data) => {
      let round = t => (1000 * t >> 0) / 1000;

      trackingInfo += name + '[' + trackingIndex + '] = [\n';
      for (let n = 0 ; n < data.length ; n++)
         trackingInfo += '{x:' + round(data[n].x) +
	                 ',y:' + round(data[n].y) +
			 ',z:' + round(data[n].z) + '},\n';
      trackingInfo += '];\n';
   }

   if (mediapipeTasks.isRunning) {
      wasTracking = true;
/*
      logTracking('left' , mediapipe_hand[0]);
      logTracking('right', mediapipe_hand[1]);
      logTracking('face' , mediapipe_face);
      trackingIndex++;
*/
      let pointToArray = p => [ p.x, p.y, p.z ];

      computeHeadMatrix(pointToArray(mediapipe_face[280]),
                        pointToArray(mediapipe_face[  4]),
                        pointToArray(mediapipe_face[ 50]));

      computeEyeGaze(
         pointToArray(mediapipe_face[263]), // outer lid       // LEFT EYE
         pointToArray(mediapipe_face[398]), // inner lid

         pointToArray(mediapipe_face[374]), // lower lid
         pointToArray(mediapipe_face[386]), // upper lid

         pointToArray(mediapipe_face[477]), // bottom of pupil
         pointToArray(mediapipe_face[473]), // center of pupil
         pointToArray(mediapipe_face[475]), // top of pupil

         pointToArray(mediapipe_face[173]), // outer lid       // RIGHT EYE
         pointToArray(mediapipe_face[ 33]), // inner lid

         pointToArray(mediapipe_face[144]), // lower lid
         pointToArray(mediapipe_face[159]), // upper lid

         pointToArray(mediapipe_face[472]), // bottom of pupil
         pointToArray(mediapipe_face[468]), // center of pupil
         pointToArray(mediapipe_face[470]), // top of pupil
      );

      let mx = screen.width/2, my = screen.height/2;

      ctx.fillStyle = eyeOpen < .5 ? '#000000' : '#ffffff40';
      if (! headX) {
         headX = mx;
         headY = my/2;
      }
      let x = mx + 3 * mx * headMatrix[8];
      let y = my - 3 * mx * headMatrix[9];
      headX = .5 * headX + .5 * x;
      headY = .5 * headY + .5 * y;

      ctx.beginPath();
      ctx.ellipse(headX,headY,100,100*eyeOpen,0,0,2*Math.PI);
      ctx.fill();

      if (eyeOpen >= .5) {
         ctx.fillStyle = 'black';
         ctx.beginPath();
         let ex = 200 * eyeGazeX;
         let ey = 400 * eyeGazeY + 100 - 35 * headY / my - 25 * Math.abs(headX - mx) / my;
         ctx.arc(headX + ex, headY + ey, 20,0,2*Math.PI);
         ctx.fill();
      }

      for (let hand = 0 ; hand < 2 ; hand++)
         if (mediapipe_hand[hand]) {
            for (let finger = 0 ; finger < 5 ; finger++)
               fingerTip[hand][finger] = pointToArray(mediapipe_hand[hand][4 + 4 * finger]);

            handPinch[hand] = 0;
            for (let finger = 1 ; finger < 3 ; finger++)
	       if (norm(subtract(fingerTip[hand][finger],fingerTip[hand][0])) < .085 * .1 / (.2 + fingerTip[hand][0][2]))
	          handPinch[hand] = finger;

            for (let finger = 0 ; finger < 3 ; finger++) {
               ctx.fillStyle = finger==0 ? '#ff000080' : finger==1 ? '#00ff0080' : '#0000ff80';
	       if (handPinch[hand] && (finger == 0 || handPinch[hand] == finger)) {
	          if (finger) {
		     ctx.fillStyle = finger==1 ? '#ffff0080' : '#ff00ff80';
                     let p0 = fingerTip[hand][0];
                     let pf = fingerTip[hand][finger];
                     let px = mx * (p0[0] + pf[0]);
                     let py = my * (p0[1] + pf[1]);
                     ctx.beginPath();
		     let r = 1.4 * Math.min(40, 40 * .1 / (.2 + p0[2]));
                     ctx.arc(px, py, r, 0,2*Math.PI);
                     ctx.fill();
		  }
	       }
	       else {
                  let p = fingerTip[hand][finger];
                  let px = 2 * mx * p[0];
                  let py = 2 * my * p[1];
                  ctx.beginPath();
		  let r = Math.min(40, 40 * .1 / (.2 + p[2]));
                  ctx.arc(px, py, r, 0,2*Math.PI);
                  ctx.fill();
	       }
            }
         }
   }
   else if (wasTracking) {
/*
      codeArea.getElement().value = trackingInfo;
*/
      wasTracking = false;
   }
}
let headX, headY;

// GIVEN THREE POINTS ON THE FACE, COMPUTE THE USER'S HEAD MATRIX

let computeHeadMatrix = (a,b,c) => {
   a[1] = -a[1];
   b[1] = -b[1];
   c[1] = -c[1];
   let X = normalize(subtract(c,a));
   let z = subtract(b,mix(a,c,.5));
   let Y = normalize(cross(z,X));
   let Z = normalize(cross(X,Y));
   headMatrix = [ X[0],X[1],X[2],0,
                  Y[0],Y[1],Y[2],0,
                  Z[0],Z[1],Z[2],0,
	          4*(b[0]-.5),4*(b[1]+.625),4*b[2],1 ];
}

// GIVEN EDGES OF EYES AND PUPIL, COMPUTE EYE GAZE AND EYE OPEN

let computeEyeGaze = (la,lb,lc,ld, le,lf,lg,
                      ra,rb,rc,rd, re,rf,rg) => {

   let LX = normalize(subtract(lb,la));
   let lx = dot(subtract(lf,mix(la,lb,.5)),LX)/norm(subtract(lb,la));
   let ly = 2 * (lf[1] - mix(la,lb,.5)[1]) / norm(subtract(lb,la));

   let RX = normalize(subtract(rb,ra));
   let rx = dot(subtract(rf,mix(ra,rb,.5)),RX)/norm(subtract(rb,ra));
   let ry = 2 * (rf[1] - mix(ra,rb,.5)[1]) / norm(subtract(rb,ra));

   eyeGazeX = lx + rx;
   eyeGazeY = ly + ry;

   let lo = norm(subtract(lc,ld)) / norm(subtract(le,lg));
   let ro = norm(subtract(rc,rd)) / norm(subtract(re,rg));

   eyeOpen = (lo + ro) / 2;
}

let trackingIndex = 0, wasTracking = false, trackingInfo = 'let left=[],right=[],face=[];';
let headMatrix = identity();
let eyeOpen  = 1;
let eyeGazeX = 0;
let eyeGazeY = 0;
let fingerTip = [[],[]];
let handPinch = [0,0];

// Room invitation UI
function showInvitationUI(roomId) {
   // Remove existing invitation UI if any
   const existing = document.getElementById('invitation-ui');
   if (existing) {
      existing.remove();
   }

   // Create invitation UI container
   const invitationUI = document.createElement('div');
   invitationUI.id = 'invitation-ui';
   invitationUI.className = 'invitation-container';

   const invitationUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

   invitationUI.innerHTML = `
      <div class="invitation-content">
         <div class="room-status">
            <span class="status-label">Room:</span>
            <span class="room-code">${roomId}</span>
         </div>
         <div class="invitation-link">
            <input type="text" readonly value="${invitationUrl}" id="invitation-url-input">
            <button id="copy-invitation-btn">Copy Link</button>
         </div>
         <div class="peer-status" id="peer-status">Waiting for peer...</div>
         <button id="close-invitation-btn">Close</button>
      </div>
   `;

   document.body.appendChild(invitationUI);

   // Copy button functionality
   document.getElementById('copy-invitation-btn').addEventListener('click', () => {
      const input = document.getElementById('invitation-url-input');
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices

      navigator.clipboard.writeText(invitationUrl).then(() => {
         const btn = document.getElementById('copy-invitation-btn');
         const originalText = btn.textContent;
         btn.textContent = 'Copied!';
         setTimeout(() => {
            btn.textContent = originalText;
         }, 2000);
      }).catch(err => {
         console.error('Failed to copy:', err);
      });
   });

   // Close button functionality
   document.getElementById('close-invitation-btn').addEventListener('click', () => {
      invitationUI.remove();
   });

   // Update peer status when someone joins
   if (webrtcClient) {
      const originalOnRemoteStreamAdded = webrtcClient.onRemoteStreamAdded;
      webrtcClient.onRemoteStreamAdded = (clientId, stream) => {
         if (originalOnRemoteStreamAdded) {
            originalOnRemoteStreamAdded(clientId, stream);
         }
         const peerStatus = document.getElementById('peer-status');
         if (peerStatus) {
            peerStatus.textContent = 'Peer connected';
            peerStatus.style.color = '#4CAF50';
         }
      };

      const originalOnRemoteStreamRemoved = webrtcClient.onRemoteStreamRemoved;
      webrtcClient.onRemoteStreamRemoved = (clientId) => {
         if (originalOnRemoteStreamRemoved) {
            originalOnRemoteStreamRemoved(clientId);
         }
         const peerStatus = document.getElementById('peer-status');
         if (peerStatus) {
            peerStatus.textContent = 'Peer disconnected';
            peerStatus.style.color = '#f44336';
         }
      };
   }
}

function showRoomFullNotification(roomId) {
   // Create notification
   const notification = document.createElement('div');
   notification.className = 'room-full-notification';
   notification.innerHTML = `
      <div class="notification-content">
         <h3>Room Full</h3>
         <p>The room <strong>${roomId || 'you tried to join'}</strong> is already full (2/2 participants).</p>
         <p>Please ask the room creator for a new invitation link.</p>
         <button id="close-notification-btn">Close</button>
      </div>
   `;

   document.body.appendChild(notification);

   document.getElementById('close-notification-btn').addEventListener('click', () => {
      notification.remove();
   });
}

