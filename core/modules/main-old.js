let isAlt, isInfo, isOpaque, isDrawpad, isLightPen, isMove, isScene, isCode, isDrag;

window.isShift = false;

// Initialize Yjs for collaborative code editing
let ypenStrokes, yjsProvider;

// Check whether this is the only client, and whether it is the master client.
let isMultiPlayer = () => ! (webrtcClient.peerConnections.size == 0);
let isFirstPlayer = () => webrtcClient.isMasterClient;

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

animate = () => {

   let time = Date.now() / 1000;
   let deltaTime = time - timePrev;
   timePrev = time;

         ctx.save();
            ctx.beginPath();
            ctx.moveTo(x,y);
            ctx.lineTo(x+w,y);
            ctx.lineTo(x+w,y+h);
            ctx.lineTo(x,y+h);
            ctx.clip();
            ctx.drawImage(canvasDiagram, x, y);
         ctx.restore();
      
   if (isDrawpad) {
      let w = 500, h = 400, x = window.innerWidth - 20 - w, y = screen.height - 60 - h;
      ctx.fillStyle = isOpaque ? 'white' : '#ffffff80';
      ctx.fillRect(x, y, w, h);
   }

   if (isLightPen && p)
      penMove(p.x * w / 640, p.y * h / 440);
   pen.draw(pen.strokes);

   help.display(ctx);

   if (isLightPen) {
      ctx.fillStyle = 'black';
      ctx.fillRect(screen.width-8,screen.height-8,8,8);
   }

   trackingUpdate();

}

