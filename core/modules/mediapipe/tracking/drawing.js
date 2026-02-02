
import { smoothstep } from "../../math/math.js";
import { toScreen } from "../utils/mapping.js";
import { trackingState as state } from "../state.js";

export function drawHands(handResults) {
   let zScale = z => Math.max(.15, Math.min(1, .1 / (.2 + z)));
   OCTX.save();
   for(const hand of handResults) {
      const h = hand.handedness;
      const fingersToDraw = new Set([0, 1, 2])
      
      OCTX.fillStyle = "#00000060";
      OCTX.strokeStyle = "#00000060";

      // const activeGesture = gestureTracker.activeGestures[h];
      // if (activeGesture) {
      //    const activeGestureState = toScreen(activeGesture.state[h], h);
      //    activeGesture.fingers.forEach((it) => fingersToDraw.delete(it));
      //    fingersToDraw.delete(0);

      //    let radius = 25 * zScale(activeGestureState.z / WIDTH);
      //    if(state.isObvious) {
      //       switch(activeGesture.id) {
      //          case "indexPinch": OCTX.fillStyle = '#ffff0080'; break;
      //          case "middlePinch": OCTX.fillStyle = '#ff00ff80'; break;
      //       }
      //       radius *= 2;
      //    }
      //    OCTX.beginPath();
      //    OCTX.arc(activeGestureState.x, activeGestureState.y, radius, 0, 2 * Math.PI);
      //    OCTX.fill();
      // }

      for (const fingerNum of fingersToDraw) {
         const fingerPt = hand.landmarks[4 + 4 * fingerNum];
         const screenFingerPt = toScreen(fingerPt, h);
         
         let radius = 15 * zScale(fingerPt.z);
         if (state.isObvious) {
            switch (fingerNum) {
               case 0: OCTX.fillStyle = '#ff000080'; break;
               case 1: OCTX.fillStyle = '#00ff0080'; break;
               case 2: OCTX.fillStyle = '#0000ff80'; break;
            }
            radius *= 2;

            OCTX.beginPath();
            OCTX.arc(screenFingerPt.x, screenFingerPt.y, radius, 0, 2 * Math.PI);
            OCTX.fill();

         } else {
            OCTX.lineWidth = 5;
            OCTX.beginPath();
            OCTX.arc(screenFingerPt.x, screenFingerPt.y, radius, 0, 2 * Math.PI);
            OCTX.stroke();

            OCTX.beginPath();
            OCTX.moveTo(fingerPt.x * WIDTH, fingerPt.y * HEIGHT);
            OCTX.lineTo(screenFingerPt.x, screenFingerPt.y);

            OCTX.stroke();
         }
      }
   }
   OCTX.restore();
}

export function drawDomSelection() {
   const closest = state.domDistances[0];
   if(closest && !state.spotlightElement) {
      const confidence = 0.75 * closest.weight + 0.25 * smoothstep(closest.dist, 0, -50)
      OCTX.save();

      OCTX.beginPath();
      OCTX.rect(
         closest.bounds.left, 
         closest.bounds.top, 
         closest.bounds.width, 
         closest.bounds.height,
      );

      OCTX.shadowColor = `rgba(0, 128, 255, ${confidence})`;
      OCTX.shadowBlur = 24 * confidence;

      OCTX.strokeStyle = `rgba(0, 128, 255, ${confidence})`;
      OCTX.lineWidth = 1 + confidence * 2;
      OCTX.stroke();

      OCTX.restore();
   }

   if (state.domFocusIndex != null) {
      const focusedElement = state.domDistances[state.domFocusIndex];
      OCTX.save();
      OCTX.fillStyle = "#0080ff40";
      OCTX.fillRect(
         focusedElement.bounds.left,
         focusedElement.bounds.top,
         focusedElement.bounds.width,
         focusedElement.bounds.height,
      );
      OCTX.restore();
   }

   if(state.debugMode && state.domDistances.length > 1) {
      let distances = state.domDistances.toSorted((a, b) => a.bounds.left - b.bounds.left)
      OCTX.save();
      OCTX.font = '24px Helvetica';
      OCTX.fillStyle = "#0080FF"; 
      OCTX.fillText("Gaze DOM Selection Confidence", 20, 750);
      for(let i = 0; i < distances.length; i++) {
         OCTX.fillRect(
            20, 
            800 + i * 30, 
            distances[i].weight * 500, 
            20
         );
      }
      OCTX.restore();
   }
}

