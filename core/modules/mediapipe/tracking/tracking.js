import { add, clamp, cross, dot, mix, norm, normalize, resize, round, subtract } from "../../math/math.js";
import { LowPassFilter2D, PCAFilter2D } from "../utils/filter.js";
import { trackingState as state, mediapipeState, peerTrackingState } from "../state.js";
import {
  drawEyesObvious,
  drawFingertips,
  drawGlobalShadowHead,
  drawShadowGesture,
  drawShadowHand
} from "./drawing.js";
import { fingerDistances, handScale, LM } from "../gestures/detect.js";
import { toVideo } from "../utils/mapping.js";
import { videoState } from "../../ui/video.js";
import { webrtcClient } from "../../yjs/yjs.js";

const headPcaFilter = new PCAFilter2D();
const headLowPassFilter = new LowPassFilter2D(2 / 3);
const globalAvatarFilter = new LowPassFilter2D(2 / 3);

let pointToArray = (p) => [p.x, p.y, p.z];

export function updateTracking() {
  const { handResults, faceResults } = mediapipeState;
  
  computeHandPose(handResults)
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

  [state.headX, state.headY] = headLowPassFilter.filter(state.headX, state.headY);

  if (state.isSteady) {
    [state.headX, state.headY] = headPcaFilter.filter(state.headX, state.headY);
  }
  // if (state.isLarge) {
  //    state.headX = frameToRect(state.headX, canvas3D.getBoundingClientRect());
  //    state.headY = frameToRect(state.headY, canvas3D.getBoundingClientRect());
  // }

  if (state.isObvious)
    drawEyesObvious(state.headX, state.headY, state.eyeGazeX, state.eyeGazeY, state.eyeOpen);
  else if (state.isShadowAvatar() && !state.isSeparateHandAvatars) {
    drawGlobalShadowHead(
      state.globalAvatar,
      state.headMatrix,
      state.headX,
      state.headY,
      state.eyeOpen
    );
  }

  if (!state.isShadowAvatar()) drawFingertips(handResults, state.gestures);

  if (state.isSeparateHandAvatars) {
    for (const hand of handResults) {
      computeShadowHand(hand);
      drawShadowHand(hand, state.handAvatar[hand.handedness]);
    }
    drawShadowGesture(handResults, state.handAvatar, state.gestures);
  } else if (state.isShadowAvatar()) {
    computeGlobalShadowAvatar(handResults);
    for (const hand of handResults) {
      computeShadowHand(hand);
      drawShadowHand(hand, state.globalAvatar);
    }
  }

  if (state.debugMode) {
    OCTX.fillStyle = "#0080ff";
    OCTX.font = "30px Courier";
    let x = 100;
    for (const h in state.handPose) {
      let data = state.handPose[h]
      if (!data) continue;

      let line = 0;
      let hy = 100 + 250 * (h === "left" ? 0 : 1);
      OCTX.fillText(h.toUpperCase(), x, hy);
      for (let key in data) {
        if (key != "hand") {
          let y = hy + 60 + 30 * line;
          OCTX.fillText(key, x, y);
          let v = data[key];
          if (Array.isArray(v))
            for (let i = 0; i < v.length; i++) OCTX.fillText(round(v[i]), x + 150 + 150 * i, y);
          else OCTX.fillText(round(v), x + 150, y);
          line++;
        }
      }
    }
  }

  OCTX.save();
  OCTX.translate(WIDTH, 0);
  OCTX.scale(-1, 1);

  for (const id in peerTrackingState) {
    const peerState = peerTrackingState[id];
    if (!peerState.id || peerState.id === webrtcClient.myClientId) continue;

    if (state.isObvious) {
      drawEyesObvious(
        peerState.headX,
        peerState.headY,
        peerState.eyeGazeX,
        peerState.eyeGazeY,
        peerState.eyeOpen
      );
    }
    for (const hand of peerState.handResults) {
      const handAvatar = peerState.handAvatar[hand.handedness];
      if (handAvatar.x === 0 && handAvatar.y === 0 && handAvatar.s === 1 && videoState.isVisible)
        continue;

      drawShadowHand(hand, peerState.handAvatar[hand.handedness], peerState.gestures);
    }
    drawShadowGesture(peerState.handResults, peerState.handAvatar, peerState.gestures);
  }
  OCTX.translate(WIDTH, 0);
  OCTX.scale(-1, 1);
  OCTX.restore();
}

