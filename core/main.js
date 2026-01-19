import { CodeArea } from "./modules/components/codeArea.js";
import { SceneCanvas } from "./modules/components/sceneCanvas.js";
import { SlideDeck } from "./modules/components/slides.js";
import { gl_start } from "./modules/webgl.js";
import { setupYjsClient, yjsBindCodeArea } from "./modules/yjs/yjs.js";

async function fetchText(file) {
  try {
    const response = await fetch(file);
    return await response.text();
  } catch (error) {
    console.error(`Failed to get text from file ${file}:`, error)
  }
}

const currentProject = {}

const projectSelector = document.getElementById("project-selector");
const projectSwitcher = document.getElementById("project-switcher");
const projectSwitchBtn = document.getElementById("project-switch-btn");
const currentProjectLabel = document.getElementById("current-project");
const projectGrid = document.getElementById("project-grid");

projectSwitchBtn.addEventListener("click", () => {
  projectSelector.classList.remove("hidden");
})

projectGrid.addEventListener("click", (e) => {
  const projectName = e.target.dataset.project;
  if(projectName) loadProject(projectName);
})

async function loadProject(name) {
  currentProject.name = name;
  let slidesList = (await fetchText(`projects/${name}/slides.txt`))?.split('\n');
  if(slidesList) {
    currentProject.slideDeck = new SlideDeck(name, slidesList);
  }

  currentProjectLabel.textContent = currentProject.name;
  projectSwitcher.style.display = 'block';
  projectSelector.style.display = 'none';

  await loadScene(1);
}

async function loadScene(num) {
  const scenePath = `../projects/${currentProject.name}/scenes/scene${num}.js`
  let sceneModule;

  try {
    sceneModule = await import(scenePath + "?t=" + Date.now()); // cache busting
    if (!sceneModule.Scene) {
      throw new Error(`Scene ${num} does not export a Scene class.`);
    }
  } catch(e) {
    console.error(`Failed to load scene ${num} of project ${currentProject.name}:`, e)
  }

  currentProject.scene = new sceneModule.Scene();
  currentProject.sceneText = await fetchText(scenePath);
  
  codeArea.textarea.value = currentProject.sceneText;
  sceneCanvas.registerSceneEvents(currentProject.scene);

  gl_start(sceneCanvas.canvas, currentProject.scene)
  console.log(currentProject)
}

const webcam = document.getElementById("webcam");
const webrtcClient = setupYjsClient(webcam);
const sceneCanvas = new SceneCanvas(document.getElementById('canvas-3d'))
const codeArea = new CodeArea(document.getElementById('code-editor'))

yjsBindCodeArea(codeArea);

let startTime = Date.now() / 1000;
let timePrev = startTime;

const ctx = document.getElementById('canvas-2d').getContext('2d');

function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() / 1000;
  const deltaTime = time - timePrev;
  timePrev = time;

   // Clear the overlay canvas before doing anything else for this animation frame.
  //  octx.clearRect(0,0,screen.width,screen.height);

   // Video source is remote video if available, otherwise webcam
  //  if (videoUI && videoUI.hasRemoteVideo) {
  //     videoUI.update();
  //     videoSrc = videoUI.canvas;
  //  } else
  //     videoSrc = webcam;

  //  let p = webcam.update();
  //  codeArea.update();
  //  ctx.drawImage(webcam.canvas, 0,0,640,440, 0,0,w,h);

  const { slideDeck, scene } = currentProject
  slideDeck?.draw(ctx);
  codeArea?.update();
  scene?.update();
}

animate()