export function drawEyes() {
   OCTX.save();
  if (state.isObvious)
    for (let eye = -1 ; eye <= 1 ; eye += 2) {
        OCTX.fillStyle = state.eyeOpen < .4 ? '#00000080' : '#ffffff40';
        OCTX.beginPath();
        OCTX.ellipse(state.headX + 70 * eye, state.headY, 35, 35 * state.eyeOpen, 0, 0, 2 * Math.PI);
        OCTX.fill();
        OCTX.strokeStyle = '#00000040';
        OCTX.lineWidth = 2;
        OCTX.beginPath();
        OCTX.ellipse(state.headX + 70 * eye, state.headY, 35, 35 * state.eyeOpen, 0, 0, 2 * Math.PI);
        OCTX.stroke();

        if (state.eyeOpen >= .4) {
          OCTX.fillStyle = '#00000040';
          OCTX.beginPath();
          let ex = 50 * state.eyeGazeX;
          let t = Math.abs(state.headX - WIDTH / 2) / (HEIGHT / 2);
          let ey = 50 * state.eyeGazeY + 23
                    -  (9-3*t) * state.headY / (HEIGHT / 2);
                    -  8 * t
                    - 30 * Math.pow(Math.max(0, state.eyeOpen - .7) / .3, 1.5) * .3
                    - 20 * Math.pow(Math.max(0, .7 - state.eyeOpen) / .3, 1.5) * .3;
          OCTX.arc(state.headX + 70 * eye + ex, state.headY + ey, 20, 0, 2 * Math.PI);
          OCTX.fill();
        }
    }
  else {
    if (state.isShadowAvatar() && ! state.isSeparateHandAvatars) {

        // Draw head and eyes of shadow avatar.

        OCTX.strokeStyle = '#00000060';
        OCTX.fillStyle = '#00000060';
        OCTX.lineWidth = 2;
        const s = state.globalAvatar.s;
        OCTX.lineWidth = 4;

        let tilt = Math.atan2(state.headMatrix[4], state.headMatrix[5]);
        OCTX.translate(state.globalAvatar.x, state.globalAvatar.y);
        OCTX.rotate(tilt);

        OCTX.beginPath();
        OCTX.ellipse(0, 0, s * 125, s * 175, 0, 0, 2*Math.PI);
        OCTX.stroke();

        let theta = Math.PI   * (state.headX - WIDTH/2) / WIDTH;
        let phi   = Math.PI/2 * (state.headY - HEIGHT/2) / HEIGHT;
        let dx = 40 * Math.sin(theta) * s;
        let dy = 55 * Math.sin(phi) * s;
        OCTX.beginPath();
        OCTX.ellipse(dx - 55*s, dy - 10*s, 40*s, 35*s*state.eyeOpen, 0, 0, 2*Math.PI);
        OCTX.ellipse(dx + 55*s, dy - 10*s, 40*s, 35*s*state.eyeOpen, 0, 0, 2*Math.PI);
        OCTX.fill();

        OCTX.rotate(-tilt);
        OCTX.translate(-state.globalAvatar.x, -state.globalAvatar.y);
    }
  }
  OCTX.restore();
}

const shadowCanvas = document.createElement('canvas');
const sctx = shadowCanvas.getContext('2d');

export function drawShadowHand(hand, avatarInfo) {
   if(!state.isShadowAvatar()) return;
   
   const { x, y, s } = avatarInfo
   const { handedness: h, landmarks} = hand

   // Behind the scenes, create a separate shadow canvas.
   shadowCanvas.width = OCTX.canvas.width;
   shadowCanvas.height = OCTX.canvas.height;

   // Clear the shadow canvas before drawing the hand.
   sctx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);

   // Draw an opaque shadow of the hand to the shadow canvas.
   for (let n = 1 ; n <= 20 ; n += 4) {
      let r = s * state.shadowHandInfo[h].s * (n < 6 ? 1.1 : n < 11 ? 1 : .85);
      sctx.fillStyle = sctx.strokeStyle = 'black';
      sctx.lineWidth = 2 * r;
      let i0 = n > 1 ? 0 : 1;         // skip first thumb joint
      for (let i = i0 ; i < 4 ; i++) {
         const jointPos = toScreen(landmarks[n+i], h)
         if (i > i0) {
            sctx.beginPath();
            sctx.arc(jointPos.x, jointPos.y, r, 0, 2 * Math.PI);
            sctx.fill();
         }
         if (i < 3) {
            const nextJointPos = toScreen(landmarks[n+i+1], h)
            sctx.beginPath();
            sctx.moveTo(jointPos.x, jointPos.y,);
            sctx.lineTo(nextJointPos.x, nextJointPos.y,);
            sctx.stroke();
         }
      }
   }

   // If pointing, draw a ray out of the index finger.
   if (state.shadowHandInfo[h].gesture == 'point') {
      let a = toScreen(landmarks[5], h);
      let b = toScreen(landmarks[8], h);
      for (let i = 0 ; i <= 1 ; i++) {
         sctx.strokeStyle = i ? "#a0a0a0" : "black";
         sctx.lineWidth = s * (20 - 10 * i);
         sctx.beginPath();
         sctx.moveTo(b.x, b.y);
         sctx.lineTo(b.x + 100 * (b.x - a.x), b.y + 100 * (b.y - a.y));
         sctx.stroke();
      }
   }

   // If making a gripper gesture, show the line between thumb and index fingers.
   if (state.shadowHandInfo[h].gesture == 'gripper') {
      let p = toScreen(landmarks[4], h);
      let q = toScreen(landmarks[8], h);
      for (let i = 0 ; i <= 1 ; i++) {
         sctx.strokeStyle = i ? '#a0a0a0' : 'black';
         sctx.lineWidth = s * (20 - 10*i);
         sctx.beginPath();
         sctx.moveTo(p.x,p.y);
         sctx.lineTo(q.x,q.y);
         sctx.stroke();
      }
   }

   // If pinching, show pinch point.
   if (state.shadowHandInfo[h].gesture == 'pinch') {
      let p = toScreen(landmarks[4], h);
      let q = toScreen(landmarks[8], h);
      sctx.beginPath();
      sctx.fillStyle = '#a0a0a0';
      sctx.arc(p.x+q.x>>1, p.y+q.y>>1, .7*s * state.shadowHandInfo[h].s, 0, 2*Math.PI);
      sctx.fill();
   }

   // Copy the shadow transparently onto the target canvas.
   OCTX.globalAlpha = 0.3;
   OCTX.drawImage(shadowCanvas, 0,0);
   OCTX.globalAlpha = 1.0;
}

