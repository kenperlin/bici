class HandGesture {
  constructor(id, activationThreshold = 1, activeCooldown = 33, conditionFn) {
    this.id = id;
    this.conditionFn = conditionFn;
    this.activationThreshold = activationThreshold;
    this.activeCooldown = activeCooldown;

    this.onStart = () => {};
    this.onEnd = () => {};
    this.onActive = () => {};

    this.state = {left: {}, right: {}};

    this.lastActiveTime = {left: 0, right: 0};
    this.confidence = {left: 0, right: 0};
    this.isActive = {left: false, right: false};
  }

  update(hand, timestamp = Date.now()) {
    const h = hand.handedness;
    const conditionMet = this.conditionFn(hand);

    this.confidence[h] += conditionMet ? 1 : -1;
    this.confidence[h] = Math.min(Math.max(0, this.confidence[h]), this.activationThreshold);
    
    if (!this.isActive[h] && this.confidence[h] >= this.activationThreshold) {
      this.isActive[h] = true;
      this._onStart?.(hand);
    } else if (this.isActive[h] && this.confidence[h] == 0) {
      this.isActive[h] = false;
      this._onEnd?.(hand);
    }

    if (
      this.isActive[h] &&
      timestamp - this.lastActiveTime[h] > this.activeCooldown
    ) {
      this.lastActiveTime[h] = timestamp;
      this._onActive?.(hand);
    }

    return this.isActive[h];
  }

  _onStart(hand) {
    this.onStart?.(this, hand);
  }
  _onEnd(hand) {
    this.onEnd?.(this, hand);
  }
  _onActive(hand) {
    this.onActive?.(this, hand);
  }
}

class MotionGesture {
  constructor(id, conditionFnA, conditionFnB, maxTimeInterval = 500, triggerCooldown = 500) {
    this.id = id;
    this.conditionFnA = conditionFnA;
    this.conditionFnB = conditionFnB;
    this.maxTimeInterval = maxTimeInterval;
    this.triggerCooldown = triggerCooldown;

    this.onTriggerAB = () => {};
    this.onTriggerBA = () => {};

    this.lastA = {
      left: 0,
      right: 0,
    }
    this.lastB = {
      left: 0,
      right: 0,
    }
    this.lastTrigger = {
      left: 0,
      right: 0,
    }
  }

  update(hand, timestamp = Date.now()) {
    const h = hand.handedness;
    if(timestamp - this.lastTrigger[h] < this.triggerCooldown) return;

    if (this.conditionFnB(hand)) {
      if (timestamp - this.lastA[h] < this.maxTimeInterval) {
        this._onTriggerAB(this, hand);
        this.lastTrigger[h] = timestamp
      }
      this.lastB[h] = timestamp;
    }
    if (this.conditionFnA(hand)) {
      if (timestamp - this.lastB[h] < this.maxTimeInterval) {
        this._onTriggerBA(this, hand);
        this.lastTrigger[h] = timestamp
      }
      this.lastA[h] = timestamp;
    }
  }

  _onTriggerAB(hand) {
    this.onTriggerAB?.(this, hand);
  }
  _onTriggerBA(hand) {
    this.onTriggerBA?.(this, hand);
  }
}

class GestureTracker {
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

class PinchGesture extends HandGesture {
  constructor(id, fingers, maxDistance, activationThreshold = 1, activeCooldown = 33) {
    let detectPinch = (hand) => {
      const scaleFac = Math.min(1, .1 / (.2 + hand.landmarks[4].z));
      let distances = getFingerThumbDistances(fingers, hand);
      return distances.every((d) => d < maxDistance * scaleFac)
    };

    super(id, activationThreshold, activeCooldown, detectPinch);
    this.fingers = fingers;
  }

  updateState(hand) {
    const h = hand.handedness;
    let newState = {...this.state[h], ...hand.landmarks[4]};

    for(let i = 0; i < this.fingers.length; i++) {
      const fingerPt = hand.landmarks[4 + 4 * this.fingers[i]]
      newState.x += fingerPt.x;
      newState.y += fingerPt.y;
      newState.z += fingerPt.z;
    }
    
    newState.x /= (this.fingers.length + 1);
    newState.y /= (this.fingers.length + 1);
    newState.z /= (this.fingers.length + 1);
    newState.duration = (this.state[h]?.duration ?? 0) + 1;

    this.state[h] = newState;
  }


  _onStart(hand) {
    this.updateState(hand);
    super._onStart(hand);
  }

  _onEnd(hand) {
    super._onEnd(hand)
    this.state[hand.handedness] = {};
  }

  _onActive(hand) {
    this.updateState(hand);
    super._onActive(hand)
  }
}

function getFingerThumbDistances(fingers, hand) {
  let pointToArray = p => [ p.x, p.y, p.z ];
  let distances = [];
  const thumbPt = pointToArray(hand.landmarks[4]);

  for (let i = 0; i < fingers.length; i++) {
    const fingerPt = pointToArray(hand.landmarks[4 + 4 * fingers[i]]);
    distances[i] = norm(subtract(fingerPt, thumbPt))
  }
  return distances;
}
