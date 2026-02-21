import { GestureTracker } from "../gestures/tracker.js";
import {
  HandGesture,
  handScale,
  LM,
  lmDistance,
  fingerDistances,
  PinchGesture
} from "../gestures/detect.js";
import { mediapipeState, trackingState } from "../state.js";
import { toScreen } from "../utils/mapping.js";

let gestureTracker;

export function initGestureTracker() {
  const indexPinch = new PinchGesture("index pinch", [1], 0.25);
  indexPinch.onStart = ({state, id}, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);
    const { headX, headY } = trackingState;

    // if(controller.triggerDown(`${id}.${h}`, x, y, z)) {
    //   state[h].pointer = h;
    // } else if(controller.triggerDown(`${id}.${"head"}`, headX, headY, 0)) {
    //   state[h].pointer = "head"
    // }
  }

  indexPinch.onActive = ({ state, id }, hand) => {
    const h = hand.handedness;
    if(!state[h].pointer) return;

    const { x, y, z } = toScreen(state[h], h);
    const { headX, headY } = trackingState;

    // const eventId = `${id}.${state[h].pointer}`;
    // if (state[h].pointer !== "head") {
    //   controller.triggerMove(eventId, x, y, z);
    // } else {
    //   controller.triggerMove(eventId, headX, headY, 0);
    // }
  }

  indexPinch.onEnd = ({ state, id }, hand) => {
    const h = hand.handedness;
    if(!state[h].pointer) return;

    const { x, y, z } = toScreen(state[h], h);
    const { headX, headY } = trackingState;

    // const eventId = `${id}.${state[h].pointer}`;
    // if (state[h].pointer !== "head") {
    //   controller.triggerUp(eventId, x, y, z);
    // } else {
    //   controller.triggerUp(eventId, headX, headY, 0);
    // }
  }

  let detectFist = (hand) => {
    const scale = handScale(hand.landmarks);
    const distances = LM.FINGERTIPS.map((i) => lmDistance(hand.landmarks, LM.WRIST, i));
    return Math.max(...distances) / scale < 1;
  };
  const fistGesture = new HandGesture("fist", detectFist);

  let detectPoint = (hand) => {
    const scale = handScale(hand.landmarks);
    const indexDistance = lmDistance(hand.landmarks, LM.WRIST, LM.INDEX_TIP) / scale;
    const thumbDistance = lmDistance(hand.landmarks, LM.MIDDLE_PIP, LM.THUMB_TIP) / scale;
    const otherDistances = fingerDistances(hand.landmarks, LM.WRIST, [2, 3, 4]);
    return Math.max(...otherDistances) < 1 && indexDistance > 1.6 && thumbDistance < 0.25;
  };
  const pointGesture = new HandGesture("point", detectPoint);

  let detectGripper = (hand) => {
    const scale = handScale(hand.landmarks);
    const indexDistance = lmDistance(hand.landmarks, LM.WRIST, LM.INDEX_TIP) / scale;
    const thumbDistance = lmDistance(hand.landmarks, LM.MIDDLE_PIP, LM.THUMB_TIP) / scale;
    return indexDistance > 1.3 && thumbDistance > 0.3;
  };
  const gripperGesture = new HandGesture("gripper", detectGripper);

  gestureTracker = new GestureTracker();
  trackingState.gestures = gestureTracker.active;

  gestureTracker.add(indexPinch);
  gestureTracker.add(gripperGesture, null, -1);
  gestureTracker.add(fistGesture, null, 1);
  gestureTracker.add(pointGesture, null, 1);
}

export function updateGesture() {
  gestureTracker?.update(mediapipeState.handResults);
}
