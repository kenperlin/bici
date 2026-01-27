import { videoTransform } from "../canvasUtils.js";
import { state } from "./trackingState.js";

export function frameToRect(x, y, rect) {
  x -= (WIDTH - HEIGHT) / 2;
  x = (x * rect.width) / HEIGHT + rect.left;
  y = (y * rect.height) / HEIGHT + rect.top;
  return [x, y];
}

export function toShadowAvatar(point, hand) {
  if (state.isSeparateHandAvatars) {
    if (hand == "left") hand = 1;
    if (hand == "right") hand = 0;
    point.x = state.handAvatar[hand].x + state.handAvatar[hand].s * point.x;
    point.y = state.handAvatar[hand].y + state.handAvatar[hand].s * point.y;
  } else {
    point.x = state.globalAvatar.x + state.globalAvatar.s * point.x;
    point.y = state.globalAvatar.y + state.globalAvatar.s * point.y;
  }
}

export function toScreen(point, hand) {
  let newPoint = { ...point };
  newPoint.x = newPoint.x * videoTransform.w + videoTransform.x;
  newPoint.y = newPoint.y * videoTransform.h + videoTransform.y;
  newPoint.z *= videoTransform.w;

  if (state.isShadowAvatar()) toShadowAvatar(newPoint, hand);

  if (state.frameHands && state.domDistances[0])
    [newPoint.x, newPoint.y] = frameToRect(
      newPoint.x,
      newPoint.y,
      state.domDistances[0].bounds
    );

  return newPoint;
}
