
let tracking_headXYs   = [];
let tracking_isLarge   = false;
let tracking_isLogging = false;
let tracking_isObvious = false;
let tracking_debugMode = false;
let tracking_blinkTime = -1;
let tracking_l2x = x => (x - (screen.width - screen.height) / 2) * canvas3D.width  / screen.height + canvas3D_x();
let tracking_l2y = y =>  y                                       * canvas3D.height / screen.height + canvas3D_y();
let tracking_isSteadyEnabled = true;
let tracking_frameHands = false;

let frameToElement = (x, y, element) => {
   x -= (screen.width - screen.height) / 2;

   const rect = element.getBoundingClientRect();
   x = x * rect.width / screen.height + rect.left
   y = y * rect.height / screen.height + rect.top;

   return [x, y]
}

let isShadowAvatar = () => avatarX >= 100 && avatarX < screen.width - 100 &&
                           avatarY >= 100 && avatarY < screen.height - 100;

let as = 0.3; // Avatar scale

let toShadowAvatar = point => {
   point.x = avatarX + as * (point.x - screen.width/2);
   point.y = avatarY + as * (point.y - screen.height/2);
}

let toScreen = (point) => {
   let newPoint = {...point}
   newPoint.x *= screen.width;
   newPoint.y *= screen.height;
   newPoint.z *= screen.width;

   if (isShadowAvatar())
      toShadowAvatar(newPoint);

   if(tracking_frameHands && domDistances[0])
      [newPoint.x, newPoint.y] = frameToElement(newPoint.x, newPoint.y, domDistances[0].element);

   return newPoint;
}

