import { MotionGesture } from "./detect.js";

export class GestureTracker {
  constructor() {
    this.gestures = [];
    this.active = {
      left: null,
      right: null
    };
  }

  add(gesture, handedness, priority = 0) {
    if (gesture instanceof MotionGesture) priority = Infinity;
    this.gestures.push({ gesture, handedness, priority });
    this.gestures.sort((a, b) => b.priority - a.priority);
  }

  remove(id) {
    this.gestures = this.gestures.filter((it) => it.gesture.id != id);
  }

  update(hands) {
    const now = Date.now();

    this.active["left"] = null;
    this.active["right"] = null;

    for (const hand of hands) {
      const h = hand.handedness;
      for (const { gesture, handedness } of this.gestures) {
        if (handedness && handedness !== h) continue;
        if (this.active[h]) gesture.update(hand, false, now);
        else this.active[h] = gesture.update(hand, true, now) ? gesture : null;
      }
    }
  }
}
