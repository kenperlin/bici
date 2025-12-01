let mediapipe;
let tasks = {};

async function loadMediapipe() {
  mediapipe = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"
  );
}

const mediapipeCanvas = document.createElement("canvas");
mediapipeCanvas.id = "mediapipe-canvas";
mediapipeCanvas.style.position = "absolute";
mediapipeCanvas.style.top = "0";
mediapipeCanvas.style.left = "0";
mediapipeCanvas.style.zIndex = 1;
mediapipeCanvas.width = screen.width;
mediapipeCanvas.height = screen.height;
const canvasCtx = mediapipeCanvas.getContext("2d");

document.body.appendChild(mediapipeCanvas);

loadMediapipe()
  .then(() => {
    tasks.isRunning = true;
    tasks.drawUtils = new mediapipe.DrawingUtils(canvasCtx);

    console.log(mediapipe.VisionTaskOptions)
    const createHandLandmarker = async () => {
      const vision = await mediapipe.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      tasks.handLandmarker = await mediapipe.HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        }
      );
    };
    createHandLandmarker();

    const startPredictionLoop = setInterval(() => {
      if (
        webcam.srcObject && // userMedia is loaded
        tasks.handLandmarker && // landmarker is loaded
        videoSrc.readyState >= 2 // video has data
      ) {
        mediapipeRunning = true;
        predictWebcam();
        clearInterval(startPredictionLoop);
      }
    }, 100);
  })
  .catch((e) => {
    console.log("Error importing mediapipe");
    console.log(e);
  });

function predictWebcam() {
  let results = tasks.handLandmarker.detectForVideo(webcam, performance.now());
 
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, mediapipeCanvas.width, mediapipeCanvas.height);

  if (results.landmarks) {
    for (let i = 0; i < results.landmarks.length; i++) {
      let landmarks = results.landmarks[i];

      landmarks = landmarks.map((lm) => ({
        ...lm,
        x: 1- lm.x // horizontal flip
      }))

      tasks.drawUtils.drawConnectors(
        landmarks,
        mediapipe.HandLandmarker.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      );

      const selected = new Set([4, 8, 12]);
      scene.penRadius = getTotalDist(landmarks[4], landmarks[8], landmarks[12]);
      scene.penPos = getAveragePos(landmarks[4], landmarks[8], landmarks[12]);

      for (let j = 0; j < landmarks.length; j++) {
        const landmark = landmarks[j];
        const dot_color =
          (scene.penRadius < 0.01 || scene.penRadius > 0.5) && selected.has(j)
            ? "#00ffccff"
            : "#FF0000";

        tasks.drawUtils.drawLandmarks([landmark], {
          color: dot_color,
          lineWidth: 2
        });
      }
    }

  }

  canvasCtx.restore();

  if (tasks.isRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function getAveragePos(a, b, c) {
  return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
}
function getTotalDist(a, b, c) {
  const ab = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  const bc = Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2);
  const ca = Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2);
  return ab + bc + ca;
}
