
let isLoggingTracking = false;

let trackingUpdate = () => {

   // GIVEN THREE POINTS ON THE FACE, COMPUTE THE USER'S HEAD MATRIX

   let computeHeadMatrix = (a,b,c) => {
      a[1] = -a[1];
      b[1] = -b[1];
      c[1] = -c[1];
      let X = normalize(subtract(c,a));
      let z = subtract(b,mix(a,c,.5));
      let Y = normalize(cross(z,X));
      let Z = normalize(cross(X,Y));
      headMatrix = [ X[0],X[1],X[2],0,
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

      if (isLoggingTracking) {
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

      computeHeadMatrix(pointToArray(mediapipe_face[280]),
                        pointToArray(mediapipe_face[  4]),
                        pointToArray(mediapipe_face[ 50]));

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

      ctx.fillStyle = eyeOpen < .5 ? '#000000' : '#ffffff40';
      if (! headX) {
         headX = mx;
         headY = my/2;
      }
      let x = mx + 3 * mx * headMatrix[8];
      let y = my - 3 * mx * headMatrix[9];
      headX = .5 * headX + .5 * x;
      headY = .5 * headY + .5 * y;

      ctx.beginPath();
      ctx.ellipse(headX,headY,100,100*eyeOpen,0,0,2*Math.PI);
      ctx.fill();

      if (eyeOpen >= .5) {
         ctx.fillStyle = 'black';
         ctx.beginPath();
         let ex = 200 * eyeGazeX;
         let ey = 400 * eyeGazeY + 100 - 35 * headY / my - 25 * Math.abs(headX - mx) / my;
         ctx.arc(headX + ex, headY + ey, 20,0,2*Math.PI);
         ctx.fill();
      }

      for (let hand = 0 ; hand < 2 ; hand++)
         if (mediapipe_hand[hand]) {
	    let r = p => Math.min(1, .1 / (.2 + p[2]));
	    let FT = fingerTip[hand];

            for (let f = 0 ; f < 5 ; f++)
               FT[f] = pointToArray(mediapipe_hand[hand][4 + 4 * f]);

            handPinch[hand] = 0;
            for (let f = 1 ; f < 3 ; f++)
               if (norm(subtract(FT[f],FT[0])) < (f==1?.085:.11) * r(FT[0]))
                  handPinch[hand] = f;

            for (let f = 0 ; f < 3 ; f++) {
               ctx.fillStyle = f==0 ? '#ff000080' : f==1 ? '#00ff0080' : '#0000ff80';
               if (handPinch[hand] && (f == 0 || handPinch[hand] == f)) {
                  if (f) {
                     ctx.fillStyle = f==1 ? '#ffff0080' : '#ff00ff80';
                     let px = mx * (FT[0][0] + FT[f][0]);
                     let py = my * (FT[0][1] + FT[f][1]);
                     ctx.beginPath();
                     ctx.arc(px, py, 60 * r(FT[0]), 0,2*Math.PI);
                     ctx.fill();
                  }
               }
               else {
                  let p = fingerTip[hand][f];
                  let px = 2 * mx * p[0];
                  let py = 2 * my * p[1];
                  ctx.beginPath();
                  ctx.arc(px, py, 40 * r(p), 0,2*Math.PI);
                  ctx.fill();
               }
            }
         }
   }
   else if (wasTracking) {
      if (isLoggingTracking)
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
let handPinch = [0,0];

