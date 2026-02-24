function HandPose() {
   let poseData = [ {}, {} ];

   this.update = () => {
      if (mediapipe.isRunning) {
         console.log(JSON.stringify(mediapipe.handResults));
         for (let hand = 0 ; hand < 2 ; hand++) {
            let handResults = mediapipe.handResults[hand];
	    if (handResults) {

               let landmarks = handResults.landmarks;
	       let joints = [];
	       for (let n = 0 ; n < landmarks.length ; n++)
	          joints.push([landmarks[n].x, landmarks[n].y, landmarks[n].z]);

               let d = (i,j) => norm(subtract(joints[i], joints[j]));

	       let data = poseData[hand];

	       data.hand = handResults.handedness;

	       let X = normalize(subtract(joints[17], joints[5]));
	       let Y = normalize(subtract(joints[ 9], joints[0]));
	       let Z = normalize(cross(X,Y));

               let xx = Math.max(0, 1+X[0]-Y[1]-Z[2]) / 4, x = Math.sqrt(xx) * Math.sign(Y[2] - Z[1]),
                   yy = Math.max(0, 1-X[0]+Y[1]-Z[2]) / 4, y = Math.sqrt(yy) * Math.sign(Z[0] - X[2]),
                   zz = Math.max(0, 1-X[0]-Y[1]+Z[2]) / 4, z = Math.sqrt(zz) * Math.sign(X[1] - Y[0]);

	       data.rigid = [joints[9][0]-.5,.4-joints[9][1],joints[9][2], x,y,z,Math.sqrt(1-xx-yy-zz)];

	       data.curl = data.curl ?? [];
	       for (let f = 0 ; f < 5 ; f++) {
	          let i = 1 + 4*f + (f==0 ? 1 : 0);
	          let j = 1 + 4*f + 3;
		  let sum = 0;
		  for (let k = i ; k < j ; k++)
		     sum += d(k, k+1);
	          data.curl[f] = 1 - d(i, j) / sum;
	       }

	       data.unpinch = data.unpinch ?? [];
	       for (let f = 0 ; f < 5 ; f++)
	          data.unpinch[f] = d(1+4*f+3, 1+3) / d(0, 5);

	       data.spread = Math.max(0, d(1+4*1+3, 1+4*4+3) / d(1+4*1, 1+4*4) - 1);
            }
	    else
	       poseData[hand] = {};
         }
      }
   }
   this.getData = hand => poseData[hand];
}

