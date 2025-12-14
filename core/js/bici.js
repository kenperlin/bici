let loadScript = (src, callback) => {
    const script = document.createElement('script');
    src = src.trim();
    src = src.indexOf('/') < 0 ? 'core/js/' + src + '.js' : src;
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => callback ? callback() : null;
    script.onerror = () => { }
    document.head.appendChild(script);
}

let loadScripts = (names, callback, index = 0) => {
   if (index < names.length)
      loadScript(names[index], () => {
         if (index < names.length-1)
            loadScripts(names, callback, index+1);
         else if (callback)
            callback();
      });
}

async function getFile(file, callback) {
    try {
        const response = await fetch(file);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        callback(await response.text());
    } catch (error) { }
}

// Core scripts - loaded once at startup (includes WebRTC)
let coreFiles = `M4, loadImage, webgl, webcam, trackHead, help,
	        midi, numberString, pen, keyEvent, matchCurves,
	        glyphs, chalktalk, codeArea, math, shape, shader,
	        diagram, webrtc-client, video-ui, implicit,
		mediapipe, tracking, main`.split(',');

let project, slideData;
let coreLoaded = false;
let projectSelectorUI = null;

// Load core scripts immediately (called on page load)
let loadCore = (callback) => {
   if (coreLoaded) {
      if (callback) callback();
      return;
   }
   loadScripts(coreFiles, () => {
      coreLoaded = true;
      if (callback) callback();
   });
}

// Load project-specific content (can be called multiple times to switch projects)
let loadProject = projectName => {
   project = projectName;
   
   // Hide project selector if visible
   if (projectSelectorUI) {
      projectSelectorUI.style.display = 'none';
   }
   
   getFile('projects/' + project + '/slides.txt', s => {
      slideData = s.split('\n');
      
      // If core is already loaded, just initialize the project
      if (coreLoaded) {
         if (typeof initProject === 'function') {
            initProject();
         }
      } else {
         // First time - load core scripts then init
         loadCore(() => {
            if (typeof initProject === 'function') {
               initProject();
            }
         });
      }
   });
}

// Show project selector UI
let showProjectSelector = () => {
   if (projectSelectorUI) {
      projectSelectorUI.style.display = 'flex';
   }
}

