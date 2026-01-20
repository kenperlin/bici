import {
  showErrorNotification,
  showInvitationUI,
  showRoomFullNotification
} from "./ui.js";
import { VideoUI } from "./videoUI.js";
import { WebRTCClient } from "./webrtcClient.js";
import * as Y from "https://cdn.jsdelivr.net/npm/yjs@13.6.18/+esm";

let ydoc = new Y.Doc();

export let webrtcClient;
export let videoUI;

export function setupYjsClient(webcam) {
  webrtcClient = new WebRTCClient();
  webrtcClient.onRoomJoined = (roomId) => {
    console.log("[BICI] Room joined:", roomId);
    showInvitationUI(roomId);

    // Initialize Yjs after room is joined to use room-specific document
    console.log("[BICI] Calling initializeYjs with roomId:", roomId);
    try {
      initializeYjs(roomId);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle room full error
  webrtcClient.onRoomFull = (roomId) => {
    console.error("Room is full:", roomId);
    showRoomFullNotification(roomId);
  };

  webrtcClient.onRemoteStreamAdded = () => {
    const peerStatus = document.getElementById("peer-status");
    if (peerStatus) {
      peerStatus.textContent = "Peer connected";
      peerStatus.style.color = "#4CAF50";
    }
  };

  webrtcClient.onRemoteStreamRemoved = () => {
    const peerStatus = document.getElementById("peer-status");
    if (peerStatus) {
      peerStatus.textContent = "Peer disconnected";
      peerStatus.style.color = "#f44336";
    }
  };

  webrtcClient
    .init()
    .then((localStream) => {
      console.log("[BICI] WebRTC initialized successfully");

      // Set the webcam stream to use WebRTC's local stream
      // This eliminates dual webcam access conflict
      webcam.srcObject = localStream;
      console.log("[BICI] Set webcam to use WebRTC stream");

      videoUI = new VideoUI(webrtcClient);
      videoUI.setLocalStream(localStream);
      // Yjs will be initialized after room is joined
    })
    .catch((error) => {
      console.error("[BICI] Failed to initialize WebRTC:", error);

      // Show user-friendly error notification
      showErrorNotification(
        "Camera/Microphone Access Error",
        error.userMessage || "Could not access camera or microphone.",
        `Error: ${error.name}\nMessage: ${error.message}`
      );
    });
}

export function yjsBindCodeArea(codeArea) {
  // Setup textarea binding
  const textarea = codeArea.textarea;
  const ytext = ydoc.getText("codemirror");

  let isLocalUpdate = false;

  // Use window.isReloading for global state shared with codeArea.js
  window.isReloading = window.isReloading || false;
  // When Yjs text changes, update textarea
  ytext.observe((event) => {
    if (isLocalUpdate) return;
    isLocalUpdate = true;
    const newText = ytext.toString();

    // Check if slider marker was added (slider reload trigger)
    const hasSliderMarker = newText.includes("\u200B");

    // Only update textarea and reload when there's a trigger
    // NOT on every keystroke from remote user
    if (window.isReloading || hasSliderMarker || window.isShift) {
      // Update textarea with Yjs text
      if (textarea.value !== newText) {
        const cursorPos = textarea.selectionStart;
        textarea.value = newText;
        // Try to restore cursor position
        textarea.selectionStart = textarea.selectionEnd = Math.min(
          cursorPos,
          newText.length
        );
      }

      codeArea.callback?.();
      window.isReloading = false;
    }

    isLocalUpdate = false;
  });

  // When textarea changes, update Yjs text
  textarea.addEventListener("input", () => {
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
        newText = newText + "\u200B";
      }

      ydoc.transact(() => {
        ytext.delete(0, currentText.length);
        ytext.insert(0, newText);
      });
    }
    isLocalUpdate = false;
  });
}

export function yjsBindPen(pen) {
  // Setup Yjs pen strokes synchronization
  const ypenStrokes = ydoc.getArray("penStrokes");
  let isUpdatingFromYjs = false;

  // All clients observe pen strokes changes and render
  ypenStrokes.observe((event) => {
    // Master client already has the correct pen.strokes locally
    // Only secondary clients need to update from Yjs
    if (webrtcClient.isMaster()) {
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
}

// Initialize Yjs for collaborative editing (called after room is joined)
function initializeYjs(roomId) {
  console.log("[BICI] initializeYjs called with roomId:", roomId);
  
  // Create separate WebSocket for Yjs (different from WebRTC signaling)
  // Scope Yjs document to room
  const docName = roomId ? `bici-code-editor-${roomId}` : "bici-code-editor";

  console.log(
    "[BICI] Creating Yjs WebSocket connection for document:",
    docName
  );

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const yjsWs = new WebSocket(
    `${protocol}//${window.location.host}/${docName}`
  );
  yjsWs.binaryType = "arraybuffer";

  yjsWs.onopen = () => {
    console.log("Yjs WebSocket connected");
  };

  yjsWs.onmessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      const update = new Uint8Array(event.data);
      Y.applyUpdate(ydoc, update);
    }
  };

  // Send Yjs updates through the dedicated Yjs WebSocket
  ydoc.on("update", (update) => {
    if (yjsWs.readyState === WebSocket.OPEN) {
      yjsWs.send(update);
    }
  });

  console.log("Yjs collaborative editing initialized");
}
