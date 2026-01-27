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
  frameHands: false,

  domSources: [],
  domDistances: [],
  domFocusIndex: null,
  spotlightElement: null,

  globalAvatar: {x: 0, y: 0, s: 1},
  handAvatar: [
    { x: 0, y: 0, s: 1 },
    { x: 0, y: 0, s: 1 }
  ],
  shadowHandInfo:[{},{}],

  isLarge: false,
  isObvious: true,
  isSteady: false,
  isSeparateHandAvatars: false,

  isShadowAvatar: () =>
    state.isSeparateHandAvatars ||
    (state.globalAvatar.x >= 100 &&
      state.globalAvatar.x < WIDTH - 100 &&
      state.globalAvatar.y >= 100 &&
      state.globalAvatar.y < HEIGHT - 100),

  handSeparation: null,

  toggleDebug: () => {
    state.debugMode = !state.debugMode;
  },
};
