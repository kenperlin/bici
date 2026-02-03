import { clamp } from "../../math/math.js";

export const LM = Object.freeze({
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
  MCPS: [5, 9, 13, 17],
  TIPS: [4, 8, 12, 16, 20],
  FINGERTIPS: [8, 12, 16, 20]
});

export class HandGesture {
  constructor(id, conditionFn, activationThreshold = 5, activeCooldown = 33) {
    this.id = id;
    this.conditionFn = conditionFn;
    this.activationThreshold = activationThreshold;
    this.activeCooldown = activeCooldown;

    this.onStart = () => {};
    this.onEnd = () => {};
    this.onActive = () => {};

    this.state = { left: {}, right: {} };

    this.lastActiveTime = { left: 0, right: 0 };
    this.confidence = { left: 0, right: 0 };
    this.isActive = { left: false, right: false };
  }

  update(hand, silent = false, timestamp = Date.now()) {
    const h = hand.handedness;
    const conditionMet = this.conditionFn(hand);

    this.confidence[h] += conditionMet ? 1 : -1.5;
    this.confidence[h] = clamp(this.confidence[h], 0, this.activationThreshold);

    if (silent) return false;

    if (!this.isActive[h] && this.confidence[h] >= this.activationThreshold) {
      this.isActive[h] = true;
      this._onStart?.(hand);
    } else if (this.isActive[h] && this.confidence[h] == 0) {
      this.isActive[h] = false;
      this._onEnd?.(hand);
    }

    if (this.isActive[h] && timestamp - this.lastActiveTime[h] > this.activeCooldown) {
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

export class MotionGesture {
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
      right: 0
    };
    this.lastB = {
      left: 0,
      right: 0
    };
    this.lastTrigger = {
      left: 0,
      right: 0
    };
  }

  update(hand, silent = false, timestamp = Date.now()) {
    const h = hand.handedness;
    if (silent || timestamp - this.lastTrigger[h] < this.triggerCooldown) return;

    if (this.conditionFnB(hand)) {
      if (timestamp - this.lastA[h] < this.maxTimeInterval) {
        this._onTriggerAB(this, hand);
        this.lastTrigger[h] = timestamp;
      }
      this.lastB[h] = timestamp;
    }
    if (this.conditionFnA(hand)) {
      if (timestamp - this.lastB[h] < this.maxTimeInterval) {
        this._onTriggerBA(this, hand);
        this.lastTrigger[h] = timestamp;
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

export class PinchGesture extends HandGesture {
  constructor(id, fingers, maxDistance, activationThreshold = 3, activeCooldown = 33) {
    let detectPinch = (hand) => {
      const distances = fingerDistances(hand.landmarks, LM.THUMB_TIP, fingers);
      return Math.max(...distances) < maxDistance;
    };

    super(id, detectPinch, activationThreshold, activeCooldown);
    this.fingers = fingers;
  }

  updateState(hand) {
    const h = hand.handedness;
    const indices = this.fingers.map(f => LM.TIPS[f]);
    const newState = lmAverage(hand.landmarks, [LM.THUMB_TIP, ...indices])
    this.state[h] = {...this.state[h], ...newState};
    this.state[h].duration = (this.state[h]?.duration ?? 0) + 1
  }

  _onStart(hand) {
    this.updateState(hand);
    super._onStart(hand);
  }

  _onEnd(hand) {
    super._onEnd(hand);
    this.state[hand.handedness] = {};
  }

  _onActive(hand) {
    this.updateState(hand);
    super._onActive(hand);
  }
}

export function fingerDistances(landmarks, reference, fingers = [1, 2, 3, 4]) {
  const scale = handScale(landmarks);
  return fingers.map((f) => lmDistance(landmarks, reference, LM.TIPS[f]) / scale);
}

export function handScale(landmarks) {
  // Get hand scale in 3D space based on palm size from landmarks
  const palmWidth = lmDistance(landmarks, LM.INDEX_MCP, LM.PINKY_MCP);
  const palmLength = lmDistance(landmarks, LM.WRIST, LM.MIDDLE_MCP);
  return Math.max(palmWidth, palmLength, 0.01);
}

export function lmDistance(landmarks, a, b) {
  const dx = landmarks[a].x - landmarks[b].x;
  const dy = landmarks[a].y - landmarks[b].y;
  const dz = landmarks[a].z - landmarks[b].z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lmAverage(landmarks, indices) {
  const sum = indices.reduce(
    (acc, i) => ({
      x: acc.x + landmarks[i].x,
      y: acc.y + landmarks[i].y,
      z: acc.z + landmarks[i].z
    }),
    { x: 0, y: 0, z: 0 }
  );
  const n = indices.length;
  return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
}
