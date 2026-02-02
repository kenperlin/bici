import { GestureTracker } from "../gestures/tracker.js";
import { getFingerThumbDistances, MotionGesture, PinchGesture } from "../gestures/types.js";
import { mediapipeState, trackingState } from "../state.js";
import { toScreen } from "../utils/mapping.js";

let gestureTracker;

export function initGestureTracker(sceneManager) {
  const { canvas: sceneCanvas, codeArea, slideDeck } = sceneManager;

  const indexPinch = new PinchGesture("indexPinch", [1], 0.1);

  indexPinch.onStart = ({ state, id }, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);

    // if (isInfo && D.isIn(x - D.left, y - D.top)) {
    //   slide = slides[slideIndex];
    //   if (slide.onDown) slide.onDown(slide._px(x - D.left), slide._py(y - D.top));
    //   D.isDown = true;
    //   return;
    // }

    if (sceneCanvas.contains(x, y)) {
      state[h].pointer = h;
      const eventId = `${id}.${state[h].pointer}`;
      sceneCanvas.onDown(x, y, z, eventId);
    } else if (sceneCanvas.contains(trackingState.headX, trackingState.headY)) {
      state[h].pointer = "head";
      const eventId = `${id}.${state[h].pointer}`;
      sceneCanvas.onDown(trackingState.headX, trackingState.headY, 0, eventId);
    }
  };

  indexPinch.onActive = ({ state, id }, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);

    // if (isInfo && D.isDown) {
    //   slide = slides[slideIndex];
    //   if (slide.onDrag) slide.onDrag(slide._px(x - D.left), slide._py(y - D.top));
    //   return;
    // }

    if (!state[h].pointer) return;

    const eventId = `${id}.${state[h].pointer}`;
    if (state[h].pointer !== "head") {
      sceneCanvas.onMove(x, y, z, eventId);
    } else {
      sceneCanvas.onMove(trackingState.headX, trackingState.headY, 0, eventId);
    }
  };

  indexPinch.onEnd = ({ state, id }, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);

    // if (isInfo && D.isDown) {
    //   D.isDown = false;
    //   slide = slides[slideIndex];
    //   if (slide.onUp) slide.onUp(slide._px(x - D.left), slide._py(y - D.top));
    //   return;
    // }

    if (!state[h].pointer) return;

    const eventId = `${id}.${state[h].pointer}`;
    if (state[h].pointer !== "head") {
      sceneCanvas.onUp(x, y, z, eventId);
    } else {
      sceneCanvas.onUp(trackingState.headX, trackingState.headY, 0, eventId);
    }
  };

  const middlePinch = new PinchGesture("middlePinch", [2], 0.1);

  let detectSpreadStart = (hand) => {
    const scaleFac = Math.min(1, 0.1 / (0.2 + hand.landmarks[4].z));
    let distances = getFingerThumbDistances([1, 2, 3, 4], hand);
    return distances.every((d) => d < 0.15 * scaleFac);
  };

  let detectSpreadEnd = (hand) => {
    const scaleFac = Math.min(1, 0.1 / (0.2 + hand.landmarks[4].z));
    let distances = getFingerThumbDistances([1, 2, 3, 4], hand);
    return distances.every((d) => d > 0.3 * scaleFac);
  };

  const spreadGesture = new MotionGesture("spread", detectSpreadStart, detectSpreadEnd, 300);
  spreadGesture.onTriggerAB = (self, hand) => {
    if (
      trackingState.spotlightElement ||
      (trackingState.spotlightElement = trackingState.domDistances[0]) == null
    )
      return;

    trackingState.domDistances.forEach((elem) => {
      if(elem.element) elem.element.style.opacity = 0;
    });

    let element = trackingState.spotlightElement.element;
    element.style.transition = "all 0.1s ease-in-out";
    element.style.opacity = 1;
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.transform = "translate(-50%, -50%) scale(1.25)";
  };
  spreadGesture.onTriggerBA = (self, hand) => {
    if (!trackingState.spotlightElement) return;

    let element = trackingState.spotlightElement.element;
    element.style.top = trackingState.spotlightElement.bounds.top;
    element.style.left = trackingState.spotlightElement.bounds.left;
    element.style.transform = "none";
    trackingState.spotlightElement = null;

    trackingState.domDistances.forEach((elem) => {
      if(elem.element) elem.element.style.opacity = 1;
    });
  };

  gestureTracker = new GestureTracker();
  gestureTracker.add(indexPinch);
  gestureTracker.add(middlePinch);
  gestureTracker.add(spreadGesture);
}

export function updateGesture() {
  gestureTracker?.update(mediapipeState.handResults);
}
