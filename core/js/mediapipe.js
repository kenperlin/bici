let mediapipe;
let mediapipeTasks = {};

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
    mediapipeTasks.drawUtils = new mediapipe.DrawingUtils(canvasCtx);

    const createHandLandmarker = async () => {
      const vision = await mediapipe.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      mediapipeTasks.handLandmarker = await mediapipe.HandLandmarker.createFromOptions(
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
      mediapipeTasks.faceLandmarker = await mediapipe.FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        }
      );
    };
    createHandLandmarker();

    const startPredictionLoop = setInterval(() => {
      if (
        webcam.srcObject && // userMedia is loaded
        mediapipeTasks.handLandmarker && // hand landmarker is loaded
        mediapipeTasks.faceLandmarker && // face landmarker is loaded
        videoSrc.readyState >= 2 // video has data
      ) {
        mediapipeTasks.isReady = true;
        if(mediapipeTasks.isRunning) mediapipeTasks.predictWebcam();
        clearInterval(startPredictionLoop);
      }
    }, 100);
  })
  .catch((e) => {
    console.log("Error importing mediapipe");
    console.log(e);
  });

mediapipeTasks.predictWebcam = () => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, mediapipeCanvas.width, mediapipeCanvas.height);
  
  let handResults = mediapipeTasks.handLandmarker.detectForVideo(webcam, performance.now());
  if (handResults.landmarks) {
    for (let i = 0; i < handResults.landmarks.length; i++) {
      let landmarks = handResults.landmarks[i];
      landmarks = remapLandmarks(landmarks)

      mediapipeTasks.drawUtils.drawConnectors(
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

        mediapipeTasks.drawUtils.drawLandmarks([landmark], {
          color: dot_color,
          lineWidth: 2
        });
      }
    }

  }

  let faceResults = mediapipeTasks.faceLandmarker.detectForVideo(webcam, performance.now());
  if (faceResults.faceLandmarks) {
    for (let landmarks of faceResults.faceLandmarks) {
      landmarks = remapLandmarks(landmarks)
      
      mediapipeTasks.drawUtils.drawConnectors(
        landmarks,
        mediapipe.FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      mediapipeTasks.drawUtils.drawConnectors(
        landmarks,
        mediapipe.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );
      mediapipeTasks.drawUtils.drawConnectors(
        landmarks,
        mediapipe.FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#FF3030" }
      );
    }
  }

  canvasCtx.restore();

  if (mediapipeTasks.isRunning === true) {
    window.requestAnimationFrame(mediapipeTasks.predictWebcam);
  }
}

mediapipeTasks.toggleRunning = () => {
  if(!mediapipeTasks.isReady) {
    console.log("Mediapipe is not ready yet, please try again.")
    return;
  }

  if(mediapipeTasks.isRunning) {
    mediapipeCanvas.hidden = true;
    mediapipeTasks.isRunning = false;
  } else {
    mediapipeCanvas.hidden = false;
    mediapipeTasks.isRunning = true;
    mediapipeTasks.predictWebcam()
  }
}

function remapLandmarks(landmarks) {
  return landmarks.map((lm) => ({
    x: 1 - lm.x,
    y: lm.y + 0.04,
    z: lm.z
  }))
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
