import { toggleHelp } from "./ui/help.js";
import { state as trackingState } from "./mediapipe/trackingState.js";
import { state as mediapipeState } from "./mediapipe/mediapipe.js";
import { webrtcClient } from "./yjs/yjs.js";

let appContext = {};

export let state = {
  isShift: false,
  isAlt: false
};

export function initKeyHandler(context) {
  appContext = context;
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function triggerMouseEvent(type) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true
  });
  window.dispatchEvent(event);
}

function handleKeyDown(e) {
  if (document.activeElement === appContext.codeArea?.element) return;
  if (e.key.startsWith("Arrow")) e.preventDefault();

  switch (e.key) {
    case "Alt": state.isAlt = true; break;
    case "Shift": state.isShift = true; break;
    case "/": triggerMouseEvent("mousedown"); break;
  }
}

function handleKeyUp(e) {
  if (document.activeElement === appContext.codeArea?.element) return;
  if (e.key.startsWith("Arrow")) e.preventDefault();

  const key = e.key;
  if (!webrtcClient?.isMaster()) {
    webrtcClient.sendAction({ type: "keyUp", key });
  }

  if (state.isAlt) handleAltCommand(key);
  else handleCommand(key);

  if (webrtcClient?.isMaster()) {
    // broadcast state
  }
}

function handleCommand(key) {
  const { codeArea, slideDeck, sceneManager, pen } = appContext;

  if (key >= "0" && key <= "9") {
    sceneManager.load(key);
    return;
  }

  switch (key) {
    case "Alt": state.isAlt = false; break;
    case "Shift": state.isShift = false; break;
    case "/": triggerMouseEvent("mouseup"); break;

    // CodeArea commands
    case "ArrowUp": codeArea.setFontSize(codeArea.fontSize * 1.1); break;
    case "ArrowDown": codeArea.setFontSize(codeArea.fontSize / 1.1); break;
    case "c": codeArea.toggleVisible(); break;

    // Slides commands
    case "ArrowLeft": slideDeck.prev(); break;
    case "ArrowRight": slideDeck.next(); break;
    case "i": slideDeck.toggleVisible(); break;
    case "o": slideDeck.toggleOpaque(); break;

    // Scene commands
    case "s": sceneManager.toggleVisible(); break;

    // Mediapipe + tracking commands
    case "M": mediapipeState.toggleRunning(); break;
    case "V": 
      mediapipeState.toggleDebug();
      trackingState.toggleDebug();
      break;
    case "F": trackingState.frameHands = !trackingState.frameHands; break;
    case "L": trackingState.isLarge = !trackingState.isLarge; break;
    case "N": trackingState.isObvious = !trackingState.isObvious; break;
    case "H": trackingState.isSeparateHandAvatars = !trackingState.isSeparateHandAvatars; break;

    // Pen commands
    case ",": pen.width *= 0.707; break;
    case ".": pen.width /= 0.707; break;
    case "[": pen.setColor("#ff0000"); break;
    case "]": pen.setColor("#0080ff"); break;
    case "\\": pen.setColor("#000000"); break;
    case "Backspace": state.isShift ? pen.clear() : pen.delete(); break;

    case "h": toggleHelp(); break;
  }
}
