let canvas2D = document.createElement('canvas');
document.body.appendChild(canvas2D);

canvas2D.style.position = 'absolute';
canvas2D.style.top = 0;
canvas2D.style.left = 0;
//canvas2D.style.pointerEvents = 'none'; // Allow clicks to pass through to codeArea and canvas3D

let canvas3D = document.createElement('canvas');
document.body.appendChild(canvas3D);

let CANVAS3D_WIDTH  = 500;
let CANVAS3D_HEIGHT = 500;
let CANVAS3D_TOP    = screen.height - CANVAS3D_HEIGHT - 40;
let CANVAS3D_LEFT   = (screen.width - CANVAS3D_WIDTH) / 2 - 10;

/*
canvas3D.style.position = 'absolute';
canvas3D.style.top = CANVAS3D_TOP;
canvas3D.style.left = -2000;
canvas3D.width = CANVAS3D_WIDTH;
canvas3D.height = CANVAS3D_HEIGHT;
*/

let canvas3D_x = () => parseInt(canvas3D.style.left);
let canvas3D_y = () => parseInt(canvas3D.style.top );
let canvas3D_containsPoint = (x, y) =>
   x >= canvas3D_x() &&
   x < canvas3D_x() + canvas3D.width &&
   y >= canvas3D_y() &&
   y < canvas3D_y() + canvas3D.height;


let xToScene = x => 2 * (x - canvas3D_x()) / canvas3D.width - 1;
let yToScene = y => 1 - 2 * (y - canvas3D_y()) / canvas3D.width;
let zToScene = z => -2 * z / canvas3D.width - 2.5;

let canvas3D_move = (x,y,z,id='id') => {
   if (! canvas3D.isDown)
      canvas3D.isDown = {};

   if (scene && scene.onMove && ! canvas3D.isDown[id])
      scene.onMove(xToScene(x), yToScene(y), zToScene(z), id);
   if (scene && scene.onDrag && canvas3D.isDown[id])
      scene.onDrag(xToScene(x), yToScene(y), zToScene(z), id);
}

let canvas3D_down = (x,y,z,id='id') => {
   if (! canvas3D.isDown)
      canvas3D.isDown = {};

   if (scene) {
      x = xToScene(x);
      y = yToScene(y);
      if (x*x < 1 && y*y < 1) {
         canvas3D.isDown[id] = true;
	 if (scene.onDown)
            scene.onDown(x, y, zToScene(z), id);
      }
   }
}

let canvas3D_up = (x,y,z,id='id') => {
   if (! canvas3D.isDown)
      canvas3D.isDown = {};

   canvas3D.isDown[id] = false;
   if (scene && scene.onUp)
      scene.onUp(xToScene(x), yToScene(y), zToScene(z), id);
}

canvas3D.addEventListener('mousemove', event => canvas3D_move(event.clientX, event.clientY, 0, "mouse"));
canvas3D.addEventListener('mousedown', event => canvas3D_down(event.clientX, event.clientY, 0, "mouse"));
canvas3D.addEventListener('mouseup'  , event => canvas3D_up  (event.clientX, event.clientY, 0, "mouse"));
canvas2D.addEventListener('mousemove', event => canvas3D_move(event.clientX, event.clientY, 0, "mouse"));
canvas2D.addEventListener('mouseup'  , event => canvas3D_up  (event.clientX, event.clientY, 0, "mouse"));

let canvasDiagram = document.createElement('canvas');
document.body.appendChild(canvasDiagram);

canvasDiagram.style.position = 'absolute';
canvasDiagram.style.top = CANVAS3D_TOP;
canvasDiagram.style.left = -2000;
canvasDiagram.width = 500;
canvasDiagram.height = 500;

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

let overlayCanvas = document.createElement('canvas');
document.body.appendChild(overlayCanvas);
overlayCanvas.style.position = 'absolute';
overlayCanvas.style.left = 0;
overlayCanvas.style.top = 0;
overlayCanvas.style.pointerEvents = 'none';
overlayCanvas.style.zIndex = 2;
overlayCanvas.width = screen.width;
overlayCanvas.height = screen.height;
let octx = overlayCanvas.getContext('2d');

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

