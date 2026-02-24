import { debounce } from "../utils/utils.js";
import { showErrorNotification, showInvitationUI, showRoomFullNotification } from "./ui.js";
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
  const element = codeArea.element;
  const ytext = ydoc.getText("code");
  const ycontrol = ydoc.getMap("control");

  // When Yjs text changes, update textarea
  ytext.observe((event, txn) => {
    if (txn.local) return;
    const newText = ytext.toString();

    if (element.value !== newText) {
      const cursorPos = element.selectionStart;
      element.value = newText;
      element.selectionStart = element.selectionEnd = Math.min(cursorPos, newText.length);
    }
  });

  // Reload scene after debounce to allow text to update
  let reloadVersion = 0;
  const debouncedReload = debounce(() => (codeArea.isReloadScene = true), 100);
  ycontrol.observe((event) => {
    const newVersion = ycontrol.get("version") || 0;
    if (reloadVersion !== newVersion) {
      reloadVersion = newVersion;
      debouncedReload();
    }
  });

  // When textarea changes, update Yjs text
  codeArea.onValueChanged = () => {
    const currentText = ytext.toString();
    let newText = element.value;

    if (codeArea.isReloadScene) {
      ydoc.transact(() => {
        reloadVersion = (ycontrol.get("version") || 0) + 1
        ycontrol.set("version", reloadVersion);
      });
    }

    if (currentText !== newText) {
      ydoc.transact(() => {
        ytext.delete(0, currentText.length);
        ytext.insert(0, newText);
      });
    }
  };
}

export function yjsBindPen(pen) {
  // Setup Yjs pen strokes synchronization
  const ypenStrokesMap = ydoc.getMap("penStrokes");
  let isUpdatingFromYjs = false;

  ypenStrokesMap.observe((event, txn) => {
    if(txn.local) return;
    isUpdatingFromYjs = true;

    const allStrokes = [];
    ypenStrokesMap.forEach((clientStrokes) => allStrokes.push(...clientStrokes));
    pen.allStrokes.length = 0;
    pen.allStrokes.push(...allStrokes);

    isUpdatingFromYjs = false;
  });

  const doSync = () => {
    const clientId = webrtcClient.myClientId;
    ydoc.transact(() => {
      ypenStrokesMap.set(clientId, pen.strokes);
    });
    const allStrokes = [];
    ypenStrokesMap.forEach((clientStrokes) => allStrokes.push(...clientStrokes));
    pen.allStrokes.length = 0;
    pen.allStrokes.push(...allStrokes);
  };
  const debouncedSync = debounce(doSync, 100);

  // Set up callback to sync local pen changes to Yjs (only master will actually sync)
  pen.onStrokesChanged = () => {
    if (isUpdatingFromYjs) return;
    doSync();
    debouncedSync();
  };

  pen.onStrokesCleared = () => {
    if (isUpdatingFromYjs) return;
    ydoc.transact(() => {
      ypenStrokesMap.clear();
    });
    pen.allStrokes.length = 0;
  };
}

export function yjsBindAppState(appState) {
  const ystate = ydoc.getMap("appState");

  appState.onUpdate = () => {
    ydoc.transact(() => {
      for (const key in appState) {
        if (key === "onUpdate") continue;
        const next = appState[key].get();
        const prev = ystate.get(key);
        if (prev !== next) ystate.set(key, next);
      }
    });
  };

  ystate.observe((event, txn) => {
    if(txn.local) return;
    const changed = event.keysChanged;
    const s = ystate.toJSON();
    for (const key of changed) {
      if (appState[key] && s[key] != null) appState[key].set(s[key]);
    }
  });
}

// Initialize Yjs for collaborative editing (called after room is joined)
function initializeYjs(roomId) {
  console.log("[BICI] initializeYjs called with roomId:", roomId);

  // Create separate WebSocket for Yjs (different from WebRTC signaling)
  // Scope Yjs document to room
  const docName = roomId ? `bici-code-editor-${roomId}` : "bici-code-editor";

  console.log("[BICI] Creating Yjs WebSocket connection for document:", docName);

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const yjsWs = new WebSocket(`${protocol}//${window.location.host}/${docName}`);
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
