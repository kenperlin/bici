
let tracking_headXYs   = [];
let tracking_isLarge   = false;
let tracking_isLogging = false;
let tracking_isObvious = false;
let tracking_isVerbose = false;

let trackingUpdate = () => {

   // USE PRINCIPAL COMPONENT ANALYSIS TO DETECT AND THEN STEADY FIXATIONS

   let steadyFixations = (P, x, y, eLo, eHi) => {
      let p = pca(P);
      if (tracking_isVerbose) {
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
   }

   if (mediapipeTasks.isRunning) {
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
         logTracking('left' , mediapipe_hand[0]);
         logTracking('right', mediapipe_hand[1]);
         logTracking('face' , mediapipe_face);
         trackingIndex++;
      }

      let pointToArray = p => [ p.x, p.y, p.z ];

      headMatrix = computeHeadMatrix(pointToArray(mediapipe_face[352]),
                                     pointToArray(mediapipe_face[ 10]),
                                     pointToArray(mediapipe_face[123]));

      computeEyeGaze(
         pointToArray(mediapipe_face[263]), // outer lid       // LEFT EYE
         pointToArray(mediapipe_face[398]), // inner lid

         pointToArray(mediapipe_face[374]), // lower lid
         pointToArray(mediapipe_face[386]), // upper lid

         pointToArray(mediapipe_face[477]), // bottom of pupil
         pointToArray(mediapipe_face[473]), // center of pupil
         pointToArray(mediapipe_face[475]), // top of pupil

         pointToArray(mediapipe_face[173]), // outer lid       // RIGHT EYE
         pointToArray(mediapipe_face[ 33]), // inner lid

         pointToArray(mediapipe_face[144]), // lower lid
         pointToArray(mediapipe_face[159]), // upper lid

         pointToArray(mediapipe_face[472]), // bottom of pupil
         pointToArray(mediapipe_face[468]), // center of pupil
         pointToArray(mediapipe_face[470]), // top of pupil
      );
      let mx = screen.width/2, my = screen.height/2;

      if (! headX) {
         headX = mx;
         headY = my/2;
      }

      headX = mx + 4.5 * mx * headMatrix[8];
      headY = my - 4.5 * mx * headMatrix[9];

      // MAINTAIN A SMALL QUEUE IN ORDER TO STEADY HEAD GAZE FIXATIONS

      tracking_headXYs.push([headX, headY]);
      if (tracking_headXYs.length > 16) {
         tracking_headXYs.shift();
	 let headXY = steadyFixations(tracking_headXYs, headX, headY, 100, 2000);
	 headX = headXY[0];
	 headY = headXY[1];
      }

      let isWithin = (px,py, x,y,w,h) => px >= x && px < x+w && py >= y && py < y+h;

      let textArea = codeArea.getElement();
      let cx = parseInt(textArea.style.left);
      let cy = parseInt(textArea.style.top );
      let cw = textArea.cols * 11.5;
      let ch = textArea.rows * 21;
      if (codeArea.containsPoint(pen.x,pen.y) || isWithin(headX, headY, -1000,-1000,1000+cx+cw,1000+cy+ch)) {
         textArea.focus();
	 octx.fillStyle = '#0080ff40';
	 octx.fillRect(cx,cy,cw,ch);
      }
      else
         textArea.blur();

      // IF ENLARGED HEAD TRACKING, GIVE VISUAL FEEDBACK.

      if (tracking_isLarge) {
         octx.strokeStyle = '#00000020';
         octx.lineWidth = 8;
         octx.fillStyle = '#00000020';
         for (let j = 0 ; j < 4 ; j++)
         for (let i = 0 ; i < 4 ; i++) {
            let x = w/2 - .3 * h + .2 * h * i;
            let y = .275 * h + .2 * h * j;
            octx.strokeRect(x - .1 * h, y - .1 * h, .18 * h, .18 * h);
         }
      }

      if (tracking_isObvious)
         for (let eye = -1 ; eye <= 1 ; eye += 2) {
            octx.fillStyle = eyeOpen < .4 ? '#00000080' : '#ffffff40';
            octx.beginPath();
            octx.ellipse(headX + 70 * eye, headY, 35, 35 * eyeOpen, 0, 0, 2 * Math.PI);
            octx.fill();
            octx.strokeStyle = '#00000040';
            octx.lineWidth = 2;
            octx.beginPath();
            octx.ellipse(headX + 70 * eye, headY, 35, 35 * eyeOpen, 0, 0, 2 * Math.PI);
            octx.stroke();

            if (eyeOpen >= .4) {
               octx.fillStyle = '#00000040';
               octx.beginPath();
               let ex = 50 * eyeGazeX;
               let t = Math.abs(headX - mx) / my;
               let ey = 50 * eyeGazeY + 23
                      -  (9-3*t) * headY / my
                      -  8 * t
                      - 30 * Math.pow(Math.max(0, eyeOpen - .7) / .3, 1.5) * .3
                      - 20 * Math.pow(Math.max(0, .7 - eyeOpen) / .3, 1.5) * .3;
               octx.arc(headX + 70 * eye + ex, headY + ey, 20, 0, 2 * Math.PI);
               octx.fill();
            }
         }
      else {
         octx.strokeStyle = '#00000060';
         octx.fillStyle = '#00000060';
         octx.lineWidth = 2;
	 let h = eyeOpen > .5 ? 40 : 10;
         octx.lineWidth = 4;
         octx.strokeRect(headX - 20, headY - h/2, 40, h);
	 if (eyeOpen < .4)
            octx.fillRect(headX - 20, headY - h/2, 40, h);

         // VISUAL FEEDBACK FOR EYE GAZE IS DISABLED UNTIL WE GET IT RIGHT.

         if (eyeOpen >= .4) {
	    let x = headX + 3500 * eyeGazeX;
	    let y = headY + 5000 * eyeGazeY + 300;
//          octx.fillRect(x - 20, y - h/4, 40, h);
         }
      }

      let l2x = x => (x - (w/2-h/2)) * canvas3D.width  / h + canvas3D_x();
      let l2y = y =>  y              * canvas3D.height / h + canvas3D_y();

      let hx = headX;
      let hy = headY;
      if (tracking_isLarge) {
         hx = l2x(hx);
         hy = l2y(hy);
         octx.fillStyle = 'black';
         octx.fillRect(hx-8,hy-8,16,16);
      }

      for (let hand = 0 ; hand < 2 ; hand++)
         if (mediapipe_hand[hand]) {
            let r = p => Math.min(1, .1 / (.2 + p[2]));
            let FT = fingerTip[hand];

            for (let f = 0 ; f < 5 ; f++)
               FT[f] = pointToArray(mediapipe_hand[hand][4 + 4 * f]);

            handPinch[hand].x = mx * (FT[0][0] + FT[1][0]);
            handPinch[hand].y = my * (FT[0][1] + FT[1][1]);

            handPinch[hand].f = 0;
            for (let f = 1 ; f < 3 ; f++)
               if (norm(subtract(FT[f],FT[0])) < (f==1?.085:.11) * r(FT[0]))
                  handPinch[hand].f = f;

            for (let f = 0 ; f < 3 ; f++) {
               octx.fillStyle = f==0 ? '#ff000080' : f==1 ? '#00ff0040' : '#0060ff40';
               if (handPinch[hand].f && (f == 0 || handPinch[hand].f == f)) {
                  if (f) {
                     handPinch[hand].x = mx * (FT[0][0] + FT[f][0]);
                     handPinch[hand].y = my * (FT[0][1] + FT[f][1]);
                     if (tracking_isObvious) {
                        octx.fillStyle = f==1 ? '#ffff0080' : '#ff00ff80';
                        octx.beginPath();
                        octx.arc(handPinch[hand].x, handPinch[hand].y, 30 * r(FT[0]), 0,2*Math.PI);
                        octx.fill();
                     }
                     else {
                        octx.fillStyle = '#00000060';
                        octx.beginPath();
                        octx.arc(handPinch[hand].x, handPinch[hand].y, 15 * r(FT[0]), 0,2*Math.PI);
                        octx.fill();
                     }
                  }
               }
               else {
                  if (tracking_isObvious) {
                     let p = fingerTip[hand][f];
                     let px = 2 * mx * p[0];
                     let py = 2 * my * p[1];
                     octx.beginPath();
                     octx.arc(px, py, 40 * r(p), 0,2*Math.PI);
                     octx.fill();
                  }
                  else {
                     let p = fingerTip[hand][f];
                     let px = 2 * mx * p[0];
                     let py = 2 * my * p[1];
                     octx.strokeStyle = '#00000060';
                     octx.lineWidth = 2;
                     octx.beginPath();
                     octx.arc(px, py, 20 * r(p), 0,2*Math.PI);
                     octx.stroke();
                  }
               }
            }

	    let pinchOnCanvas3D = (x,y) => {
	       let isOverCanvas3D = x >= canvas3D_x() && x < canvas3D_x() + canvas3D.width &&
	                            y >= canvas3D_y() && y < canvas3D_y() + canvas3D.height ;
               if (isOverCanvas3D) {
                  if (prevHandPinch[hand].f == 0 && handPinch[hand].f == 1)
	             canvas3D_down(x,y);
                  else if (prevHandPinch[hand].f == 1 && handPinch[hand].f == 0)
	             canvas3D_up(x,y);
                  else
	             canvas3D_move(x,y);
               }
	       else if (prevHandPinch[hand].f == 1 && handPinch[hand].f == 0)
	          canvas3D_up();
               return isOverCanvas3D;
            }

	    if (! pinchOnCanvas3D(handPinch[hand].x, handPinch[hand].y))
	       pinchOnCanvas3D(hx, hy);

            prevHandPinch[hand].f = handPinch[hand].f;
         }
   }
   else if (wasTracking) {
      if (tracking_isLogging)
         codeArea.getElement().value = trackingInfo;
      wasTracking = false;
   }
}

let trackingIndex = 0, wasTracking = false, trackingInfo = 'let left=[],right=[],face=[];';
let headX, headY;
let headMatrix = identity();
let eyeOpen  = 1;
let eyeGazeX = 0;
let eyeGazeY = 0;
let fingerTip = [[],[]];
let handPinch = [{f:0},{f:0}];
let prevHandPinch = [{f:0},{f:0}];