let trackingUpdate = () => {

   // USE PRINCIPAL COMPONENT ANALYSIS TO DETECT AND THEN STEADY FIXATIONS

   let steadyFixations = (P, x, y, eLo, eHi) => {
      let p = pca(P);
      if (tracking_debugMode) {
         octx.fillStyle = '#0080ff';
         octx.font = '50px Helvetica';
         centeredText(octx, p.eigenvalues[0] >> 0, screen.width/2, 50);
      }
      let t = (p.eigenvalues[0] - eLo) / (eHi - eLo);
      t = Math.max(0, Math.min(1, t));
      return [ p.mean[0] * (1-t) + P[P.length-1][0] * t,
               p.mean[1] * (1-t) + P[P.length-1][1] * t ];
   }

   // GIVEN THREE POINTS ON THE FACE, COMPUTE THE USER'S HEAD MATRIX

   let computeHeadMatrix = (a,b,c) => {
      a[1] = -a[1];
      b[1] = -b[1];
      c[1] = -c[1];
      let X = normalize(subtract(a,c));
      let y = subtract(b,mix(a,c,.5));
      let Z = normalize(cross(X,y));
      let Y = normalize(cross(Z,X));
      Z = normalize(add(Z,resize(Y,.3)));
      Y = normalize(cross(Z,X));
      return [ X[0],X[1],X[2],0,
               Y[0],Y[1],Y[2],0,
               Z[0],Z[1],Z[2],0,
               4*(b[0]-.5),4*(b[1]+.625),4*b[2],1 ];
   }

   // GIVEN EDGES OF EYES AND PUPIL, COMPUTE EYE GAZE AND EYE OPEN

   let computeEyeGaze = (la,lb,lc,ld, le,lf,lg,
                         ra,rb,rc,rd, re,rf,rg) => {

      let LX = normalize(subtract(lb,la));
      let lx = dot(subtract(lf,mix(la,lb,.5)),LX)/norm(subtract(lb,la));
      let ly = 2 * (lf[1] - mix(la,lb,.5)[1]) / norm(subtract(lb,la));

      let RX = normalize(subtract(rb,ra));
      let rx = dot(subtract(rf,mix(ra,rb,.5)),RX)/norm(subtract(rb,ra));
      let ry = 2 * (rf[1] - mix(ra,rb,.5)[1]) / norm(subtract(rb,ra));

      eyeGazeX = lx + rx;
      eyeGazeY = ly + ry;

      let lo = norm(subtract(lc,ld)) / norm(subtract(le,lg));
      let ro = norm(subtract(rc,rd)) / norm(subtract(re,rg));

      eyeOpen = (lo + ro) / 2;

      if (eyeOpen < .4 && tracking_blinkTime < 0)
         tracking_blinkTime = Date.now() / 1000;
   }

   if (mediapipe.isRunning) {
      wasTracking = true;

      if (tracking_isLogging) {
         let logTracking = (name, data) => {
            let round = t => (1000 * t >> 0) / 1000;
            trackingInfo += name + '[' + trackingIndex + '] = [\n';
            for (let n = 0 ; n < data.length ; n++)
               trackingInfo += '{x:' + round(data[n].x) +
                               ',y:' + round(data[n].y) +
                               ',z:' + round(data[n].z) + '},\n';
            trackingInfo += '];\n';
         }
         logTracking('left' , mediapipe.handResults[0]?.landmarks);
         logTracking('right', mediapipe.handResults[1]?.landmarks);
         logTracking('face' , mediapipe.faceResults);
         trackingIndex++;
      }

      let pointToArray = p => [ p.x, p.y, p.z ];

      headMatrix = computeHeadMatrix(pointToArray(mediapipe.faceResults[352]),
                                     pointToArray(mediapipe.faceResults[ 10]),
                                     pointToArray(mediapipe.faceResults[123]));

      computeEyeGaze(
         pointToArray(mediapipe.faceResults[263]), // outer lid       // LEFT EYE
         pointToArray(mediapipe.faceResults[398]), // inner lid

         pointToArray(mediapipe.faceResults[374]), // lower lid
         pointToArray(mediapipe.faceResults[386]), // upper lid

         pointToArray(mediapipe.faceResults[477]), // bottom of pupil
         pointToArray(mediapipe.faceResults[473]), // center of pupil
         pointToArray(mediapipe.faceResults[475]), // top of pupil

         pointToArray(mediapipe.faceResults[173]), // outer lid       // RIGHT EYE
         pointToArray(mediapipe.faceResults[ 33]), // inner lid

         pointToArray(mediapipe.faceResults[144]), // lower lid
         pointToArray(mediapipe.faceResults[159]), // upper lid

         pointToArray(mediapipe.faceResults[472]), // bottom of pupil
         pointToArray(mediapipe.faceResults[468]), // center of pupil
         pointToArray(mediapipe.faceResults[470]), // top of pupil
      );
      let mx = screen.width/2, my = screen.height/2;

      headX = 2/3 * headX + 1/3 * (mx + 4.5 * mx * headMatrix[8]);
      headY = 2/3 * headY + 1/3 * (my - 4.5 * mx * headMatrix[9]);

      // MAINTAIN A SMALL QUEUE IN ORDER TO STEADY HEAD GAZE FIXATIONS

      if (tracking_isSteadyEnabled) {
         tracking_headXYs.push([headX, headY]);
         if (tracking_headXYs.length > 16) {
            tracking_headXYs.shift();
	    let headXY = steadyFixations(tracking_headXYs, headX, headY, 100, 2000);
	    headX = headXY[0];
	    headY = headXY[1];
         }
      }
      headX = Math.max( 40, Math.min(screen.width  - 40, headX));
      headY = Math.max( 50, Math.min(screen.height - 80, headY));

      let textArea = codeArea.getElement();
      function getSignedDistanceRect(x, y, rect) {
         const dxOut = Math.max(rect.left - x, 0, x - rect.right);
         const dyOut = Math.max(rect.top - y, 0, y - rect.bottom);
         const distOut = Math.hypot(dxOut, dyOut);
         
         const dxIn = Math.min(x - rect.left, rect.right - x);
         const dyIn = Math.min(y - rect.top, rect.bottom - y);
         const distIn = Math.min(dxIn, dyIn);
         
         return distOut > 0 ? distOut : -distIn;
      }
      
      function smoothstep(low, high, x) {
         const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
         return t * t * (3 - 2 * t);
      }

      let codeBounds = textArea.getBoundingClientRect();
      let codeDist = isCode ? getSignedDistanceRect(head_x(), head_y(), codeBounds) : Infinity;
      let sceneBounds = canvas3D.getBoundingClientRect();
      let sceneDist = isScene ? getSignedDistanceRect(head_x(), head_y(), sceneBounds) : Infinity;
      let slideBounds = {left: D.left, right: D.left + D.w, top: D.top, bottom: D.top + D.h};
      let slideDist = isInfo ? getSignedDistanceRect(head_x(), head_y(), slideBounds) : Infinity;

      domDistances = [
        { bounds: codeBounds, dist: codeDist, element: textArea },
        { bounds: sceneBounds, dist: sceneDist, element: canvas3D },
        { bounds: slideBounds, dist: slideDist, element: canvasDiagram }
      ];
      domDistances = domDistances.filter((it) => it.dist !== Infinity)
      domDistances.sort((a, b) => a.dist - b.dist);
      
      // Softmax weights
      let expWeights = domDistances.map((it) => Math.exp((domDistances[0].dist - it.dist) / 100));
      let sum = expWeights.reduce((acc, cur) => acc + cur, 0);

      domDistances.forEach((e, i) => e.weight = expWeights[i] / sum);

      let closest = domDistances[0];
      if(closest && !focusedElement) {
         let confidence = 0.75 * closest.weight + 0.25 * smoothstep(0, -50, closest.dist)
         octx.save();

         octx.beginPath();
         octx.rect(
            closest.bounds.left, 
            closest.bounds.top, 
            closest.bounds.right - closest.bounds.left, 
            closest.bounds.bottom - closest.bounds.top
         );

         octx.shadowColor = `rgba(0, 128, 255, ${confidence})`;
         octx.shadowBlur = 24 * confidence;

         octx.strokeStyle = `rgba(0, 128, 255, ${confidence})`;
         octx.lineWidth = 2 + confidence * 4;
         octx.stroke();

         octx.restore();
      }

      let focusThreshold = 600 * (Math.max(0.5, closest?.weight ?? 0) - 0.5); // Softness of selection proportional to confidence
      let isCodeLookedAt =
        closest?.element === textArea &&
        closest?.dist < focusThreshold;

      if (
        isCode &&
        (focusedElement == null || focusedElement.element == textArea) &&
        (isCodeLookedAt ||
          codeArea.containsPoint(pen.x, pen.y) ||
          focusedElement?.element == textArea)
      ) {
        textArea.focus();
        octx.fillStyle = "#0080ff40";
        octx.fillRect(
          codeBounds.left,
          codeBounds.top,
          codeBounds.right - codeBounds.left,
          codeBounds.bottom - codeBounds.top
        );
      } else {
        textArea.blur();
      }

      if(tracking_debugMode && domDistances.length > 1) {
         let distances = domDistances.toSorted((a, b) => a.bounds.left - b.bounds.left)
         octx.save();
         octx.font = '24px Helvetica';
         octx.fillStyle = "#0080FF"; 
         octx.fillText("Gaze DOM Selection Confidence", 20, 750);
         for(let i = 0; i < distances.length; i++) {
            octx.fillRect(
               20, 
               800 + i * 30, 
               distances[i].weight * 500, 
               20
            );
         }
         octx.restore();
      }
      

      if (tracking_isObvious)
         for (let eye = -1 ; eye <= 1 ; eye += 2) {
            octx.fillStyle = eyeOpen < .4 ? '#00000080' : '#ffffff40';
            octx.beginPath();
            octx.ellipse(head_x() + 70 * eye, head_y(), 35, 35 * eyeOpen, 0, 0, 2 * Math.PI);
            octx.fill();
            octx.strokeStyle = '#00000040';
            octx.lineWidth = 2;
            octx.beginPath();
            octx.ellipse(head_x() + 70 * eye, head_y(), 35, 35 * eyeOpen, 0, 0, 2 * Math.PI);
            octx.stroke();

            if (eyeOpen >= .4) {
               octx.fillStyle = '#00000040';
               octx.beginPath();
               let ex = 50 * eyeGazeX;
               let t = Math.abs(head_x() - mx) / my;
               let ey = 50 * eyeGazeY + 23
                      -  (9-3*t) * head_y() / my
                      -  8 * t
                      - 30 * Math.pow(Math.max(0, eyeOpen - .7) / .3, 1.5) * .3
                      - 20 * Math.pow(Math.max(0, .7 - eyeOpen) / .3, 1.5) * .3;
               octx.arc(head_x() + 70 * eye + ex, head_y() + ey, 20, 0, 2 * Math.PI);
               octx.fill();
            }
         }
      else {
         if (isShadowAvatar()) {

	    // Draw head and eyes of shadow avatar.

            octx.strokeStyle = '#00000060';
            octx.fillStyle = '#00000060';
            octx.lineWidth = 2;
	    let h = eyeOpen > .5 ? 40 : 10;
            octx.lineWidth = 4;

	    let tilt = Math.atan2(headMatrix[4], headMatrix[5]);
	    octx.translate(avatarX, avatarY);
	    octx.rotate(tilt);

            octx.beginPath();
	    octx.ellipse(0, 0, as * 125, as * 175, 0, 0, 2*Math.PI);
            octx.stroke();

            let theta = Math.PI   * (headX - screen.width/2) / screen.width;
            let phi   = Math.PI/2 * (headY - screen.height/2) / screen.height;
            let dx = 40 * Math.sin(theta) * as;
            let dy = 55 * Math.sin(phi) * as;
            octx.beginPath();
	    octx.ellipse(dx - 55*as, dy - 10*as, 40*as, 35*as*eyeOpen, 0, 0, 2*Math.PI);
	    octx.ellipse(dx + 55*as, dy - 10*as, 40*as, 35*as*eyeOpen, 0, 0, 2*Math.PI);
            octx.fill();

	    octx.rotate(-tilt);
	    octx.translate(-avatarX, -avatarY);
         }
      }

      // IF LARGE MODE IS ENABLED, DO HEAD TRACKING OVER A LARGER AREA.

      let l2x = x => (x - (w/2-h/2)) * canvas3D.width  / h + canvas3D_x();
      let l2y = y =>  y              * canvas3D.height / h + canvas3D_y();

      if (tracking_isLarge) {
         headX = tracking_l2x(headX);
         headY = tracking_l2y(headY);
      }

      // A LONG BLINK ACTS AS A CLICK AT THE HEAD GAZE POSITION.

      if (eyeOpen >= .4 && tracking_blinkTime > 0) {
         let blinkDuration = Date.now() / 1000 - tracking_blinkTime;
         if (blinkDuration > .2) {
            canvas3D_down(head_x(), head_y());
            canvas3D_up(head_x(), head_y());
         }
         tracking_blinkTime = -1;
      }

      gestureTracker.update(mediapipe.handResults)

      let drawHands = () => {
         let zScale = z => Math.max(0.1, Math.min(1, .1 / (.2 + z)));
         octx.save();
         for(const hand of mediapipe.handResults) {
            const currentHand = hand.handedness;
            const fingersToDraw = new Set([0, 1, 2])
            
            octx.fillStyle = "#00000060";
            octx.strokeStyle = "#00000060";

            const activeGesture = gestureTracker.activeGestures[currentHand];
            if (activeGesture) {
               const activeGestureState = toScreen(activeGesture.state[currentHand]);
               activeGesture.fingers.forEach((it) => fingersToDraw.delete(it));
               fingersToDraw.delete(0);

               let radius = 25 * zScale(activeGestureState.z / screen.width);
               if(tracking_isObvious) {
                  switch(activeGesture.id) {
                     case "indexPinch": octx.fillStyle = '#ffff0080'; break;
                     case "middlePinch": octx.fillStyle = '#ff00ff80'; break;
                  }
                  radius *= 2;
               }
               octx.beginPath();
               octx.arc(activeGestureState.x, activeGestureState.y, radius, 0, 2 * Math.PI);
               octx.fill();
            }

            for (const fingerNum of fingersToDraw) {
               const fingerPt = hand.landmarks[4 + 4 * fingerNum];
               const screenFingerPt = toScreen(fingerPt);
               
               let radius = 25 * zScale(fingerPt.z / screen.width);
               if (tracking_isObvious) {
                  switch (fingerNum) {
                     case 0: octx.fillStyle = '#ff000080'; break;
                     case 1: octx.fillStyle = '#00ff0080'; break;
                     case 2: octx.fillStyle = '#0000ff80'; break;
                  }
                  radius *= 2;

                  octx.beginPath();
                  octx.arc(screenFingerPt.x, screenFingerPt.y, radius, 0, 2 * Math.PI);
                  octx.fill();

               } else {
                  octx.lineWidth = 5;
                  octx.beginPath();
                  octx.arc(screenFingerPt.x, screenFingerPt.y, radius, 0, 2 * Math.PI);
                  octx.stroke();

                  octx.beginPath();
                  octx.moveTo(fingerPt.x * screen.width, fingerPt.y * screen.height);
                  octx.lineTo(screenFingerPt.x, screenFingerPt.y);

                  octx.stroke();
               }
            }
         }
         octx.restore();
      }
      if (! isShadowAvatar())
         drawHands();
   }
   else if (wasTracking) {
      if (tracking_isLogging)
         codeArea.getElement().value = trackingInfo;
      wasTracking = false;
   }

   if (mediapipe.handResults[0] || mediapipe.handResults[1]) {
      let x = 0, y = 0, w = 0;
      let lp = [{},{}];
      for (let hand = 0 ; hand <= 1 ; hand++)
         if (mediapipe.handResults[hand]) {
            let d = drawShadowHand(octx, hand,
                                   mediapipe.handResults[hand].landmarks,
                                   avatarX - as * screen.width/2,
                                   avatarY - as * screen.height/2, as, isShadowAvatar());
            if (d < 1) {
	       lp[hand] = mediapipe.handResults[hand].landmarks[0];
               x += screen.width  * lp[hand].x / d;
               y += screen.height * lp[hand].y / d;
               w += 1 / d;
            }
         }
      if (w) {
         avatarX = x / w;
         avatarY = y / w - 300;
      }

      if (isShadowAvatar())
         for (let hand = 0 ; hand <= 1 ; hand++) {
	    let a = mediapipe.handResults[hand].landmarks[4];
	    let b = mediapipe.handResults[hand].landmarks[8];
	    if (norm([a.x-b.x,a.y-b.y,a.z-b.z]) / shadowHandSize[hand] < .003) {
	       let p = toScreen(a);
	       let q = toScreen(b);
	       octx.beginPath();
	       octx.fillStyle = 'white';
	       octx.arc(p.x+q.x>>1, p.y+q.y>>1, as*shadowHandSize[hand], 0, 2*Math.PI);
	       octx.fill();
            }
         }

      // Use change in distance between the two fists to rescale the shadow avatar.

      if (lp[0].x && lp[1].x) {
         let x = lp[1].x - lp[0].x, y = lp[1].y - lp[0].y;
	 let new_hand_separation = Math.sqrt(x * x + y * y);
	 if (hand_separation)
	    as *= new_hand_separation / hand_separation;
	 hand_separation = new_hand_separation;
      }
      else
	 hand_separation = undefined;
   }
}

