import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { mediapipeState } from "./state.js";
import { videoState } from "../ui/video.js";
import { KalmanFilter, LowPassFilter1D } from "./utils/filter.js";

let drawUtils;
let handLandmarker;
let faceLandmarker;

const handFilters = {
  left: {},
  right: {}
};

const kalmanParams = {
  dt: 1 / 30,
  Q: 0.005,
  R: 0.01,
}
const lowpassParam = 0.2;

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

  for (const h in handFilters) {
    handFilters[h].kalman = [];
    handFilters[h].lowpass = [];
    for (let i = 0; i < 21; i++) {
      handFilters[h].kalman[i] = {
        x: new KalmanFilter(kalmanParams.dt, kalmanParams.Q, kalmanParams.R),
        y: new KalmanFilter(kalmanParams.dt, kalmanParams.Q, kalmanParams.R),
        z: new KalmanFilter(kalmanParams.dt, kalmanParams.Q, kalmanParams.R),
        worldX: new KalmanFilter(kalmanParams.dt, kalmanParams.Q, kalmanParams.R),
        worldY: new KalmanFilter(kalmanParams.dt, kalmanParams.Q, kalmanParams.R),
        worldZ: new KalmanFilter(kalmanParams.dt, kalmanParams.Q, kalmanParams.R)
      };
      handFilters[h].lowpass[i] = {
        x: new LowPassFilter1D(lowpassParam),
        y: new LowPassFilter1D(lowpassParam),
        z: new LowPassFilter1D(lowpassParam),
        worldX: new LowPassFilter1D(lowpassParam),
        worldY: new LowPassFilter1D(lowpassParam),
        worldZ: new LowPassFilter1D(lowpassParam)
      };
    }
  }

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
    const handedness = handResults.handednesses[i][0].displayName.toLowerCase();
    const landmarks = handResults.landmarks[i].map(transformLandmark);
    const worldLandmarks = handResults.worldLandmarks[i].map(transformLandmark);
    newHands.push({ landmarks, worldLandmarks, handedness });
  }

  for (const hand of newHands) {
    const h = hand.handedness;
    hand.landmarks = hand.landmarks.map((lm, i) => ({
      x: handFilters[h].kalman[i].x.filter(lm.x),
      y: handFilters[h].kalman[i].y.filter(lm.y),
      z: handFilters[h].kalman[i].z.filter(lm.z)
    }));
    hand.worldLandmarks = hand.worldLandmarks.map((lm, i) => ({
      x: handFilters[h].kalman[i].worldX.filter(lm.x),
      y: handFilters[h].kalman[i].worldY.filter(lm.y),
      z: handFilters[h].kalman[i].worldZ.filter(lm.z)
    }));
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
  OCTX.translate(videoState.x, videoState.y);
  OCTX.scale(videoState.w / (WIDTH * DPR), videoState.h / (HEIGHT * DPR));

  for (const hand of mediapipeState.handResults) {
    drawUtils.drawConnectors(hand.landmarks, HandLandmarker.HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 2
    });
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
    drawUtils.drawConnectors(mediapipeState.faceResults, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
      color: "#FF3030"
    });
    drawUtils.drawConnectors(mediapipeState.faceResults, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
      color: "#FF3030"
    });
  }

  OCTX.restore();
}
