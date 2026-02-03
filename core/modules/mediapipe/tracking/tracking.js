import { add, clamp, cross, dot, mix, norm, normalize, resize, subtract } from "../../math/math.js";
import { LowPassFilter, PCAFilter } from "../utils/filter.js";
import { trackingState as state, mediapipeState } from "../state.js";
import { drawEyes, drawHands, drawShadowGesture, drawShadowHand } from "./drawing.js";
import { fingerDistances, handScale, LM } from "../gestures/detect.js";

const pcaFilter = new PCAFilter();
const lowPassFilter = new LowPassFilter(2 / 3);

let pointToArray = (p) => [p.x, p.y, p.z];

export function updateTracking() {
  const { handResults, faceResults } = mediapipeState;

  if (faceResults.length) {
    computeHeadMatrix(
      pointToArray(faceResults[352]),
      pointToArray(faceResults[10]),
      pointToArray(faceResults[123])
    );

    computeEyeGaze(
      pointToArray(faceResults[263]), // outer lid       // LEFT EYE
      pointToArray(faceResults[398]), // inner lid

      pointToArray(faceResults[374]), // lower lid
      pointToArray(faceResults[386]), // upper lid

      pointToArray(faceResults[477]), // bottom of pupil
      pointToArray(faceResults[473]), // center of pupil
      pointToArray(faceResults[475]), // top of pupil

      pointToArray(faceResults[173]), // outer lid       // RIGHT EYE
      pointToArray(faceResults[33]), // inner lid

      pointToArray(faceResults[144]), // lower lid
      pointToArray(faceResults[159]), // upper lid

      pointToArray(faceResults[472]), // bottom of pupil
      pointToArray(faceResults[468]), // center of pupil
      pointToArray(faceResults[470]) // top of pupil
    );
  }

  state.headX = clamp(WIDTH / 2 + ((4.5 * WIDTH) / 2) * state.headMatrix[8], 0, WIDTH);
  state.headY = clamp(HEIGHT / 2 - ((4.5 * WIDTH) / 2) * state.headMatrix[9], 0, HEIGHT);

  [state.headX, state.headY] = lowPassFilter.filter(state.headX, state.headY);

  if (state.isSteady) {
    [state.headX, state.headY] = pcaFilter.filter(state.headX, state.headY);
  }
  // if (state.isLarge) {
  //    state.headX = frameToRect(state.headX, canvas3D.getBoundingClientRect());
  //    state.headY = frameToRect(state.headY, canvas3D.getBoundingClientRect());
  // }

  drawEyes();

  if (!state.isShadowAvatar()) drawHands(handResults);

  if (state.isSeparateHandAvatars) {
    for (const hand of handResults) {
      computeShadowHand(hand)
      drawShadowHand(hand, state.handAvatar[hand.handedness]);
    }
    drawShadowGesture(handResults)

  } else {
    computeGlobalShadowAvatar(handResults)
    for (const hand of handResults) {
      computeShadowHand(hand)
      drawShadowHand(hand, state.globalAvatar);
    }
  }
}

// GIVEN THREE POINTS ON THE FACE, COMPUTE THE USER'S HEAD MATRIX
function computeHeadMatrix(a,b,c) {
  a[1] = -a[1];
  b[1] = -b[1];
  c[1] = -c[1];
  let X = normalize(subtract(a,c));
  let y = subtract(b,mix(a,c,.5));
  let Z = normalize(cross(X,y));
  let Y = normalize(cross(Z,X));
  Z = normalize(add(Z,resize(Y,.3)));
  Y = normalize(cross(Z,X));
  state.headMatrix = [ X[0],X[1],X[2],0,
                       Y[0],Y[1],Y[2],0,
                       Z[0],Z[1],Z[2],0,
                       4*(b[0]-.5),4*(b[1]+.625),4*b[2],1 ];
}

// GIVEN EDGES OF EYES AND PUPIL, COMPUTE EYE GAZE AND EYE OPEN
function computeEyeGaze(la, lb, lc, ld, le, lf, lg, ra, rb, rc, rd, re, rf, rg) {
  let LX = normalize(subtract(lb, la));
  let lx = dot(subtract(lf, mix(la, lb, 0.5)), LX) / norm(subtract(lb, la));
  let ly = (2 * (lf[1] - mix(la, lb, 0.5)[1])) / norm(subtract(lb, la));

  let RX = normalize(subtract(rb, ra));
  let rx = dot(subtract(rf, mix(ra, rb, 0.5)), RX) / norm(subtract(rb, ra));
  let ry = (2 * (rf[1] - mix(ra, rb, 0.5)[1])) / norm(subtract(rb, ra));

  state.eyeGazeX = lx + rx;
  state.eyeGazeY = ly + ry;

  let lo = norm(subtract(lc, ld)) / norm(subtract(le, lg));
  let ro = norm(subtract(rc, rd)) / norm(subtract(re, rg));

  state.eyeOpen = (lo + ro) / 2;

  if (state.eyeOpen < 0.4 && state.blinkTime < 0) state.blinkTime = Date.now() / 1000;
}

function computeShadowHand(hand) {
  const { handedness: h, landmarks } = hand;

  // Scale finger thickness depending on visible hand size.
  state.shadowHandInfo[h].s = WIDTH * handScale(landmarks) * 0.075;
  state.shadowHandInfo[h].x = WIDTH * landmarks[10].x;
  state.shadowHandInfo[h].y = HEIGHT * landmarks[10].y;
  state.shadowHandInfo[h].open = fingerDistances(landmarks, LM.WRIST);
    
  if (state.gestures[h]?.id === "fist") {
    state.handAvatar[h].x = state.shadowHandInfo[h].x * (1 - state.handAvatar[h].s);
    state.handAvatar[h].y = state.shadowHandInfo[h].y * (1 - state.handAvatar[h].s);
    state.handAvatar[h].s =
      0.5 * state.handAvatar[h].s + 0.5 * clamp((35 - state.shadowHandInfo[h].s) / 15, 0.2, 1);
    if (state.handAvatar[h].s == 1) state.handAvatar[h].x = state.handAvatar[h].y = 0;
  }
}

function computeGlobalShadowAvatar(handResults) {
  let x = 0,
      y = 0,
      w = 0;
  let lp = {};
  for (const hand of handResults) {
    const h = hand.handedness;
    if (state.gestures[h]?.id === "fist") {
      lp[h] = hand.landmarks[0];
      let closed = 1 / state.shadowHandInfo[h].open;
      x += WIDTH * lp[h].x * closed;
      y += HEIGHT * lp[h].y * closed;
      w += closed;
    }
  }
  if (w) {
    state.globalAvatar.x = x / w;
    state.globalAvatar.y = y / w - 300;
  }

  // Use change in distance between the two fists to rescale the shadow avatar.
  if (lp.left && lp.right) {
    const dx = lp.left.x - lp.right.x,
          dy = lp.left.y - lp.right.y;

    const newSeparation = Math.sqrt(dx * dx + dy * dy);
    if (state.globalAvatar.separation)
      state.globalAvatar.s *= newSeparation / state.globalAvatar.separation;
    state.globalAvatar.separation = newSeparation;
  } else {
    state.hand_separation = null;
  }
}
