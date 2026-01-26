import { drawVideoToCover } from "./modules/canvasUtils.js";
import { CodeArea } from "./modules/ui/codeArea.js";
import { SlideDeck } from "./modules/ui/slideDeck.js";
import { displayHelp } from "./modules/ui/help.js";
import { initKeyHandler } from "./modules/keyEvent.js";
import { Mediapipe } from "./modules/mediapipe/mediapipe.js";
import { Pen } from "./modules/pen.js";
import { SceneManager } from "./modules/ui/scene.js";
import { fetchText } from "./modules/utils.js";
import {
  webrtcClient,
  videoUI,
  setupYjsClient,
  yjsBindCodeArea,
  yjsBindPen
} from "./modules/yjs/yjs.js";
import { trackingUpdate } from "./modules/mediapipe/tracking.js";
import { initializeDomTracking, updateDomFocus } from "./modules/mediapipe/domFocus.js";

const DOM = {
    projectSelector: document.getElementById("project-selector"),
    projectSwitcher: document.getElementById("project-switcher"),
    projectSwitchBtn: document.getElementById("project-switch-btn"),
    projectLabel: document.getElementById("current-project"),
    projectGrid: document.getElementById("project-grid"),
    canvas2D: document.getElementById("canvas-2d"),
    canvas3D: document.getElementById("canvas-3d"),
    ocanvas: document.getElementById("canvas-overlay"),
    webcam: document.getElementById("webcam"),
    textarea: document.getElementById("code-editor")
};

const ctx = DOM.canvas2D.getContext("2d");
const octx = DOM.ocanvas.getContext("2d");

// Expose window drawing globally
window.CTX = ctx;
window.OCTX = octx;

window.WIDTH = window.innerWidth;
window.HEIGHT = window.innerHeight;

const codeArea = new CodeArea(DOM.textarea);
const sceneManager = new SceneManager(DOM.canvas3D, codeArea);
const slideDeck = new SlideDeck();
const pen = new Pen();
const mediapipe = new Mediapipe(DOM.webcam)

function resizeStage() {
  window.DPR = window.devicePixelRatio;

  window.WIDTH = window.innerWidth;
  window.HEIGHT = window.innerHeight;

  DOM.canvas2D.width = DOM.ocanvas.width = WIDTH * DPR;
  DOM.canvas2D.height = DOM.ocanvas.height = HEIGHT * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  octx.setTransform(DPR, 0, 0, DPR, 0, 0);

  slideDeck.rect.left = WIDTH - 520;
}

async function init() {
  resizeStage();
  initializeDomTracking({codeArea, sceneManager, slideDeck});
  
  // Collaboration
  initKeyHandler({codeArea, sceneManager, slideDeck, pen, mediapipe});
  await setupYjsClient(DOM.webcam);
  yjsBindCodeArea(codeArea);
  yjsBindPen(pen)

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
    slidesList = slidesList.split('\n')
    await slideDeck.init(name, slidesList)
  }
  
  // pass necessary components for scene to access through context 
  sceneManager.setProject(name, {});
  await sceneManager.load(1)

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
  let backgroundVideo = hasRemoteVideo ? videoUI.remoteVideo : webcam;

  drawVideoToCover(ctx, backgroundVideo, WIDTH, HEIGHT, !hasRemoteVideo);

  codeArea.update();
  slideDeck.draw(ctx);
  pen.draw(ctx);
  sceneManager.update();
  displayHelp(ctx, codeArea.fontSize)

  mediapipe.predict();
  trackingUpdate(mediapipe);
  updateDomFocus(codeArea, pen)

  requestAnimationFrame(animate);
}

init();
