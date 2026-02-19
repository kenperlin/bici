import { GestureTracker } from "../gestures/tracker.js";
import {
  HandGesture,
  handScale,
  LM,
  lmDistance,
  MotionGesture,
  fingerDistances,
  PinchGesture
} from "../gestures/detect.js";
import { mediapipeState, trackingState } from "../state.js";
import { toScreen } from "../utils/mapping.js";

let gestureTracker;

export function initGestureTracker(controller) {
  const indexPinch = new PinchGesture("index pinch", [1], 0.25);
  indexPinch.onStart = ({state, id}, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);
    const { headX, headY } = trackingState;

    if(controller.triggerDown(`${id}.${h}`, x, y, z)) {
      state[h].pointer = h;
    } else if(controller.triggerDown(`${id}.${"head"}`, headX, headY, 0)) {
      state[h].pointer = "head"
    }
  }

  indexPinch.onActive = ({ state, id }, hand) => {
    const h = hand.handedness;
    if(!state[h].pointer) return;

    const { x, y, z } = toScreen(state[h], h);
    const { headX, headY } = trackingState;

    const eventId = `${id}.${state[h].pointer}`;
    if (state[h].pointer !== "head") {
      controller.triggerMove(eventId, x, y, z);
    } else {
      controller.triggerMove(eventId, headX, headY, 0);
    }
  }

  indexPinch.onEnd = ({ state, id }, hand) => {
    const h = hand.handedness;
    if(!state[h].pointer) return;

    const { x, y, z } = toScreen(state[h], h);
    const { headX, headY } = trackingState;

    const eventId = `${id}.${state[h].pointer}`;
    if (state[h].pointer !== "head") {
      controller.triggerUp(eventId, x, y, z);
    } else {
      controller.triggerUp(eventId, headX, headY, 0);
    }
  }

  const middlePinch = new PinchGesture("middle pinch", [2], 0.25);

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

  let detectSpreadStart = (hand) => {
    let distances = fingerDistances(hand.landmarks, LM.THUMB_TIP);
    return Math.max(...distances) < 0.35;
  };

  let detectSpreadEnd = (hand) => {
    let distances = fingerDistances(hand.landmarks, LM.THUMB_TIP);
    return Math.max(...distances) > 1.2;
  };

  const spreadGesture = new MotionGesture("spread", detectSpreadStart, detectSpreadEnd, 300);
  spreadGesture.onTriggerAB = (self, hand) => {
    if (
      trackingState.spotlightElement ||
      (trackingState.spotlightElement = trackingState.domDistances[0]) == null
    )
      return;

    trackingState.domDistances.forEach((elem) => {
      elem.element.style.display = "none";
    });

    let element = trackingState.spotlightElement.element;
    element.style.transition = "all 0.1s ease-in-out";
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.transform = "translate(-50%, -50%) scale(1.25)";
    element.style.display = "block";
  };
  spreadGesture.onTriggerBA = (self, hand) => {
    if (!trackingState.spotlightElement) return;

    let element = trackingState.spotlightElement.element;
    element.style.top = "";
    element.style.left = "";
    element.style.transform = "";
    trackingState.spotlightElement = null;

    trackingState.domDistances.forEach((elem) => {
      elem.element.style.display = "block";
    });
  };

  gestureTracker = new GestureTracker();
  trackingState.gestures = gestureTracker.active;

  gestureTracker.add(indexPinch);
  gestureTracker.add(middlePinch);
  gestureTracker.add(gripperGesture);
  gestureTracker.add(fistGesture, null, 1);
  gestureTracker.add(pointGesture, null, 1);
  gestureTracker.add(spreadGesture);
}

export function updateGesture() {
  gestureTracker?.update(mediapipeState.handResults);
}
