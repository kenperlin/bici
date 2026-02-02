import { GestureTracker } from "./tracker.js";
import { getFingerThumbDistances, MotionGesture, PinchGesture } from "./types.js";

export function init() {
  let indexPinch = new PinchGesture("indexPinch", [1], 0.1);

  indexPinch.onStart = ({ state, id }, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);

    if (isInfo && D.isIn(x - D.left, y - D.top)) {
      slide = slides[slideIndex];
      if (slide.onDown) slide.onDown(slide._px(x - D.left), slide._py(y - D.top));
      D.isDown = true;
      return;
    }

    if (canvas3D_containsPoint(x, y)) {
      state[h].pointer = hand.handedness;
      const eventId = `${id}.${state[h].pointer}`;
      canvas3D_down(x, y, z, eventId);
    } else if (canvas3D_containsPoint(state.headX, state.headY)) {
      state[h].pointer = "head";
      const eventId = `${id}.${state[h].pointer}`;
      canvas3D_down(state.headX, state.headY, 0, eventId);
    }
  };

  indexPinch.onActive = ({ state, id }, hand) => {
    const h = hand.handedness;
    const { x, y, z } = toScreen(state[h], h);

    if (isInfo && D.isDown) {
      slide = slides[slideIndex];
      if (slide.onDrag) slide.onDrag(slide._px(x - D.left), slide._py(y - D.top));
      return;
    }

    if (!state[h].pointer) return;

    const eventId = `${id}.${state[h].pointer}`;
    if (state[h].pointer === "head") {
      canvas3D_move(state.headX, state.headY, 0, eventId);
    } else {
      canvas3D_move(x, y, z, eventId);
    }
  };

  indexPinch.onEnd = ({ state, id }, hand) => {
    const h = hand.handedness;

    const { x, y, z } = toScreen(state[h], h);

    if (isInfo && D.isDown) {
      D.isDown = false;
      slide = slides[slideIndex];
      if (slide.onUp) slide.onUp(slide._px(x - D.left), slide._py(y - D.top));
      return;
    }

    if (!state[h].pointer) return;

    const eventId = `${id}.${state[h].pointer}`;
    if (state[h].pointer === "head") {
      canvas3D_up(state.headX, state.headY, 0, eventId);
    } else {
      canvas3D_up(x, y, z, eventId);
    }
  };

  let middlePinch = new PinchGesture("middlePinch", [2], 0.1);

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

  let spreadGesture = new MotionGesture("spread", detectSpreadStart, detectSpreadEnd, 300);
  spreadGesture.onTriggerAB = (self, hand) => {
    if (state.spotlightElement || (state.spotlightElement = domDistances[0]) == null) return;

    domDistances.forEach((elem) => {
      elem.element.style.opacity = 0;
    });

    let element = state.spotlightElement.element;
    element.style.transition = "all 0.1s ease-in-out";
    element.style.opacity = 1;
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.transform = "translate(-50%, -50%) scale(1.25)";
  };
  spreadGesture.onTriggerBA = (self, hand) => {
    if (!state.spotlightElement) return;

    let element = state.spotlightElement.element;
    element.style.top = state.spotlightElement.bounds.top;
    element.style.left = state.spotlightElement.bounds.left;
    element.style.transform = "none";
    state.spotlightElement = null;

    domDistances.forEach((elem) => {
      elem.element.style.opacity = 1;
    });
  };

  const gestureTracker = new GestureTracker();
  gestureTracker.add(indexPinch);
  gestureTracker.add(middlePinch);
  gestureTracker.add(spreadGesture);
}
