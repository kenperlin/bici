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

let loadScripts = (names, callback) => {
   loadScript(names[0], () => {
      names.shift();
      if (names.length)
         loadScripts(names, callback);
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

let project, slides;
let loadProject = projectName => {
   project = projectName;
   getFile('projects/' + project + '/slides.txt', s => {
      slides = s.split('\n');
      loadScripts(
         `M4, loadImage, webgl, webcam, trackHead, help,
	  midi, linefont, numberString, teapotData, pen,
	  keyEvent, matchCurves, glyphs, chalktalk,
	  codeArea, math, shape, shader, diagram,
	  webrtc-client, video-ui, main,
	  textSample, marching_cubes_table`.split(','));
   });
}

