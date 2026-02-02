import { identity } from "../math/math.js";

export const state = {
  headPosHistory: [],
  headMatrix: identity(),
  headX: 0,
  headY: 0,

  eyeOpen: 1,
  eyeGazeX: 0,
  eyeGazeY: 0,
  blinkTime: -1,

  debugMode: false,

  domSources: [],
  domDistances: [],
  domFocusIndex: null,
  spotlightElement: null,

  globalAvatar: { x: 0, y: 0, s: 1, separation: null },
  handAvatar: {
    left: { x: 0, y: 0, s: 1 },
    right: { x: 0, y: 0, s: 1 }
  },
  shadowHandInfo: {left: {}, right: {}},

  isLarge: false,
  isObvious: false,
  isFramingHands: false,
  isSteady: false,
  isSeparateHandAvatars: true,

  isShadowAvatar: () =>
    state.isSeparateHandAvatars ||
    (state.globalAvatar.x >= 100 &&
      state.globalAvatar.x < WIDTH - 100 &&
      state.globalAvatar.y >= 100 &&
      state.globalAvatar.y < HEIGHT - 100),


  toggleDebug: () => {
    state.debugMode = !state.debugMode;
  },
};
