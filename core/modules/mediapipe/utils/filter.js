import { pca } from "../../math/pca.js";

export class PCAFilter2D {
  constructor() {
    this.history = [];
  }

  // USE PRINCIPAL COMPONENT ANALYSIS TO DETECT AND THEN STEADY FIXATIONS
  steadyFixations(eLo, eHi) {
    let p = pca(this.history);
    let t = (p.eigenvalues[0] - eLo) / (eHi - eLo);
    t = Math.max(0, Math.min(1, t));
    return [
      p.mean[0] * (1 - t) + this.history[this.history.length - 1][0] * t,
      p.mean[1] * (1 - t) + this.history[this.history.length - 1][1] * t
    ];
  }

  filter(x, y) {
    this.history.push([x, y]);
    if (this.history.length > 16) {
      this.history.shift();
      return this.steadyFixations(100, 2000);
    }
    return [x, y];
  }
}

export class LowPassFilter2D {
  constructor(factor) {
    this.factor = factor;
    this.lastX = null;
    this.lastY = null;
  }

  filter(x, y) {
    if (this.lastX && this.lastY) {
      x = this.lastX * this.factor + x * (1 - this.factor);
      y = this.lastY * this.factor + y * (1 - this.factor);
    }
    this.lastX = x;
    this.lastY = y;
    return [x, y];
  }
}
export class LowPassFilter1D {
  constructor(factor) {
    this.factor = factor;
    this.prev = null;
  }
  filter(z) {
    if (this.prev) z = this.prev * this.factor + z * (1 - this.factor);
    this.prev = z;
    return z;
  }
}

export class KalmanFilter {
  constructor(dt, processNoise, observationNoise) {
    const state = [[0], [0]]; // Initial state (pos, vel)
    const stateCovariance = [
      [1, 0], // Initial state variance
      [0, 1]
    ];
    const stateTransition = [
      [1, dt], // pos_k+1 = pos_k + dt * vel_k
      [0, 1]
    ]; // vel_k+1 = vel_k

    const observationModel = [[1, 0]]; // Update state from position

    this.dt = dt;
    this.Q = processNoise;
    this.R = observationNoise;

    this.x = state;
    this.P = stateCovariance;
    this.F = stateTransition;
    this.H = observationModel;
  }

  predict() {
    const F = this.F;
    const P = this.P;
    const Q = this.Q;
    // x_k = Fx
    const x_new = [
      [F[0][0] * this.x[0][0] + F[0][1] * this.x[1][0]],
      [F[1][0] * this.x[0][0] + F[1][1] * this.x[1][0]]
    ];

    // P = FPF^T + Q
    const P_new = [
      [
        F[0][0] * P[0][0] * F[0][0] +
          F[0][1] * P[1][0] * F[0][0] +
          F[0][0] * P[0][1] * F[0][1] +
          F[0][1] * P[1][1] * F[0][1] +
          Q,

        F[0][0] * P[0][0] * F[1][0] +
          F[0][1] * P[1][0] * F[1][0] +
          F[0][0] * P[0][1] * F[1][1] +
          F[0][1] * P[1][1] * F[1][1]
      ],
      [
        F[1][0] * P[0][0] * F[0][0] +
          F[1][1] * P[1][0] * F[0][0] +
          F[1][0] * P[0][1] * F[0][1] +
          F[1][1] * P[1][1] * F[0][1],

        F[1][0] * P[0][0] * F[1][0] +
          F[1][1] * P[1][0] * F[1][0] +
          F[1][0] * P[0][1] * F[1][1] +
          F[1][1] * P[1][1] * F[1][1] +
          Q
      ]
    ];

    this.P = P_new;
    this.x = x_new;
  }

  update(z) {
    const P = this.P;
    const H = this.H;
    // y = z - Hx
    const y = z - (H[0][0] * this.x[0][0] + H[0][1] * this.x[1][0]);

    // S = HPH^T + R
    const S = H[0][0] * P[0][0] * H[0][0] + this.R;

    // K = PH^T * S'
    const K = [(P[0][0] * H[0][0]) / S, (P[1][0] * H[0][0]) / S];

    // x = x + Ky
    this.x[0][0] = this.x[0][0] + K[0] * y;
    this.x[1][0] = this.x[1][0] + K[1] * y;

    // P = (I - KH)P
    this.P = [
      [(1 - K[0] * H[0][0]) * P[0][0], (1 - K[0] * H[0][0]) * P[0][1]],
      [-K[1] * H[0][0] * P[0][0] + P[1][0], -K[1] * H[0][0] * P[0][1] + P[1][1]]
    ];

    return this.x[0][0];
  }

  filter(z) {
    this.predict();
    return this.update(z);
  }
}
