import { identity } from "../math/math.js";

export const mediapipeState = {
  isReady: false,
  isRunning: true,
  debugMode: false,
  filter: "kalman",

  handResults: [],
  faceResults: [],

  toggleRunning: () => (mediapipeState.isRunning = !mediapipeState.isRunning),
  toggleDebug: () => (mediapipeState.debugMode = !mediapipeState.debugMode)
};

export const trackingState = {
  headPosHistory: [],
  headMatrix: identity(),
  headX: 0,
  headY: 0,

  eyeOpen: 1,
  eyeGazeX: 0,
  eyeGazeY: 0,
  blinkTime: -1,

  debugMode: false,

  domDistances: [],
  domFocusBounds: null,
  spotlightElement: null,

  globalAvatar: { x: 0, y: 0, s: 1, separation: null },
  handAvatar: {
    left: { x: 0, y: 0, s: 1 },
    right: { x: 0, y: 0, s: 1 }
  },
  gestures: { left: null, right: null },

  isLarge: false,
  isObvious: false,
  isFramingHands: false,
  isSteady: false,
  isSeparateHandAvatars: true,
  isScalingHandAvatars: false,

  isShadowAvatar: () =>
    trackingState.isSeparateHandAvatars ||
    (trackingState.globalAvatar.x >= 100 &&
      trackingState.globalAvatar.x < WIDTH - 100 &&
      trackingState.globalAvatar.y >= 100 &&
      trackingState.globalAvatar.y < HEIGHT - 100),

  toggleDebug: () => {
    trackingState.debugMode = !trackingState.debugMode;
  }
};

export const peerTrackingState = {}
