import { drawVideoToCover } from "./modules/utils/canvasUtils.js";
import { CodeArea } from "./modules/ui/codeArea.js";
import { SlideManager } from "./modules/ui/SlideManager.js";
import { displayHelp } from "./modules/ui/help.js";
import { initKeyHandler } from "./modules/keyEvent.js";
import { initMediapipe, mediapipePredict } from "./modules/mediapipe/mediapipe.js";
import { Pen } from "./modules/pen.js";
import { SceneManager } from "./modules/ui/scene.js";
import { fetchText } from "./modules/utils/utils.js";
import {
  webrtcClient,
  videoUI,
  setupYjsClient,
  yjsBindCodeArea,
  yjsBindPen
} from "./modules/yjs/yjs.js";
import { updateTracking } from "./modules/mediapipe/tracking/tracking.js";
import { updateDomFocus } from "./modules/mediapipe/tracking/dom.js";
import { mediapipeState } from "./modules/mediapipe/state.js";
import { initGestureTracker, updateGesture } from "./modules/mediapipe/tracking/gesture.js";

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

const ctx = DOM.canvas2D.getContext("2d");
const octx = DOM.canvasOverlay.getContext("2d");

// Expose window overlay drawing globally
window.OCTX = octx;

window.WIDTH = window.innerWidth;
window.HEIGHT = window.innerHeight;

const sceneManager = new SceneManager(DOM.canvasScene);
const codeArea = new CodeArea(DOM.textarea);
const slideManager = new SlideManager(DOM.canvasSlide);
const pen = new Pen();

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
  initMediapipe();
  initGestureTracker({ sceneManager, codeArea, slideManager });
  initKeyHandler({ sceneManager, codeArea, slideManager, pen });
  codeArea.onReloadScene = sceneManager.hotReload.bind(sceneManager);

  // Collaboration
  await setupYjsClient(DOM.webcam);
  yjsBindCodeArea(codeArea);
  yjsBindPen(pen);

  // Event listeners
  window.addEventListener("resize", resizeStage);
  DOM.projectSwitchBtn.addEventListener("click", () => {
    DOM.projectSelector.style.display = "flex";
  });

  DOM.projectGrid.addEventListener("click", (e) => {
    const projectName = e.target.dataset.project;
    if (projectName) loadProject(projectName);
  });

  // App
  requestAnimationFrame(animate);
}

async function loadProject(name) {
  let slidesList = await fetchText(`projects/${name}/slides.txt`);

  if (slidesList) {
    slidesList = slidesList.split("\n");
    await slideManager.init(name, slidesList, { codeArea });
  }

  sceneManager.projectName = name;
  await sceneManager.load(1, { codeArea });

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

  drawVideoToCover(ctx, backgroundVideo, WIDTH, HEIGHT, !hasRemoteVideo);

  codeArea.update();
  slideManager.draw();
  pen.draw(ctx);
  sceneManager.update();
  displayHelp(ctx, codeArea.fontSize);

  mediapipePredict(DOM.webcam);
  if (mediapipeState.isReady && mediapipeState.isRunning) {
    updateTracking();
    updateGesture();
    updateDomFocus({sceneManager, codeArea, slideManager, pen});
  }

  requestAnimationFrame(animate);
}

init();