let hand_separation;

let trackingIndex = 0, wasTracking = false, trackingInfo = 'let left=[],right=[],face=[];';
let headX = 100, headY = 100;
let avatarX = 0, avatarY = 0;
let handAvatar = [{x:0,y:0,s:1},{x:0,y:0,s:1}];
let isSeparateHandAvatars = false;
let headMatrix = identity();
let eyeOpen  = 1;
let eyeGazeX = 0;
let eyeGazeY = 0;
let domDistances = [];
let focusedElement;

let head_x = () => headX;
let head_y = () => headY;

let initializeGestureTracking = () => {
   let indexPinch = new PinchGesture("indexPinch", [1], 0.1);
   
   indexPinch.onStart = ({state, id}, hand) => {
      const h = hand.handedness;
      const {x, y, z} = toScreen(state[h]);

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
      } else if(canvas3D_containsPoint(headX, headY)) {
         state[h].pointer = 'head';
         const eventId = `${id}.${state[h].pointer}`;
         canvas3D_down(headX, headY, 0, eventId)
      }
   };
   
   indexPinch.onActive = ({state, id}, hand) => {

      const h = hand.handedness;
      const {x, y, z} = toScreen(state[h]);

      if (isInfo && D.isDown) {
         slide = slides[slideIndex];
         if (slide.onDrag)
            slide.onDrag(slide._px(x - D.left), slide._py(y - D.top));
         return;
      }

      if(!state[h].pointer) return;

      const eventId = `${id}.${state[h].pointer}`;
      if(state[h].pointer === 'head') {
         canvas3D_move(headX, headY, 0, eventId)
      } else {
         canvas3D_move(x, y, z, eventId)
      }
   };
   
   indexPinch.onEnd = ({state, id}, hand) => {
      const h = hand.handedness;

      const {x, y, z} = toScreen(state[h]);

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
         canvas3D_up(headX, headY, 0, eventId)
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
      if(focusedElement || (focusedElement = domDistances[0]) == null) return;

      domDistances.forEach((elem) => {
         elem.element.style.opacity = 0;
      })

      let element = focusedElement.element;
      element.style.transition = "all 0.1s ease-in-out";
      element.style.opacity = 1;
      element.style.top = '50%';
      element.style.left = '50%';
      element.style.transform = 'translate(-50%, -50%) scale(1.25)';

   }
   spreadGesture.onTriggerBA = (self, hand) => {
      if(!focusedElement) return;

      let element = focusedElement.element;
      element.style.top = focusedElement.bounds.top;
      element.style.left = focusedElement.bounds.left;
      element.style.transform = 'none';
      focusedElement = null

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
initializeGestureTracking();
