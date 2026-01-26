import { add, clamp, cross, dot, mix, norm, normalize, resize, subtract } from "../math/math.js";
import { LowPassFilter, PCAFilter } from "./filter.js";
import { state } from "./trackingState.js";
import { drawEyes, drawHands, drawShadowHand } from "./drawing.js";
import { frameToRect, toScreen } from "./mapping.js";

const pcaFilter = new PCAFilter();
const lowPassFilter = new LowPassFilter(2/3);

let pointToArray = p => [ p.x, p.y, p.z ];

export function trackingUpdate(mediapipe) {
   if (!mediapipe.isRunning) return;
   
   const { handResults, faceResults } = mediapipe;

   if(faceResults.length) {
      computeHeadMatrix(pointToArray(faceResults[352]),
                        pointToArray(faceResults[ 10]),
                        pointToArray(faceResults[123]));
   
      computeEyeGaze(
         pointToArray(faceResults[263]), // outer lid       // LEFT EYE
         pointToArray(faceResults[398]), // inner lid
   
         pointToArray(faceResults[374]), // lower lid
         pointToArray(faceResults[386]), // upper lid
   
         pointToArray(faceResults[477]), // bottom of pupil
         pointToArray(faceResults[473]), // center of pupil
         pointToArray(faceResults[475]), // top of pupil
   
         pointToArray(faceResults[173]), // outer lid       // RIGHT EYE
         pointToArray(faceResults[ 33]), // inner lid
   
         pointToArray(faceResults[144]), // lower lid
         pointToArray(faceResults[159]), // upper lid
   
         pointToArray(faceResults[472]), // bottom of pupil
         pointToArray(faceResults[468]), // center of pupil
         pointToArray(faceResults[470]), // top of pupil
      );
   }


   state.headX = clamp(WIDTH / 2 + 4.5 * WIDTH / 2 * state.headMatrix[8], 0, WIDTH);
   state.headY = clamp(HEIGHT / 2 - 4.5 * WIDTH / 2 * state.headMatrix[9], 0, HEIGHT);
   
   [state.headX, state.headY] = lowPassFilter.filter(state.headX, state.headY);

   if (state.isSteady) {
      [state.headX, state.headY] = pcaFilter.filter(state.headX, state.headY);
   }
   if (state.isLarge) {
      state.headX = frameToRect(state.headX, canvas3D.getBoundingClientRect());
      state.headY = frameToRect(state.headY, canvas3D.getBoundingClientRect());
   }

   // A LONG BLINK ACTS AS A CLICK AT THE HEAD GAZE POSITION.

   if (state.eyeOpen >= .4 && state.blinkTime > 0) {
      let blinkDuration = Date.now() / 1000 - state.blinkTime;
      if (blinkDuration > .2) {
         // canvas3D_down(state.headX, state.headY);
         // canvas3D_up(state.headX, state.headY);
      }
      state.blinkTime = -1;
   }

   // gestureTracker.update(handResults)
   drawEyes();

   if (!state.isShadowAvatar())
      drawHands(handResults);

   if (state.isSeparateHandAvatars) {
      for (let hand = 0 ; hand <= 1 ; hand++) {
         if (handResults[hand]) {
            drawShadowHand(OCTX, hand, handResults[hand].landmarks, state.handAvatar[hand].x,
                                                                              state.handAvatar[hand].y,
                                                                              state.handAvatar[hand].s);
            if (state.shadowHandInfo[hand].gesture == 'fist') {
               state.handAvatar[hand].x = state.shadowHandInfo[hand].x * (1 - state.handAvatar[hand].s);
               state.handAvatar[hand].y = state.shadowHandInfo[hand].y * (1 - state.handAvatar[hand].s);
               state.handAvatar[hand].s = .5 * state.handAvatar[hand].s + 
	                            .5 * Math.max(.2, Math.min(1, (35 - state.shadowHandInfo[hand].s) / 15));
               if (state.handAvatar[hand].s == 1)
                  state.handAvatar[hand].x = state.handAvatar[hand].y = 0;
            }
         }
      }

      let fingerTip = (hand, i) => toScreen(handResults[hand].landmarks[4*i+4], hand);

      // If both hands are pinching, draw a line between them.

      if (state.shadowHandInfo[0].gesture == 'pinch' && state.shadowHandInfo[1].gesture == 'pinch') {
         let p0 = fingerTip(0,0);
         let p1 = fingerTip(0,1);
         let q0 = fingerTip(1,0);
         let q1 = fingerTip(1,1);
         OCTX.strokeStyle = '#ff00ff80';
         OCTX.lineWidth   = 10;
         OCTX.beginPath();
         OCTX.moveTo(p0.x + p1.x >> 1, p0.y + p1.y >> 1);
         OCTX.lineTo(q0.x + q1.x >> 1, q0.y + q1.y >> 1);
         OCTX.stroke();
      }

      // If one hand is pinching and the other is gripping, project a line from the pinch to the gripper.

      for (let i = 0 ; i <= 1 ; i++)
         if (state.shadowHandInfo[i].gesture == 'pinch' && state.shadowHandInfo[1-i].gesture == 'gripper') {

            let p0 = fingerTip(i,0);
            let p1 = fingerTip(i,1);
	    let p = { x: p0.x + p1.x >> 1, y: p0.y + p1.y >> 1 };

            let q0 = fingerTip(1-i,0);
            let q1 = fingerTip(1-i,1);

	    if (q0.y > p.y && p.y > q1.y) {
	       let t = (p.y - q0.y) / (q1.y - q0.y);
	       let x = q0.x + t * (q1.x - q0.x);

               OCTX.strokeStyle = '#ff00ff80';
               OCTX.lineWidth   = 10;

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

      if (state.shadowHandInfo[0].gesture == 'gripper' && state.shadowHandInfo[1].gesture == 'gripper') {
         let p0 = fingerTip(0,0);
         let p1 = fingerTip(0,1);
         let q0 = fingerTip(1,0);
         let q1 = fingerTip(1,1);
	 OCTX.fillStyle = OCTX.strokeStyle = '#ff00ff40';
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
	 let x0 = p0.x + p1.x >> 1, x1 = q0.x + q1.x >> 1;
	 let y0 = p1.y + q1.y >> 1, y1 = p0.y + q0.y >> 1;
	 OCTX.fillRect(x0,y0,x1-x0,y1-y0);
	 OCTX.strokeRect(x0,y0,x1-x0,y1-y0);
      }
   }
   else if (handResults[0] || handResults[1]) {
      let x = 0, y = 0, w = 0;
      let lp = [{},{}];
      for (let hand = 0 ; hand <= 1 ; hand++)
         if (handResults[hand]) {
            drawShadowHand(OCTX, hand, handResults[hand].landmarks,
                                       state.avatarX - state.avatarScale * WIDTH/2,
                                       state.avatarY - state.avatarScale * HEIGHT/2, state.avatarScale, state.isShadowAvatar());
            if (state.shadowHandInfo[hand].gesture == 'fist') {
               lp[hand] = handResults[hand].landmarks[0];
	       let closed = 1 / state.shadowHandInfo[hand].open;
               x += WIDTH  * lp[hand].x * closed;
               y += HEIGHT * lp[hand].y * closed;
               w += closed;
            }
         }
      if (w) {
         state.avatarX = x / w;
         state.avatarY = y / w - 300;
      }

      // Use change in distance between the two fists to rescale the shadow avatar.

      if (lp[0].x && lp[1].x) {
         let x = lp[1].x - lp[0].x, y = lp[1].y - lp[0].y;
         let new_hand_separation = Math.sqrt(x * x + y * y);
         if (state.hand_separation)
            state.avatarScale *= new_hand_separation / state.hand_separation;
         state.hand_separation = new_hand_separation;
      }
      else
         state.hand_separation = undefined;
   }
}

function initializeGestureTracking() {
   let indexPinch = new PinchGesture("indexPinch", [1], 0.1);
   
   indexPinch.onStart = ({state, id}, hand) => {
      const h = hand.handedness;
      const {x, y, z} = toScreen(state[h], h);

      if (isInfo && D.isIn(x - D.left, y - D.top)) {
         slide = slides[slideIndex];
         if (slide.onDown)
            slide.onDown(slide._px(x - D.left), slide._py(y - D.top));
         D.isDown = true;
         return;
      }

      if(canvas3D_containsPoint(x, y)) {
         state[h].pointer = hand.handedness;
         const eventId = `${id}.${state[h].pointer}`;
         canvas3D_down(x, y, z, eventId)
      } else if(canvas3D_containsPoint(state.headX, state.headY)) {
         state[h].pointer = 'head';
         const eventId = `${id}.${state[h].pointer}`;
         canvas3D_down(state.headX, state.headY, 0, eventId)
      }
   };
   
   indexPinch.onActive = ({state, id}, hand) => {

      const h = hand.handedness;
      const {x, y, z} = toScreen(state[h], h);

      if (isInfo && D.isDown) {
         slide = slides[slideIndex];
         if (slide.onDrag)
            slide.onDrag(slide._px(x - D.left), slide._py(y - D.top));
         return;
      }

      if(!state[h].pointer) return;

      const eventId = `${id}.${state[h].pointer}`;
      if(state[h].pointer === 'head') {
         canvas3D_move(state.headX, state.headY, 0, eventId)
      } else {
         canvas3D_move(x, y, z, eventId)
      }
   };
   
   indexPinch.onEnd = ({state, id}, hand) => {
      const h = hand.handedness;

      const {x, y, z} = toScreen(state[h], h);

      if (isInfo && D.isDown) {
         D.isDown = false;
         slide = slides[slideIndex];
         if (slide.onUp)
            slide.onUp(slide._px(x - D.left), slide._py(y - D.top));
         return;
      }

      if(!state[h].pointer) return;

      const eventId = `${id}.${state[h].pointer}`;
      if(state[h].pointer === 'head') {
         canvas3D_up(state.headX, state.headY, 0, eventId)
      } else {
         canvas3D_up(x, y, z, eventId)
      }
   };
   
   let middlePinch = new PinchGesture("middlePinch", [2], 0.1);
   
   let detectSpreadStart = (hand) => {
      const scaleFac = Math.min(1, .1 / (.2 + hand.landmarks[4].z));
      let distances = getFingerThumbDistances([1, 2, 3, 4], hand);
      return distances.every((d) => d < 0.15 * scaleFac)
   };

   let detectSpreadEnd = (hand) => {
      const scaleFac = Math.min(1, .1 / (.2 + hand.landmarks[4].z));
      let distances = getFingerThumbDistances([1, 2, 3, 4], hand);
      return distances.every((d) => d > 0.3 * scaleFac)
   };

   let spreadGesture = new MotionGesture("spread", detectSpreadStart, detectSpreadEnd, 300);
   spreadGesture.onTriggerAB = (self, hand) => {
      if(state.spotlightElement || (state.spotlightElement = domDistances[0]) == null) return;

      domDistances.forEach((elem) => {
         elem.element.style.opacity = 0;
      })

      let element = state.spotlightElement.element;
      element.style.transition = "all 0.1s ease-in-out";
      element.style.opacity = 1;
      element.style.top = '50%';
      element.style.left = '50%';
      element.style.transform = 'translate(-50%, -50%) scale(1.25)';

   }
   spreadGesture.onTriggerBA = (self, hand) => {
      if(!state.spotlightElement) return;

      let element = state.spotlightElement.element;
      element.style.top = state.spotlightElement.bounds.top;
      element.style.left = state.spotlightElement.bounds.left;
      element.style.transform = 'none';
      state.spotlightElement = null

      domDistances.forEach((elem) => {
         elem.element.style.opacity = 1;
      })

   }

   const gestureTracker = new GestureTracker();
   gestureTracker.add(indexPinch);
   gestureTracker.add(middlePinch);
   gestureTracker.add(spreadGesture);

   window.gestureTracker = gestureTracker;   
}
// initializeGestureTracking();

// GIVEN THREE POINTS ON THE FACE, COMPUTE THE USER'S HEAD MATRIX
function computeHeadMatrix(a,b,c) {
   a[1] = -a[1];
   b[1] = -b[1];
   c[1] = -c[1];
   let X = normalize(subtract(a,c));
   let y = subtract(b,mix(a,c,.5));
   let Z = normalize(cross(X,y));
   let Y = normalize(cross(Z,X));
   Z = normalize(add(Z,resize(Y,.3)));
   Y = normalize(cross(Z,X));
   state.headMatrix = [ X[0],X[1],X[2],0,
                  Y[0],Y[1],Y[2],0,
                  Z[0],Z[1],Z[2],0,
                  4*(b[0]-.5),4*(b[1]+.625),4*b[2],1 ];
}
// GIVEN EDGES OF EYES AND PUPIL, COMPUTE EYE GAZE AND EYE OPEN
function computeEyeGaze(la,lb,lc,ld, le,lf,lg,
                        ra,rb,rc,rd, re,rf,rg) {

   let LX = normalize(subtract(lb,la));
   let lx = dot(subtract(lf,mix(la,lb,.5)),LX)/norm(subtract(lb,la));
   let ly = 2 * (lf[1] - mix(la,lb,.5)[1]) / norm(subtract(lb,la));

   let RX = normalize(subtract(rb,ra));
   let rx = dot(subtract(rf,mix(ra,rb,.5)),RX)/norm(subtract(rb,ra));
   let ry = 2 * (rf[1] - mix(ra,rb,.5)[1]) / norm(subtract(rb,ra));

   state.eyeGazeX = lx + rx;
   state.eyeGazeY = ly + ry;

   let lo = norm(subtract(lc,ld)) / norm(subtract(le,lg));
   let ro = norm(subtract(rc,rd)) / norm(subtract(re,rg));

   state.eyeOpen = (lo + ro) / 2;

   if (state.eyeOpen < .4 && state.blinkTime < 0)
      state.blinkTime = Date.now() / 1000;
}
