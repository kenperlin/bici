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

  domDistances: [],
  focusedElement: null,

  avatarX: 0,
  avatarY: 0,
  avatarScale: 0.3,
  handAvatar: [
    { x: 0, y: 0, s: 1 },
    { x: 0, y: 0, s: 1 }
  ],
  shadowHandInfo:[{},{}],

  isLarge: false,
  isObvious: false,
  isSteady: true,
  isSeparateHandAvatars: false,

  isShadowAvatar: () =>
    state.isSeparateHandAvatars ||
    (state.avatarX >= 100 &&
      state.avatarX < WIDTH - 100 &&
      state.avatarY >= 100 &&
      state.avatarY < HEIGHT - 100),

  handSeparation: null
};
