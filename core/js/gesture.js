class HandGesture {
  constructor(id, conditionFn, threshold, onStart, onEnd, onHold, holdCooldown = 33) {
    this.id = id
    this.conditionFn = conditionFn
    this.threshold = threshold
    this.onStart = onStart
    this.onEnd = onEnd;
    this.onHold = onHold;
    this.holdCooldown = holdCooldown
    
    this.lastHeldTime = 0;
    this.confidence = 0;
    this.isActive = false;
  }

  update(hand, timestamp = Date.now()) {
    const conditionMet = this.conditionFn(hand)

    this.confidence += conditionMet ? 1 : -1;
    this.confidence = Math.min(Math.max(0, this.confidence), this.threshold)

    if(!this.isActive && this.confidence >= this.threshold) {
      this.isActive = true;
      this.onStart?.(hand);
    } 
    else if(this.isActive && this.confidence == 0) {
      this.isActive = false;
      this.onEnd?.(hand);
    }
    else if(this.isActive && timestamp - this.lastHeldTime > this.holdCooldown) {
      this.lastHeldTime = timestamp;
      this.onHold?.(hand);
    }

    return this.isActive;
  }
}

class GestureTracker {
  constructor() {
    this.gestures = [];
  }

  add(gesture, handedness, priority = 0) {
    this.gestures.push({gesture, handedness, priority})
  }

  remove(id) {
    this.gestures = this.gestures.filter(it => it.gesture.id != id);
  }

  update(hands) {
    const now = Date.now();

    for(const hand of hands) {
      const currentHand = hand.handedness

      for(const { gesture, handedness } of this.gestures) {
        if(handedness && handedness !== currentHand)
          continue;
        if(gesture.update(hand, now))
          break;
      }
    }
  }
}