// Check whether this is the only client, and whether it is the master client.
let isMultiPlayer = () => ! (webrtcClient.peerConnections.size == 0);
let isFirstPlayer = () => webrtcClient.isMasterClient;

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
   // Use window.isReloading for global state shared with codeArea.js
   window.isReloading = window.isReloading || false;

   // When Yjs text changes, update textarea
   ytext.observe(event => {
      if (isLocalUpdate) return;
      isLocalUpdate = true;
      const newText = ytext.toString();

      // Check if slider marker was added (slider reload trigger)
      const hasSliderMarker = newText.includes('\u200B');

      // Only update textarea and reload when there's a trigger (Meta key or shift+drag)
      // NOT on every keystroke from remote user
      if (window.isReloading || hasSliderMarker || window.isShift) {
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
            window.isReloading = false;
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
      if (currentText !== newText || window.isReloading) {
         // Add invisible marker for real-time sync when shift is held OR when reloading
         if (window.isShift || window.isReloading) {
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
      console.log(n, file);

      if (file.indexOf('URL') == 0) {
         let info = file.split(' ');
	 URLs[info[1]] = info[2];
	 continue;
      }

      if (file.indexOf('SRC') == 0) {
         let info = file.split(' ');
         loadScript('projects/' + project + '/' + info[1]);
	 console.log('loading script', 'projects/' + project + '/' + info[1]);
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
	    diagram.width = D.w;
	    diagram.height = D.h;
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
                  centeredText(ctx, line, 250, 210 + 60 * (n - (lines.length-1)/2));
               }
	       ctx.restore();
            }
         })();
      }
   }
}

let startNewScene = () => {

   if (isLarge3D) {
      CANVAS3D_WIDTH = screen.width;
      CANVAS3D_HEIGHT = screen.width;
      CANVAS3D_TOP = 0;
      CANVAS3D_LEFT = 0;
   }
   canvas3D.style.position = 'absolute';
   canvas3D.style.top = CANVAS3D_TOP;
   canvas3D.style.left = -2000;
   canvas3D.width = CANVAS3D_WIDTH;
   canvas3D.height = CANVAS3D_HEIGHT;

   scene = new Scene();
   if (scene.vertexShader == undefined)
      scene.vertexShader = Shader.defaultVertexShader;
   if (scene.fragmentShader == undefined)
      scene.fragmentShader = Shader.shinyFragmentShader;
   gl_start(canvas3D, scene);
}

let sceneCounter = 0;

let sceneSeed = () => webrtcClient.roomId.charCodeAt(0)
                    + webrtcClient.roomId.charCodeAt(1) / 128
                    + 123.456 * sceneCounter;

let sceneVar = (name, initialValue) => {
   let varName = '_sceneVar_' + name + '_' + sceneCounter;
   if (! window[varName])
      window[varName] = initialValue;
   return window[varName];
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
      sceneCounter++;
      startNewScene();
      getFile(url, str => codeArea.getElement().value = str);
   });
}

// Initialize project (called when project is loaded or switched)
// Made global so bici.js can call it

