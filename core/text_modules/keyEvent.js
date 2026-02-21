import { toggleHelp } from "./ui/help.js";
import { trackingState, mediapipeState } from "./mediapipe/state.js";
import { videoState } from "./ui/video.js";

let sendStateToYjs;
let textarea;

export let state = {
  isShift: false,
  isAlt: false
};

export function initKeyHandler(codeArea, stateUpdateFn) {
  sendStateToYjs = stateUpdateFn;
  textarea = codeArea;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
}

function handleKeyDown(e) {
  if (document.activeElement === textarea.element) return;
  if (e.key.startsWith("Arrow")) e.preventDefault();

  switch (e.key) {
    case "Alt": state.isAlt = true; break;
    case "Shift": state.isShift = true; break;
  }
}

function handleKeyUp(e) {
  if (document.activeElement === textarea.element) return;
  if (e.key.startsWith("Arrow")) e.preventDefault();

  const key = e.key;
  if (state.isAlt) handleAltCommand(key);
  else handleCommand(key);
}

function handleCommand(key) {
  let commandTriggered = true;
  switch (key) {
    case "Alt": state.isAlt = false; break;
    case "Shift": state.isShift = false; break;

    // CodeArea commands
    case "ArrowUp": textarea.increaseFontSize(); break;
    case "ArrowDown": textarea.decreaseFontSize(); break;

    // Mediapipe + tracking commands
    case "M": mediapipeState.toggleRunning(); break;
    case "V": 
      mediapipeState.toggleDebug();
      trackingState.toggleDebug();
      break;
    case "F": trackingState.isFramingHands = !trackingState.isFramingHands; break;
    case "N": trackingState.isObvious = !trackingState.isObvious; break;
    case "H": trackingState.isSeparateHandAvatars = !trackingState.isSeparateHandAvatars; break;
    case "S": trackingState.isScalingHandAvatars = !trackingState.isScalingHandAvatars; break;
    case "W": videoState.isVisible = !videoState.isVisible; break;
    
    case "h": toggleHelp(); break;
    default: commandTriggered = false;
  }
  if(commandTriggered) sendStateToYjs();
}