// GIVEN THREE POINTS ON THE FACE, COMPUTE THE USER'S HEAD MATRIX
function computeHeadMatrix(a, b, c) {
  a[1] = -a[1];
  b[1] = -b[1];
  c[1] = -c[1];
  let X = normalize(subtract(a, c));
  let y = subtract(b, mix(a, c, 0.5));
  let Z = normalize(cross(X, y));
  let Y = normalize(cross(Z, X));
  Z = normalize(add(Z, resize(Y, 0.3)));
  Y = normalize(cross(Z, X));
  state.headMatrix = [
    X[0], X[1], X[2], 0,
    Y[0], Y[1], Y[2], 0,
    Z[0], Z[1], Z[2], 0,
    4 * (b[0] - 0.5), 4 * (b[1] + 0.625), 4 * b[2], 1
  ];
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

function computeHandPose(handResults) {
  state.handPose = { left: null, right: null };

  for (const hand of handResults) {
    let d = (i, j) => norm(subtract(pointToArray(hand.landmarks[i]), pointToArray(hand.landmarks[j])));
    
    const h = hand.handedness;
    let X = normalize(subtract(pointToArray(hand.landmarks[17]), pointToArray(hand.landmarks[5])));
    let Y = normalize(subtract(pointToArray(hand.landmarks[9]), pointToArray(hand.landmarks[0])));
    let Z = normalize(cross(X, Y));

    let xx = Math.max(0, 1 + X[0] - Y[1] - Z[2]) / 4;
    let x = Math.sqrt(xx) * Math.sign(Y[2] - Z[1]);
    let yy = Math.max(0, 1 - X[0] + Y[1] - Z[2]) / 4;
    let y = Math.sqrt(yy) * Math.sign(Z[0] - X[2]);
    let zz = Math.max(0, 1 - X[0] - Y[1] + Z[2]) / 4;
    let z = Math.sqrt(zz) * Math.sign(X[1] - Y[0]);

    state.handPose[h] = {}
    state.handPose[h].rigid = [
      hand.landmarks[9].x - 0.5, 0.4 - hand.landmarks[9].y, hand.landmarks[9].z,
      x, y, z, Math.sqrt(1 - xx - yy - zz)
    ];
    state.handPose[h].curl ??= []
    for (let f = 0; f < 5; f++) {
      let i = 1 + 4 * f + (f == 0 ? 1 : 0);
      let j = 1 + 4 * f + 3;
      let sum = 0;
      for (let k = i; k < j; k++) sum += d(k, k + 1);
      state.handPose[h].curl[f] = 1 - d(i, j) / sum;
    }
    state.handPose[h].unpinch ??= [];
    for (let f = 0; f < 5; f++) state.handPose[h].unpinch[f] = d(1 + 4 * f + 3, 1 + 3) / d(0, 5);
    state.handPose[h].spread = Math.max(0, d(1 + 4 * 1 + 3, 1 + 4 * 4 + 3) / d(1 + 4 * 1, 1 + 4 * 4) - 1);

    console.log(state.handPose[h])
  }
}

function computeShadowHand(hand) {
  const { handedness: h, landmarks } = hand;

  if (!state.isScalingHandAvatars) {
    const oppositeH = h === "left" ? "right" : "left";
    if (state.gestures[h]?.id === "frame") {
      const { width, x, y } = state.gestures[h].state[h];
      state.handAvatar[oppositeH].x = x;
      state.handAvatar[oppositeH].y = y;
      state.handAvatar[oppositeH].s = width / WIDTH;
    } else {
      state.handAvatar[oppositeH].x = 0;
      state.handAvatar[oppositeH].y = 0;
      state.handAvatar[oppositeH].s = 1;
    }
  } else if (state.gestures[h]?.id === "fist") {
    // Scale finger thickness depending on visible hand size.
    const { x, y } = toVideo({
      x: landmarks[LM.MIDDLE_MCP].x,
      y: landmarks[LM.MIDDLE_MCP].y
    });
    const avatar = state.handAvatar[h];
    const targetScale = clamp(2.3 - 7 * handScale(landmarks), 0.2, 1);

    avatar.x = x * (1 - avatar.s);
    avatar.y = y * (1 - avatar.s);
    avatar.s = 0.5 * avatar.s + 0.5 * targetScale;
    console.log(avatar);
  }
}

function computeGlobalShadowAvatar(handResults) {
  let x = 0,
    y = 0,
    w = 0;

  const fists = { left: null, right: null };

  for (const hand of handResults) {
    const h = hand.handedness;
    if (state.gestures[h]?.id === "fist") {
      const weight =
        1 / fingerDistances(hand.landmarks, LM.WRIST).reduce((acc, val) => acc + val, 0);
      fists[h] = hand.landmarks[LM.WRIST];

      x += WIDTH * fists[h].x * weight;
      y += HEIGHT * fists[h].y * weight;
      w += weight;
    }
  }
  if (w)
    [state.globalAvatar.x, state.globalAvatar.y] = globalAvatarFilter.filter(x / w, y / w - 300);

  // Use change in distance between the two fists to rescale the shadow avatar.
  if (fists.left && fists.right) {
    const dx = fists.left.x - fists.right.x,
      dy = fists.left.y - fists.right.y;

    const newSeparation = Math.sqrt(dx * dx + dy * dy);
    state.globalAvatar.s *= newSeparation / (state.globalAvatar.separation ?? newSeparation);
    state.globalAvatar.separation = newSeparation;
  } else {
    state.globalAvatar.separation = null;
  }
}
