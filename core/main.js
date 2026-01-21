import { drawVideoToCover } from "./modules/canvasUtils.js";
import { CodeArea } from "./modules/components/codeArea.js";
import { SceneCanvas } from "./modules/components/sceneCanvas.js";
import { SlideDeck } from "./modules/components/slides.js";
import { gl_start } from "./modules/webgl.js";
import {
  videoUI,
  setupYjsClient,
  yjsBindCodeArea,
  yjsBindPen
} from "./modules/yjs/yjs.js";

async function fetchText(file) {
  try {
    const response = await fetch(file);
    return await response.text();
  } catch (error) {
    console.error(`Failed to get text from file ${file}:`, error);
  }
}

async function loadProject(name) {
  currentProject.name = name;
  let slidesList = (await fetchText(`projects/${name}/slides.txt`))?.split(
    "\n"
  );
  if (slidesList) {
    currentProject.slideDeck = new SlideDeck(name, slidesList);
  }

  currentProjectLabel.textContent = currentProject.name;
  projectSwitcher.style.display = "block";
  projectSelector.style.display = "none";

  await loadScene(1);
}

async function loadScene(num) {
  const scenePath = `../projects/${currentProject.name}/scenes/scene${num}.js`;
  let sceneModule;

  try {
    sceneModule = await import(scenePath + "?t=" + Date.now()); // cache busting
    if (!sceneModule.Scene) {
      throw new Error(`Scene ${num} does not export a Scene class.`);
    }
  } catch (e) {
    console.error(
      `Failed to load scene ${num} of project ${currentProject.name}:`,
      e
    );
  }

  currentProject.sceneNum = num;
  currentProject.sceneModule = sceneModule;
  currentProject.scene = new sceneModule.Scene();

  codeArea.textarea.value = await fetchText(scenePath);
  sceneCanvas.registerSceneEvents(currentProject.scene);

  gl_start(sceneCanvas.canvas, currentProject.scene);
  console.log(currentProject);
}

const currentProject = {};

const projectSelector = document.getElementById("project-selector");
const projectSwitcher = document.getElementById("project-switcher");
const projectSwitchBtn = document.getElementById("project-switch-btn");
const currentProjectLabel = document.getElementById("current-project");
const projectGrid = document.getElementById("project-grid");

projectSwitchBtn.addEventListener("click", () => {
  projectSelector.style.display = "flex";
});

projectGrid.addEventListener("click", (e) => {
  const projectName = e.target.dataset.project;
  if (projectName) loadProject(projectName);
});

const canvas = document.getElementById("canvas-2d");
const ocanvas = document.getElementById("canvas-overlay");
const ctx = canvas.getContext("2d");
const octx = ocanvas.getContext("2d");

function resizeStage() {
  const dpr = window.devicePixelRatio;

  window.WIDTH = window.innerWidth;
  window.HEIGHT = window.innerHeight;

  canvas.width = ocanvas.width = WIDTH * dpr;
  canvas.height = ocanvas.height = HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeStage();
window.addEventListener("resize", resizeStage);


const webcam = document.getElementById("webcam");
setupYjsClient(webcam);

const sceneCanvas = new SceneCanvas(document.getElementById("canvas-3d"));
const codeArea = new CodeArea(document.getElementById("code-editor"));
codeArea.onReloadScene = async (code) => {
  const url = URL.createObjectURL(
    new Blob([code], { type: "text/javascript" })
  );
  currentProject.scene = new (await import(url)).Scene();
  sceneCanvas.registerSceneEvents(currentProject.scene);
  gl_start(sceneCanvas.canvas, currentProject.scene);
};

// const pen = new Pen();

// pen.setContext(ctx)
// yjsBindPen(pen);
yjsBindCodeArea(codeArea);

let startTime = Date.now() / 1000;
let timePrev = startTime;

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() / 1000;
  const deltaTime = time - timePrev;
  timePrev = time;

  //  Clear the overlay canvas before doing anything else for this animation frame.
  octx.clearRect(0, 0, WIDTH, HEIGHT);

  // Video source is remote video if available, otherwise webcam
  let hasRemoteVideo = videoUI?.hasRemoteVideo();
  let backgroundVideo = hasRemoteVideo ? videoUI.remoteVideo : webcam;

  drawVideoToCover(ctx, backgroundVideo, WIDTH, HEIGHT, !hasRemoteVideo);

  const { slideDeck, scene } = currentProject;
  codeArea.update();
  slideDeck?.draw(ctx);
  scene?.update();
}

animate();
