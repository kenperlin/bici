let scene, sceneID, isAlt, isInfo, isOpaque;
window.isShift = false;

// Initialize Yjs for collaborative code editing
let ydoc, ytext, ypenStrokes, yjsProvider;

let pen = new Pen();
let octx = overlayCanvas.getContext('2d');

// Check whether this is the only client, and whether it is the master client.
let isMultiPlayer = () => ! (webrtcClient.peerConnections.size == 0);
let isFirstPlayer = () => webrtcClient.isMasterClient;


let shift3D = 0, t3D = 0, isDrawpad;

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

let isLightPen = false

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

   let time = Date.now() / 1000;
   let deltaTime = time - timePrev;
   timePrev = time;
   
   // Clear the overlay canvas before doing anything else for this animation frame.
   octx.clearRect(0,0,screen.width,screen.height);

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

