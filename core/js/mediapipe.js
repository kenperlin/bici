function initHands() {
  const hands = new Hands({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  const canvas = document.getElementById("handCanvas");
  canvas.style.position = 'fixed';
  canvas.style.zIndex = '9999';
  const ctx = canvas.getContext("2d");
  canvas.width = screen.width;
  canvas.height = screen.height;

  hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.multiHandLandmarks) {
        console.log("Detected:", results.multiHandLandmarks);
        results.multiHandLandmarks.forEach((landmarks) => {
        landmarks.forEach((lm) => {
            const x = (1 - lm.x) * canvas.width;  // mirror horizontally
            const y = lm.y * (canvas.height + 80);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
            });
        })
    }
  });

  async function processFrame() {
    if (!window.webcam || window.webcam.videoWidth === 0 || window.webcam.videoHeight === 0) {
      requestAnimationFrame(processFrame);
      return;
    }
    await hands.send({ image: window.webcam });
    requestAnimationFrame(processFrame);
  }

  function startIfReady() {
    if (window.webcam && window.webcam.videoWidth > 0) {
      console.log("Webcam ready, start frame loop");
      processFrame();
      return true;
    }
    return false;
  }

  window.webcam.addEventListener("canplay", () => {
    if (!startIfReady()) {
      const checkDims = setInterval(() => {
        if (startIfReady()) clearInterval(checkDims);
      }, 100);
    }
  });

  const watchdog = setInterval(() => {
    if (startIfReady()) clearInterval(watchdog);
  }, 500);
}

const waitForWebcam = setInterval(() => {
  if (window.webcam) {
    clearInterval(waitForWebcam);
    initHands();
  }
}, 100);
