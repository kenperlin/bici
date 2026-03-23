import { displayHelp } from "./ui/help.js";
import { initKeyHandler } from "./keyEvent.js";
import { initMediapipe, mediapipePredict } from "./mediapipe/mediapipe.js";
import { videoUI, setupYjsClient } from "./yjs/yjs.js";
import { updateTracking } from "./mediapipe/tracking/tracking.js";
import { mediapipeState } from "./mediapipe/state.js";
import { initGestureTracker, updateGesture } from "./mediapipe/tracking/gesture.js";
import { drawVideoToCover } from "./ui/video.js";
import { TextArea } from "./ui/textarea.js";
import { fetchText } from "./utils.js";
import {
  updateAppState,
  updateUserState,
  yjsBindAppState,
  yjsBindTextArea
} from "./yjs/bindings.js";
import { SpeechDetector } from "./speech.js";

const DOM = {
  projectSelector: document.getElementById("project-selector"),
  projectSwitcher: document.getElementById("project-switcher"),
  projectSwitchBtn: document.getElementById("project-switch-btn"),
  projectLabel: document.getElementById("current-project"),
  projectGrid: document.getElementById("project-grid"),
  canvas2D: document.getElementById("canvas-2d"),
  canvasSlide: document.getElementById("canvas-slide"),
  canvasScene: document.getElementById("canvas-scene"),
  canvasOverlay: document.getElementById("canvas-overlay"),
  webcam: document.getElementById("webcam"),
  textarea: document.getElementById("code-editor")
};

const mouse = {
  x: 0,
  y: 0
};
const ctx = DOM.canvas2D.getContext("2d");
const octx = DOM.canvasOverlay.getContext("2d");

// Expose window overlay drawing globally
window.OCTX = octx;
window.CTX = ctx;

window.WIDTH = window.innerWidth;
window.HEIGHT = window.innerHeight;

const textarea = new TextArea(DOM.textarea);
const speechDetector = new SpeechDetector();

function resizeStage() {
  window.DPR = window.devicePixelRatio;

  window.WIDTH = window.innerWidth;
  window.HEIGHT = window.innerHeight;

  DOM.canvas2D.width = DOM.canvasOverlay.width = WIDTH * DPR;
  DOM.canvas2D.height = DOM.canvasOverlay.height = HEIGHT * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  octx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

async function init() {
  resizeStage();

  // Collaboration
  await setupYjsClient(DOM.webcam);
  yjsBindTextArea(textarea);
  yjsBindAppState(textarea);

  initMediapipe();
  initGestureTracker();
  initKeyHandler(textarea, updateAppState);

  // Event listeners
  window.addEventListener("resize", resizeStage);
  DOM.projectSwitchBtn.addEventListener("click", () => {
    DOM.projectSelector.style.display = "flex";
  });

  DOM.projectGrid.addEventListener("click", (e) => {
    speechDetector.init();
    const projectName = e.target.dataset.project;
    if (projectName) loadProject(projectName);
  });

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // App
  requestAnimationFrame(animate);
}

async function loadProject(name) {
  const text = await fetchText(`text/${name}.txt`);
  textarea.element.value = text;

  DOM.projectLabel.textContent = name;
  DOM.projectSwitcher.style.display = "block";
  DOM.projectSelector.style.display = "none";
}

let timePrev = Date.now() / 1000;

function animate() {
  const time = Date.now() / 1000;
  const deltaTime = time - timePrev;
  timePrev = time;

  //  Clear the overlay canvas before doing anything else for this animation frame.
  octx.clearRect(0, 0, WIDTH, HEIGHT);

  // Video source is remote video if available, otherwise webcam
  let hasRemoteVideo = videoUI?.hasRemoteVideo();
  let backgroundVideo = hasRemoteVideo ? videoUI.remoteVideo : DOM.webcam;

  drawVideoToCover(ctx, backgroundVideo, !hasRemoteVideo);

  displayHelp(ctx, textarea.fontSize);

  mediapipePredict(DOM.webcam);
  if (mediapipeState.isReady && mediapipeState.isRunning) {
    updateTracking();
    updateGesture();
    updateUserState();
  }

  speechDetector.update();

  // textarea.highlightRange(textarea.element.selectionStart, textarea.element.selectionEnd);
  // textarea.highlightCharAt(mouse.x, mouse.y, "rgba(255, 0, 0, 0.5)");
  switch (speechDetector.currentUnit) {
    case "word":
      textarea.highlightSegmentAt(mouse.x, mouse.y, "word", "rgba(0, 128, 255, 0.5)");
      break;
    case "sentence":
      textarea.highlightSegmentAt(mouse.x, mouse.y, "sentence", "rgba(128, 255, 0, 0.5)");
      break;
    case "paragraph":
      textarea.highlightParagraphAt(mouse.x, mouse.y, "rgba(255, 255, 0, 0.5)");
      break;
  }
  
  requestAnimationFrame(animate);
}

init();
