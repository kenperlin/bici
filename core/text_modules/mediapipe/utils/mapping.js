import { videoState } from "../../ui/video.js";
import { trackingState as state } from "../state.js";

export function frameToRect(x, y, rect) {
  x -= (WIDTH - HEIGHT) / 2;
  x = (x * rect.width) / HEIGHT + rect.left;
  y = (y * rect.height) / HEIGHT + rect.top;
  return [x, y];
}

export function toShadowAvatar(point, h) {
  if (state.isSeparateHandAvatars) {
    point.x = state.handAvatar[h].x + state.handAvatar[h].s * point.x;
    point.y = state.handAvatar[h].y + state.handAvatar[h].s * point.y;
  } else {
    point.x = state.globalAvatar.x + state.globalAvatar.s * (point.x - videoState.w / 2);
    point.y = state.globalAvatar.y + state.globalAvatar.s * (point.y - videoState.h / 2);
  }
}

export function toVideo(point) {
  return {
    ...point,
    x: point.x * videoState.w + videoState.x,
    y: point.y * videoState.h + videoState.y,
    z: point.z * videoState.w
  }
}

export function toScreen(point, h) {
  let newPoint = toVideo(point);

  if (state.isShadowAvatar()) toShadowAvatar(newPoint, h);

  if (state.isFramingHands && state.domDistances[0])
    [newPoint.x, newPoint.y] = frameToRect(
      newPoint.x,
      newPoint.y,
      state.domDistances[0].bounds
    );

  return newPoint;
}
