import { drawDomSelection } from "./drawing.js";
import { trackingState as state } from "../state.js";

export function updateDomFocus(controller) {
  evalDomDistances(controller, state.headX, state.headY);

  const closest = state.domDistances[0];
  if (!closest) return;

  const focusThreshold = 600 * (Math.max(0.5, closest.weight) - 0.5); // Softness of selection proportional to confidence

  // Focus on CodeArea if looked at, hovered over, or spotlighted
  const autofocusFn = (target) => {
    const isLookedAt = closest.element === target.element && closest.dist < focusThreshold;
    const isSpotlighted = closest.element === state.spotlightElement;
    return isLookedAt || isSpotlighted
  }
  const focusedElement = controller.triggerAutofocus("code", autofocusFn)
  state.domFocusBounds = focusedElement?.getRect()
  
  // A LONG BLINK ACTS AS A CLICK AT THE HEAD GAZE POSITION.
  if (state.eyeOpen >= 0.4 && state.blinkTime > 0) {
    let blinkDuration = Date.now() / 1000 - state.blinkTime;
    if (blinkDuration > 0.2) {
      controller.triggerDown("eye", state.headX, state.headY, 0);
      controller.triggerUp("eye", state.headX, state.headY, 0);
    }
    state.blinkTime = -1;
  }

  drawDomSelection();
}

function evalDomDistances(controller, x, y) {
  const targets = ["code", "scene", "slide"];

  let newDomDistances = targets.map((id) => {
    const target = controller.getTarget(id);
    const element = target.element;
    const bounds = target.getRect();
    const dist = target.isVisible ? getSignedDistanceRect(x, y, bounds) : Infinity;
    return {element, bounds, dist};
  });

  newDomDistances = newDomDistances.filter((it) => it.dist !== Infinity);
  newDomDistances.sort((a, b) => a.dist - b.dist);

  // Softmax weights
  let expWeights = newDomDistances.map((it) => Math.exp((newDomDistances[0].dist - it.dist) / 100));
  let sum = expWeights.reduce((acc, cur) => acc + cur, 0);

  newDomDistances.forEach((e, i) => (e.weight = expWeights[i] / sum));

  state.domDistances = newDomDistances;
}

function getSignedDistanceRect(x, y, rect) {
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  const dxOut = Math.max(rect.left - x, 0, x - right);
  const dyOut = Math.max(rect.top - y, 0, y - bottom);
  const distOut = Math.hypot(dxOut, dyOut);

  const dxIn = Math.min(x - rect.left, right - x);
  const dyIn = Math.min(y - rect.top, bottom - y);
  const distIn = Math.min(dxIn, dyIn);

  return distOut > 0 ? distOut : -distIn;
}
