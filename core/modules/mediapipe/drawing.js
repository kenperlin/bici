
import { smoothstep } from "../math/math.js";
import { toScreen } from "./mapping.js";
import { state } from "./trackingState.js";

export function drawHands(handResults) {
   let zScale = z => Math.max(.15, Math.min(1, .1 / (.2 + z)));
   OCTX.save();
   for(const hand of handResults) {
      const currentHand = hand.handedness;
      const fingersToDraw = new Set([0, 1, 2])
      
      OCTX.fillStyle = "#00000060";
      OCTX.strokeStyle = "#00000060";

      // const activeGesture = gestureTracker.activeGestures[currentHand];
      // if (activeGesture) {
      //    const activeGestureState = toScreen(activeGesture.state[currentHand], currentHand);
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
         const screenFingerPt = toScreen(fingerPt, currentHand);
         
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
        let h = state.eyeOpen > .5 ? 40 : 10;
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

export function drawShadowHand(ctx, hand, F, avatarInfo, isDrawing=true) {
   const { x, y, s } = avatarInfo
   // Behind the scenes, create a separate shadow canvas.

   if (! ctx.shadowCanvas) {
      ctx.shadowCanvas = document.createElement('canvas');
      // document.body.appendChild(ctx.shadowCanvas);
      // ctx.shadowCanvas.style = '{position:absolute;left:-2000px}';
      ctx.shadowCanvas.width = ctx.canvas.width;
      ctx.shadowCanvas.height = ctx.canvas.height;
   }

   // Clear the shadow canvas before drawing the hand.

   let sctx = ctx.shadowCanvas.getContext('2d');
   let w = ctx.canvas.width, h = ctx.canvas.height;
   sctx.clearRect(0,0,w,h);

   // Functions to measure distance between two hand joints

   let distance = (i,j) => {
      let x = F[i].x - F[j].x;
      let y = F[i].y - F[j].y;
      let z = F[i].z - F[j].z;
      return Math.sqrt(x*x + y*y + z*z);
   }

   let distance2D = (i,j) => {
      let x = F[i].x - F[j].x;
      let y = F[i].y - F[j].y;
      return Math.sqrt(x*x + y*y);
   }

   // Scale finger thickness depending on visible hand size.

   let t = 0;
   for (let n = 1 ; n <= 20 ; n += 4) // loop over 5 fingers
   for (let i = 0 ; i < 3 ; i++)      // loop over 3 finger joints
      t += distance(n+i, n+i+1);
   t = t < 1 ? Math.sqrt(t) : t;
   state.shadowHandInfo[hand].s = .017 * w * t;

   state.shadowHandInfo[hand].x = w * F[10].x;
   state.shadowHandInfo[hand].y = h * F[10].y;

   let D = [];
   D[0] = distance(4, 5) / t;
   for (let j = 1 ; j < 5 ; j++)
      D[j] = distance(0, 4*j+3) / t;

   state.shadowHandInfo[hand].open = D[1] + D[2] + D[3] + D[4];

   state.shadowHandInfo[hand].gesture = null;

   if (Math.max(D[1],D[2],D[3],D[4]) < .3)
      state.shadowHandInfo[hand].gesture = 'fist';

   if (D[0] < .1 && D[1] > .3 && Math.max(D[2],D[3],D[4]) < .3)
      state.shadowHandInfo[hand].gesture = 'point';

   if (state.shadowHandInfo[hand].gesture == null && distance(4,8) / state.shadowHandInfo[hand].s < .002)
      state.shadowHandInfo[hand].gesture = 'pinch';

   if ( state.shadowHandInfo[hand].gesture == null &&
        D[0] > .1 &&
	distance2D(4,5) / t > .1 &&
	distance(4,8) < 1.5 * distance(5,8))
      state.shadowHandInfo[hand].gesture = 'gripper';

   if (! isDrawing)
      return;

   // If pointing, draw a ray out of the index finger.

   if (state.shadowHandInfo[hand].gesture == 'point') {
      let ax = s * w * F[5].x + x, ay = s * h * F[5].y + y;
      let bx = s * w * F[8].x + x, by = s * h * F[8].y + y;
      for (let i = 0 ; i <= 1 ; i++) {
         sctx.strokeStyle = i ? '#a0a0a0' : 'black';
         sctx.lineWidth = s * (20 - 10*i);
         sctx.beginPath();
         sctx.moveTo(bx,by);
         sctx.lineTo(bx+100*(bx-ax),by+100*(by-ay));
         sctx.stroke();
      }
   }

   // Draw an opaque shadow of the hand to the shadow canvas.

   for (let n = 1 ; n <= 20 ; n += 4) {
      let r = s * state.shadowHandInfo[hand].s * (n < 6 ? 1.1 : n < 11 ? 1 : .85);
      sctx.fillStyle = sctx.strokeStyle = 'black';
      sctx.lineWidth = 2 * r;
      let i0 = n > 1 ? 0 : 1;         // skip first thumb joint
      for (let i = i0 ; i < 4 ; i++) {
         if (i > i0) {
            sctx.beginPath();
            sctx.arc(w*F[n+i].x*s+x,h*F[n+i].y*s+y,r,0,2*Math.PI);
            sctx.fill();
         }
         if (i < 3) {
            sctx.beginPath();
            sctx.moveTo(w*F[n+i  ].x*s+x,h*F[n+i  ].y*s+y);
            sctx.lineTo(w*F[n+i+1].x*s+x,h*F[n+i+1].y*s+y);
            sctx.stroke();
         }
      }
   }

   // If making a gripper gesture, show the line between thumb and index fingers.

   if (state.shadowHandInfo[hand].gesture == 'gripper') {
      let p = toScreen(F[4], hand);
      let q = toScreen(F[8], hand);
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

   if (state.shadowHandInfo[hand].gesture == 'pinch') {
      let p = toScreen(F[4], hand);
      let q = toScreen(F[8], hand);
      sctx.beginPath();
      sctx.fillStyle = '#a0a0a0';
      sctx.arc(p.x+q.x>>1, p.y+q.y>>1, .7*s * state.shadowHandInfo[hand].s, 0, 2*Math.PI);
      sctx.fill();
   }

   // Copy the shadow transparently onto the target canvas.

   ctx.globalAlpha = 0.3;
   ctx.drawImage(ctx.shadowCanvas, 0,0);
   ctx.globalAlpha = 1.0;
}
