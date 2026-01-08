class HandGesture {
  constructor(id, activationThreshold = 1, activeCooldown = 33, conditionFn) {
    this.id = id;
    this.conditionFn = conditionFn;
    this.activationThreshold = activationThreshold;
    this.activeCooldown = activeCooldown;

    this.onStart = () => {};
    this.onEnd = () => {};
    this.onActive = () => {};
    this.state = {};

    this.lastActiveTime = 0;
    this.confidence = 0;
    this.isActive = false;
  }

  update(hand, timestamp = Date.now()) {
    const conditionMet = this.conditionFn(hand);

    this.confidence += conditionMet ? 1 : -1;
    this.confidence = Math.min(Math.max(0, this.confidence), this.activationThreshold);

    if (!this.isActive && this.confidence >= this.activationThreshold) {
      this.isActive = true;
      this.onStart?.(hand);
    } else if (this.isActive && this.confidence == 0) {
      this.isActive = false;
      this.onEnd?.(hand);
    }

    if (
      this.isActive &&
      timestamp - this.lastActiveTime > this.activeCooldown
    ) {
      this.lastActiveTime = timestamp;
      this.onActive?.(hand);
    }

    return this.isActive;
  }
}

class GestureTracker {
  constructor() {
    this.gestures = [];
    this.activeIds = {
      left: null,
      right: null,
    };
  }

  add(gesture, handedness, priority = 0) {
    this.gestures.push({ gesture, handedness, priority });
  }

  remove(id) {
    this.gestures = this.gestures.filter((it) => it.gesture.id != id);
  }

  update(hands) {
    const now = Date.now();
    for (const hand of hands) {
      const currentHand = hand.handedness;
      let activeId = null;

      for (const { gesture, handedness } of this.gestures) {
        if (handedness && handedness !== currentHand) continue;
        if (gesture.update(hand, now)) {
          activeId = gesture.id;
          break;
        }
      }

      this.activeIds[currentHand] = activeId;
    }
  }
}

class PinchGesture extends HandGesture {
  constructor(id, fingers, distance, activationThreshold = 1, activeCooldown = 33) {
    
    let pointToArray = p => [ p.x, p.y, p.z ];
    let detectPinch = (hand) => {
      const thumbPt = pointToArray(hand.landmarks[4]);
      const scaleFac = Math.min(1, .1 / (.2 + thumbPt[2]));

      for(let i = 0; i < fingers.length; i++) {
        const fingerPt = pointToArray(hand.landmarks[4 + 4 * fingers[i]])
        const isPinching = norm(subtract(fingerPt, thumbPt)) < distance * scaleFac;
        if(!isPinching) return false;
      }
      return true;
    }

    super(id, activationThreshold, activeCooldown, detectPinch);

    this.onActive = (hand) => {
      let newState = {...hand.landmarks[4]};

      for(let i = 0; i < fingers.length; i++) {
        const fingerPt = hand.landmarks[4 + 4 * fingers[i]]
        newState.x += fingerPt.x;
        newState.y += fingerPt.y;
        newState.z += fingerPt.z;
      }
      
      newState.x *= screen.width / (fingers.length + 1);
      newState.y *= screen.height / (fingers.length + 1);
      newState.z *= screen.width / (fingers.length + 1);
      newState.duration = (this.state?.duration ?? 0) + 1;

      this.state = newState;
    }

    this.onEnd = () => {
      this.state = {};
    }
  }
}

let indexPinch = new PinchGesture('indexPinch', [1], 0.085);
let middlePinch = new PinchGesture('middle', [2], 0.085);

const gestureTracker = new GestureTracker();
gestureTracker.add(indexPinch);
gestureTracker.add(middlePinch);
