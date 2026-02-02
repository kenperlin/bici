import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { videoTransform } from "../utils/canvasUtils.js";
import { mediapipeState } from "./state.js";

let drawUtils;
let handLandmarker;
let faceLandmarker;

export async function initMediapipe() {
  drawUtils = new DrawingUtils(OCTX);
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  [handLandmarker, faceLandmarker] = await Promise.all([
    HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2
    }),
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    })
  ]);

  mediapipeState.isReady = true;
}

export function mediapipePredict(video) {
  if (!mediapipeState.isReady || !mediapipeState.isRunning || video.readyState < 2) return;

  if (video.lastVideoTime !== video.currentTime) {
    video.lastVideoTime = video.currentTime;

    let handResults = handLandmarker.detectForVideo(video, performance.now());
    let faceResults = faceLandmarker.detectForVideo(video, performance.now());

    processResults(handResults, faceResults);
  }

  if (mediapipeState.debugMode) {
    drawDebug();
  }
}

function processResults(handResults, faceResults) {
  let transformLandmark = (lm) => ({
    x: 1 - lm.x,
    y: lm.y,
    z: lm.z
  });

  let newHands = [];

  // Transform results to mirror
  for (let i = 0; i < handResults.landmarks?.length ?? 0; i++) {
    const handedness =
      handResults.handednesses[i][0].displayName.toLowerCase();
    const landmarks = handResults.landmarks[i].map(transformLandmark);
    const worldLandmarks =
      handResults.worldLandmarks[i].map(transformLandmark);
    newHands.push({ landmarks, worldLandmarks, handedness });
  }

  let newFace = [];
  if (faceResults.faceLandmarks?.length) {
    // Transform results to mirror
    newFace = faceResults.faceLandmarks[0].map(transformLandmark);
  }

  mediapipeState.faceResults = newFace;
  mediapipeState.handResults = newHands;
}

function drawDebug() {
  OCTX.save();
  OCTX.translate(videoTransform.x, videoTransform.y);
  OCTX.scale(
    videoTransform.w / (WIDTH * DPR),
    videoTransform.h / (HEIGHT * DPR)
  );

  for (const hand of mediapipeState.handResults) {
    drawUtils.drawConnectors(
      hand.landmarks,
      HandLandmarker.HAND_CONNECTIONS,
      {
        color: "#00FF00",
        lineWidth: 2
      }
    );
    drawUtils.drawLandmarks(hand.landmarks, {
      color: "#00FF00",
      lineWidth: 2
    });
  }

  if (mediapipeState.faceResults) {
    drawUtils.drawConnectors(
      mediapipeState.faceResults,
      FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      { color: "#C0C0C070", lineWidth: 1 }
    );
    drawUtils.drawConnectors(
      mediapipeState.faceResults,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      { color: "#FF3030" }
    );
    drawUtils.drawConnectors(
      mediapipeState.faceResults,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      { color: "#FF3030" }
    );
  }

  OCTX.restore();
}