export function drawShadowGesture(handResults) {
    OCTX.save();

    const leftHand = handResults.find(e => e.handedness === "left")
    const rightHand = handResults.find(e => e.handedness === "right")

    if(!leftHand || !rightHand) return;

    let fingerTip = (hand, i) => {
      return toScreen(hand.landmarks[4 * i + 4], hand.handedness)
    };

    // If both hands are pinching, draw a line between them.
    if (
      state.shadowHandInfo.left.gesture == "pinch" &&
      state.shadowHandInfo.right.gesture == "pinch"
    ) {
      let p0 = fingerTip(leftHand, 0);
      let p1 = fingerTip(leftHand, 1);
      let q0 = fingerTip(rightHand, 0);
      let q1 = fingerTip(rightHand, 1);
      OCTX.strokeStyle = "#ff00ff80";
      OCTX.lineWidth = 10;
      OCTX.beginPath();
      OCTX.moveTo((p0.x + p1.x) >> 1, (p0.y + p1.y) >> 1);
      OCTX.lineTo((q0.x + q1.x) >> 1, (q0.y + q1.y) >> 1);
      OCTX.stroke();
    }

    // If one hand is pinching and the other is gripping, project a line from the pinch to the gripper.
   if (
      (state.shadowHandInfo.left.gesture == "pinch" &&
         state.shadowHandInfo.right.gesture == "gripper") ||
      (state.shadowHandInfo.left.gesture == "gripper" &&
         state.shadowHandInfo.right.gesture == "pinch")
   ) {
      const isLeftPinch = state.shadowHandInfo.left.gesture === "pinch"
      const pincher = isLeftPinch ? leftHand : rightHand;
      const gripper = isLeftPinch ? rightHand : leftHand;

      let p0 = fingerTip(pincher, 0);
      let p1 = fingerTip(pincher, 1);
      let p = { x: (p0.x + p1.x) >> 1, y: (p0.y + p1.y) >> 1 };

      let q0 = fingerTip(gripper, 0);
      let q1 = fingerTip(gripper, 1);

      if (q0.y > p.y && p.y > q1.y) {
         let t = (p.y - q0.y) / (q1.y - q0.y);
         let x = q0.x + t * (q1.x - q0.x);

         OCTX.strokeStyle = "#ff00ff80";
         OCTX.lineWidth = 10;

         OCTX.beginPath();
         OCTX.moveTo(q0.x, q0.y);
         OCTX.lineTo(q1.x, q1.y);
         OCTX.stroke();

         OCTX.beginPath();
         OCTX.moveTo(p.x, p.y);
         OCTX.lineTo(x, p.y);
         OCTX.stroke();
      }
   }

    // If both hands are gripping, create a rectangle between them.

    if (
      state.shadowHandInfo.left.gesture == "gripper" &&
      state.shadowHandInfo.right.gesture == "gripper"
    ) {
      let p0 = fingerTip(leftHand, 0);
      let p1 = fingerTip(leftHand, 1);
      let q0 = fingerTip(rightHand, 0);
      let q1 = fingerTip(rightHand, 1);
      OCTX.fillStyle = OCTX.strokeStyle = "#ff00ff40";
      OCTX.lineWidth = 10;
      /*
	 OCTX.beginPath();
	 OCTX.moveTo(p0.x,p0.y);
	 OCTX.lineTo(p1.x,p1.y);
	 OCTX.lineTo(q1.x,q1.y);
	 OCTX.lineTo(q0.x,q0.y);
	 OCTX.lineTo(p0.x,p0.y);
	 OCTX.fill();
	 OCTX.stroke();
*/
      let x0 = (p0.x + p1.x) >> 1,
        x1 = (q0.x + q1.x) >> 1;
      let y0 = (p1.y + q1.y) >> 1,
        y1 = (p0.y + q0.y) >> 1;
      OCTX.fillRect(x0, y0, x1 - x0, y1 - y0);
      OCTX.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }
    OCTX.restore()
}
