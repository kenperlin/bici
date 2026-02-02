export class GestureTracker {
  constructor() {
    this.gestures = [];
    this.activeGestures = {
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

    for (const hand of hands) {
      const h = hand.handedness;
      let activeGesture = null;

      for (const { gesture, handedness } of this.gestures) {
        if (handedness && handedness !== h) continue;
        if (gesture.update(hand, now)) {
          activeGesture = gesture;
          break;
        }
      }

      this.activeGestures[h] = activeGesture;
    }
  }
}
