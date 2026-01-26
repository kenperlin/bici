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
  const { codeArea, slideDeck, sceneManager, pen, mediapipe } = appContext;

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
    case "M": mediapipe.toggleRunning(); break;

    // Pen commands
    case ",": pen.width *= 0.707; break;
    case ".": pen.width /= 0.707; break;
    case "[": pen.setColor("#ff0000"); break;
    case "]": pen.setColor("#0080ff"); break;
    case "\\": pen.setColor("#000000"); break;
    case "Backspace": state.isShift ? pen.clear() : pen.delete(); break;
  }
}

let URLs = {
  v: "http://cs.nyu.edu/~perlin/video_links.html",
  w: "https://kenperlin.com/web.html"
};

let isOpeningURL, isJumpingToSlide, isLoadingSrcFile;

let openURL = (key) => {
  let url = URLs[key];
  if (url) window.open(url, "_blank");
};

let choiceKey =
  "0123456789\
abcdefghijklmnopqrstuvwxyz\
ABCDEFGHIJKLMNOPQRSTUVWXYZ";

window.keyUp = (key) => {
  let toggleCode = () => codeArea.setVisible((isCode = !isCode));

  if (isOpeningURL) {
    isOpeningURL = false;
    openURL(key);
    return;
  }

  if (isJumpingToSlide) {
    let i = choiceKey.indexOf(key);
    if (i >= 0)
      slideIndex = Math.min(slides.length - 1, choiceKey.indexOf(key));
    isJumpingToSlide = false;
    return;
  }

  if (isLoadingSrcFile) {
    let i = choiceKey.indexOf(key);
    if (i >= 0 && i < srcFiles.length)
      getFile("core/js/" + srcFiles[i].trim() + ".js", (str) => {
        codeArea.getElement().value = str;
      });
    isLoadingSrcFile = false;
    if (!isCode) toggleCode();
    return;
  }
  
  switch (key) {
    case "F":
      tracking_frameHands = !tracking_frameHands;
      break;
    case "h":
      help.isHelp = !help.isHelp;
      break;
    case "L":
      tracking_isLarge = !tracking_isLarge;
      break;
    case "M":
      mediapipe.toggleRunning();
      break;
    case "N":
      tracking_isObvious = !tracking_isObvious;
      break;
    case "V":
      mediapipe.debugMode = !mediapipe.debugMode;
      tracking_debugMode = !tracking_debugMode;
      break;
  }
};
