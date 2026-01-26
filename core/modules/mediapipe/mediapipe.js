
import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { showErrorNotification } from "../yjs/ui.js";

export class Mediapipe {
  constructor(video) {
    this.video = video;

    this.isReady = false;
    this.isRunning = true;
    this.debugMode = true;

    this.handLandmarker = null;
    this.faceLandmarker = null;
    this.tasks = null;
    this.drawUtils = null;

    this.handResults = [];
    this.faceResults = [];

    this.init()
      .then(() => {
        const startPredictionLoop = setInterval(() => {
          if (
            this.video.srcObject && // userMedia is loaded
            this.video.readyState >= 2 // video has data
          ) {
            this.isReady = true;
            clearInterval(startPredictionLoop);
          }
        }, 100);
      })
      .catch((e) => {
        console.error("Error importing mediapipe: " + e);
      });
  }

  async init() {
    this.drawUtils = new DrawingUtils(OCTX);
    console.log("init begins")
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    [this.handLandmarker, this.faceLandmarker] = await Promise.all([
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
    ])
  }

  predict() {
    if(!this.isReady || !this.isRunning) return;

    if (this.video.lastVideoTime !== this.video.currentTime) {
      this.video.lastVideoTime = this.video.currentTime;

      let handResults = this.handLandmarker.detectForVideo(
        this.video,
        performance.now()
      );
      let faceResults = this.faceLandmarker.detectForVideo(
        webcam,
        performance.now()
      );

      this.processResults(handResults, faceResults);
    }

    if (this.debugMode) {
      this.drawDebug();
    }
  }

  toggleRunning() {
    if (!this.isReady) {
      showErrorNotification("Mediapipe is not ready yet.","Please try again in a few seconds.");
      return;
    }
    this.isRunning = !this.isRunning;
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
  }

  drawDebug() {
    OCTX.save();
    OCTX.scale(0.5, 0.5);
    for (const hand of this.handResults) {
      this.drawUtils.drawConnectors(
        hand.landmarks,
        HandLandmarker.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 2
        }
      );
      this.drawUtils.drawLandmarks(hand.landmarks, {
        color: "#00FF00",
        lineWidth: 2
      });
    }

    if (this.faceResults) {
      this.drawUtils.drawConnectors(
        this.faceResults,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      this.drawUtils.drawConnectors(
        this.faceResults,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );
      this.drawUtils.drawConnectors(
        this.faceResults,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#FF3030" }
      );
    }

    OCTX.restore();
  }

  processResults(handResults, faceResults) {
    let transformLandmark = (lm) => ({
      x: 1 - lm.x,
      y: lm.y,
      z: lm.z
    });

    let averageLandmarks = (lm1, lm2) => ({
      x: (lm1.x + lm2.x) / 2,
      y: (lm1.y + lm2.y) / 2,
      z: (lm1.z + lm2.z) / 2
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
    // Smooth results by averaging
    for (let i = 0; i < newHands.length; i++) {
      let newHand = newHands[i];
      let oldHand = this.handResults.find(
        (hand) => hand.handedness === newHand.handedness
      );
      if (!oldHand) continue;

      for (let j = 0; j < oldHand.landmarks.length; j++) {
        newHands[i].landmarks[j] = averageLandmarks(
          oldHand.landmarks[j],
          newHand.landmarks[j]
        );
        newHands[i].worldLandmarks[j] = averageLandmarks(
          oldHand.worldLandmarks[j],
          newHand.worldLandmarks[j]
        );
      }
    }

    let newFace = [];
    if (faceResults.faceLandmarks?.length) {
      // Transform results to mirror
      newFace = faceResults.faceLandmarks[0].map(transformLandmark);

      // Smooth results by averaging
      let oldFace = this.faceResults;
      for (let i = 0; i < oldFace.length; i++) {
        newFace[i] = averageLandmarks(newFace[i], oldFace[i]);
      }
    }

    this.faceResults = newFace;
    this.handResults = newHands;
  }
}
