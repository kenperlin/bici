import { showErrorNotification, showInvitationUI, showRoomFullNotification } from "./ui.js";
import { VideoUI } from "./videoUI.js";
import { WebRTCClient } from "./webrtcClient.js";
import * as Y from "https://esm.sh/yjs@^13";
import { WebsocketProvider } from "https://esm.sh/y-websocket@^3";
import { peerTrackingState } from "../mediapipe/state.js";

export let ydoc = new Y.Doc();
export let webrtcClient;
export let videoUI;

let yjsWsProvider;

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

export function getYjsAwareness() {
  return yjsWsProvider?.awareness;
}

// Initialize Yjs for collaborative editing (called after room is joined)
function initializeYjs(roomId) {
  console.log("[BICI] initializeYjs called with roomId:", roomId);

  // Create separate WebSocket for Yjs (different from WebRTC signaling)
  // Scope Yjs document to room
  const docName = roomId ? `bici-code-editor-${roomId}` : "bici-code-editor";

  console.log("[BICI] Creating Yjs WebSocket connection for document:", docName);

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;
  yjsWsProvider = new WebsocketProvider(wsUrl, docName, ydoc);
  yjsWsProvider.on("status", (event) => {
    console.log("Yjs WebSocket provider status:", event.status);
  });

  const awareness = getYjsAwareness();
  awareness.on("change", () => {
    const states = awareness.getStates();
    states.forEach((state) => {
      peerTrackingState[state.id] = state
    });
  });

  console.log("Yjs collaborative editing initialized");
}
