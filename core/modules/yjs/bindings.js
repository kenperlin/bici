import { mediapipeState, trackingState } from "../mediapipe/state.js";
import { helpState } from "../ui/help.js";
import { videoState } from "../ui/video.js";
import { debounce } from "../utils/utils.js";
import { getYjsAwareness, webrtcClient, ydoc } from "./yjs.js";

let appState;

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
        reloadVersion = (ycontrol.get("version") || 0) + 1;
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
    if (txn.local) return;
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

export function yjsBindAppState({ codeArea, slideManager, sceneManager }) {
  appState = {
    slideNum: {
      get: () => slideManager.currentSlide,
      set: (val) => slideManager.setSlide(val)
    },
    slideIsVisible: {
      get: () => slideManager.canvas.isVisible,
      set: (val) => slideManager.canvas.setVisible(val)
    },
    slideIsOpaque: {
      get: () => slideManager.canvas.isOpaque,
      set: (val) => slideManager.canvas.setOpaque(val)
    },
    sceneNum: {
      get: () => sceneManager.sceneNum,
      set: (val) => sceneManager.load(val, { codeArea })
    },
    sceneIsVisible: {
      get: () => sceneManager.canvas.isVisible,
      set: (val) => sceneManager.canvas.setVisible(val)
    },
    codeIsVisible: {
      get: () => codeArea.isVisible,
      set: (val) => codeArea.setVisible(val)
    },
    codeFontSize: {
      get: () => codeArea.fontSize,
      set: (val) => codeArea.setFontSize(val)
    },
    helpIsVisible: {
      get: () => helpState.isVisible,
      set: (val) => (helpState.isVisible = val)
    },
    videoIsVisible: {
      get: () => videoState.isVisible,
      set: (val) => (videoState.isVisible = val)
    }
  };

  const ystate = ydoc.getMap("appState");

  ystate.observe((event, txn) => {
    if (txn.local) return;
    const changed = event.keysChanged;
    const s = ystate.toJSON();
    for (const key of changed) {
      if (appState[key] && s[key] != null) appState[key].set(s[key]);
    }
  });
}

export function updateAppState() {
  const ystate = ydoc.getMap("appState");
  
  ydoc.transact(() => {
    for (const key in appState) {
      const next = appState[key].get();
      const prev = ystate.get(key);
      if (prev !== next) ystate.set(key, next);
    }
  });
}

export function updateUserState() {
  getYjsAwareness()?.setLocalState({
    id: webrtcClient.myClientId,
    handResults: mediapipeState.handResults,
    headX: trackingState.headX,
    headY: trackingState.headY,
    eyeOpen: trackingState.eyeOpen,
    eyeGazeX: trackingState.eyeGazeX,
    eyeGazeY: trackingState.eyeGazeY,
    gestures: trackingState.gestures,
    handAvatar: {
      left: { x: 0, y: 0, s: 1 },
      right: { x: 0, y: 0, s: 1 }
    }
  });
}
