import { SceneCanvas } from "./modules/components/sceneCanvas.js";
import { gl_start } from "./modules/webgl.js";

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
  currentProject.slides = (await fetchText(`projects/${name}/slides.txt`))?.split('\n');

  currentProjectLabel.textContent = name;
  projectSwitcher.style.display = 'block';
  projectSwitcher.style.left = 15;
  projectSwitcher.style.top = screen.height - 50;

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
  sceneCanvas.registerSceneEvents(currentProject.scene);

  gl_start(sceneCanvas.canvas, currentProject.scene)
  console.log(currentProject)
}

const COMPONENTS = {
  canvas2D: document.getElementById('canvas-2d'),
  canvas3D: document.getElementById('canvas-3d'),
  canvasOverlay: document.getElementById('canvas-overlay'),
}

const sceneCanvas = new SceneCanvas(document.getElementById('canvas-3d'))