const projectSwitcher = document.getElementById('project-switcher');

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
   if (projectSwitcher) {
      projectSwitcher.style.display = 'block';
      projectSwitcher.style.left = 15;
      projectSwitcher.style.top = screen.height - 50;
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

let isLightPen = false, isHelp = false;

codeArea.callback = () => {
   window.isReloadScene = true;
};

let w = canvas2D.width = screen.width;
let h = canvas2D.height = screen.height;
let ctx = canvas2D.getContext('2d');
let isMove = false, isScene = false, isCode = false, isDrag = false, isLarge3D = false;
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
      }
      if (state.isCode !== undefined) {
         codeArea.setVisible(isCode = state.isCode);
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

      case 'setVar':
         // Secondary client sent a setVar action - master processes it and syncs to Yjs
         // This ensures only one client (master) writes to Yjs, preventing duplicate text
         if (typeof codeArea !== 'undefined' && codeArea.setVar) {
            codeArea.setVar(action.name, action.value);
         }
         break;

      case 'setVars':
         // Secondary client sent a batched setVars action - apply all vars atomically
         // This prevents the "flash" bug where intermediate states cause visual glitches
         if (typeof codeArea !== 'undefined' && codeArea.setVars) {
            codeArea.setVars(action.vars);
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
   isIn : (x,y) => (x??D.x) >= 0 && (x??D.x) < D.w && (y??D.y) >= 0 && (y??D.y) < D.h,
};
D.ctx.font = '30px Helvetica';
D.ctx.lineCap = 'round';
D.ctx.lineWidth = 3;

let startTime = Date.now() / 1000;
let timePrev = startTime;
window.isReloadScene = false;
let reloadTime = 0;

let centeredText = (ctx,text,x,y) => ctx.fillText(text, x-ctx.measureText(text).width/2, y);

let screenMessage = text => {
   octx.save();
   octx.font = '30px Courier';
   octx.fillStyle = 'black';
   centeredText(octx, text, screen.width / 2, 30);
   octx.restore();
}

animate = () => {
   // Only init slides if a project is loaded
   if (isFirstTime && project && slideData) {
      initSlides();
      isFirstTime = false;
   }

   let time = Date.now() / 1000;
   let deltaTime = time - timePrev;
   timePrev = time;
   
   if (window.isReloadScene && time - reloadTime > .1) {
      try {
         // Remove zero-width space markers (\u200B) added by Yjs sync before eval
         const code = codeArea.getElement().value.replace(/\u200B/g, '');
         // Use window.eval to ensure Scene is defined in global scope
         window.eval(code);
         autodraw = true;
	 startNewScene();
         
         // Also clean up markers from the textarea to prevent accumulation
         const textarea = codeArea.getElement();
         if (textarea.value.includes('\u200B')) {
            textarea.value = textarea.value.replace(/\u200B/g, '');
         }
      } catch (e) {
         console.error('Scene code error:', e);
      }
      reloadTime = time;
      window.isReloadScene = false;
   }

   if (time - startTime > 1 && ! fqParsed) {
      for (let name in fq) {
         let index = fq[name].index;
         let diagram = fq[name].diagram;
         slides[index] = fq[name].image ? fq[name].image : fq[name].diagram;
         slideNames[index] = name;
      }
      fqParsed = true;
   }

   // Clear the overlay canvas before doing anything else for this animation frame.
   octx.clearRect(0,0,screen.width,screen.height);

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

   // Patch to fix race condition in loading diagrams
   if (slides.length > 0 && ! slides[slideIndex])
      for (let name in fq)
         if (fq[name].index == slideIndex)
	    if (name.indexOf('.png') > 0 || name.indexOf('.jpg') > 0)
               slides[slideIndex] = fq[name].image;
            else
               slides[slideIndex] = fq[name].diagram;

   if (isInfo && slides.length > 0 && slides[slideIndex]) {
      ctx.globalAlpha = isOpaque ? 1 : .5;
      let slide = slides[slideIndex];
      D.left = window.innerWidth - 500 - 20;
      D.w = slide.width ?? 500;
      D.h = slide.height ?? 500;
      
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
   if (scene && scene.update && isScene) {
      octx.save();
      scene.update(webcam.headPos);
      octx.restore();
   }
   help.display(ctx);

   if (isLightPen) {
      ctx.fillStyle = 'black';
      ctx.fillRect(screen.width-8,screen.height-8,8,8);
   }

   trackingUpdate();

   //projectSwitcher.style.top = document.documentElement.clientHeight - 43;
   projectSwitcher.style.top = Math.min(screen.height - 80,
                                        document.documentElement.clientHeight - 43);
}

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

