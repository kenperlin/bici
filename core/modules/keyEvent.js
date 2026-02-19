import { toggleHelp } from "./ui/help.js";
import { trackingState, mediapipeState } from "./mediapipe/state.js";
import { webrtcClient } from "./yjs/yjs.js";

let controller;

export let state = {
  isShift: false,
  isAlt: false
};

export function initKeyHandler(appController) {
  controller = appController;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("mousemove", (e) => {
    controller.triggerMove("/", e.clientX, e.clientY, 0);
  });
}

function handleKeyDown(e) {
  if (controller.getActiveTargetId() === "code") return;
  if (e.key.startsWith("Arrow")) e.preventDefault();

  switch (e.key) {
    case "Alt": state.isAlt = true; break;
    case "Shift": state.isShift = true; break;
    case "/": controller.triggerDown("/"); break;
  }
}

function handleKeyUp(e) {
  if (controller.getActiveTargetId() === "code") return;
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
  if (key >= "0" && key <= "9") {
    controller.sceneManager.load(key, { codeArea: controller.codeArea });
    return;
  }

  switch (key) {
    case "Alt": state.isAlt = false; break;
    case "Shift": state.isShift = false; break;
    case "/": controller.triggerUp("/"); break;

    // CodeArea commands
    case "ArrowUp": controller.codeArea.increaseFontSize(); break;
    case "ArrowDown": controller.codeArea.decreaseFontSize(); break;
    case "c": controller.toggleVisible("code"); break;

    // Slides commands
    case "ArrowLeft": controller.slideManager.prev(); break;
    case "ArrowRight": controller.slideManager.next(); break;
    case "i": controller.toggleVisible("slide"); break;
    case "o": controller.slideManager.toggleOpaque(); break;

    // Scene commands
    case "s": controller.toggleVisible("scene"); break;

    // Mediapipe + tracking commands
    case "M": mediapipeState.toggleRunning(); break;
    case "V": 
      mediapipeState.toggleDebug();
      trackingState.toggleDebug();
      break;
    case "F": trackingState.isFramingHands = !trackingState.isFramingHands; break;
    case "L": trackingState.isLarge = !trackingState.isLarge; break;
    case "N": trackingState.isObvious = !trackingState.isObvious; break;
    case "H": trackingState.isSeparateHandAvatars = !trackingState.isSeparateHandAvatars; break;

    // Pen commands
    case ",": controller.pen.width *= 0.707; break;
    case ".": controller.pen.width /= 0.707; break;
    case "[": controller.pen.setColor("#ff0000"); break;
    case "]": controller.pen.setColor("#0080ff"); break;
    case "\\": controller.pen.setColor("#000000"); break;
    case "Backspace": state.isShift ? controller.pen.clear() : controller.pen.delete(); break;

    case "h": toggleHelp(); break;
  }
}
