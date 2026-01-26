import { drawDomSelection } from "./drawing.js";
import { state } from "./trackingState.js";

export function initializeDomTracking(context) {
  const { codeArea, sceneManager, slideDeck } = context;
  state.domSources = [
    {
      getBounds: () => codeArea.element.getBoundingClientRect(),
      isVisible: () => codeArea.isVisible,
      getElement: () => codeArea.element
    },
    {
      getBounds: () => sceneManager.canvas.element.getBoundingClientRect(),
      isVisible: () => sceneManager.isVisible,
      getElement: () => sceneManager.canvas.element
    },
    {
      getBounds: () => slideDeck.rect,
      isVisible: () => slideDeck.isVisible
    }
  ];
}

export function updateDomFocus(codeArea, pen) {
  evalDomDistances(state.headX, state.headY);

  const closest = state.domDistances[0];
  if (!closest) return;

  const focusThreshold = 600 * (Math.max(0.5, closest.weight) - 0.5); // Softness of selection proportional to confidence

  const isCodeLookedAt =
    closest.element &&
    closest.element === codeArea.element &&
    closest.dist < focusThreshold;
  const isCodeSpotlighted =
    state.spotlightElement && state.spotlightElement === codeArea.element;
  const isCodeHovered = codeArea.containsPoint(pen.x, pen.y);

  const shouldFocusCode = isCodeLookedAt || isCodeSpotlighted || isCodeHovered;

  if(shouldFocusCode && document.activeElement !== codeArea.element) {
    const codeIndex = state.domDistances.findIndex(e => e.element === codeArea.element)
    state.domFocusIndex = codeIndex;
    codeArea.element.focus();
  } else if(!shouldFocusCode && document.activeElement === codeArea.element) {
    state.domFocusIndex = null;
    codeArea.element.blur();
  }
  
  drawDomSelection();
}

function evalDomDistances(x, y) {
  let newDomDistances = state.domSources.map((source) => {
    const bounds = source.getBounds();
    const dist = source.isVisible()
      ? getSignedDistanceRect(x, y, bounds)
      : Infinity;
    const element = source.getElement?.();
    return { bounds, dist, element };
  });

  newDomDistances = newDomDistances.filter((it) => it.dist !== Infinity);
  newDomDistances.sort((a, b) => a.dist - b.dist);

  // Softmax weights
  let expWeights = newDomDistances.map((it) =>
    Math.exp((newDomDistances[0].dist - it.dist) / 100)
  );
  let sum = expWeights.reduce((acc, cur) => acc + cur, 0);

  newDomDistances.forEach((e, i) => (e.weight = expWeights[i] / sum));

  state.domDistances = newDomDistances;
}

function getSignedDistanceRect(x, y, rect) {
  console.log(rect)
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
