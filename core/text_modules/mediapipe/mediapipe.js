import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { mediapipeState } from "./state.js";
import { videoState } from "../ui/video.js";
import { KalmanFilter, LowPassFilter1D, OneEuroFilter } from "./utils/filter.js";

let drawUtils;
let handLandmarker;
let faceLandmarker;

const handFilters = {
  left: {},
  right: {}
};

const dt = 1 / 30;
const lowpassParam = 0.3;
const kalmanParams = {
  Q: 0.05,
  R: 0.08,
}
const oneEuroParams = {
  minCutoff: 2.0,
  beta: 0.8,
  dCutoff: 0.2,
};

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
  initFilters();

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

function initFilters() {
  for (const h in handFilters) {
    handFilters[h].kalman = [];
    handFilters[h].lowpass = [];
    handFilters[h].oneEuro = [];
    for (let i = 0; i < 21; i++) {
      handFilters[h].lowpass[i] = {
        x: new LowPassFilter1D(lowpassParam),
        y: new LowPassFilter1D(lowpassParam),
        z: new LowPassFilter1D(lowpassParam),
        worldX: new LowPassFilter1D(lowpassParam),
        worldY: new LowPassFilter1D(lowpassParam),
        worldZ: new LowPassFilter1D(lowpassParam)
      };
      const { Q, R } = kalmanParams;
      handFilters[h].kalman[i] = {
        x: new KalmanFilter(dt, Q, R),
        y: new KalmanFilter(dt, Q, R),
        z: new KalmanFilter(dt, Q, R),
        worldX: new KalmanFilter(dt, Q, R),
        worldY: new KalmanFilter(dt, Q, R),
        worldZ: new KalmanFilter(dt, Q, R)
      };
      const { minCutoff, beta, dCutoff } = oneEuroParams;
      const freq = 1 / dt;
      handFilters[h].oneEuro[i] = {
        x: new OneEuroFilter(freq, minCutoff, beta, dCutoff),
        y: new OneEuroFilter(freq, minCutoff, beta, dCutoff),
        z: new OneEuroFilter(freq, minCutoff, beta, dCutoff),
        worldX: new OneEuroFilter(freq, minCutoff, beta, dCutoff),
        worldY: new OneEuroFilter(freq, minCutoff, beta, dCutoff),
        worldZ: new OneEuroFilter(freq, minCutoff, beta, dCutoff)
      };
    }
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
    const activeFilter = handFilters[h][mediapipeState.filter]
    if(!activeFilter) continue;

    hand.landmarks = hand.landmarks.map((lm, i) => ({
      x: activeFilter[i].x.filter(lm.x),
      y: activeFilter[i].y.filter(lm.y),
      z: activeFilter[i].z.filter(lm.z)
    }));
    hand.worldLandmarks = hand.worldLandmarks.map((lm, i) => ({
      x: activeFilter[i].worldX.filter(lm.x),
      y: activeFilter[i].worldY.filter(lm.y),
      z: activeFilter[i].worldZ.filter(lm.z)
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
