function HandPose() {
   let distance = (a,b) => norm(subtract(a,b));
   let dot = (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
   let norm = a => Math.sqrt(dot(a,a));
   let subtract = (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];

   let poseData = [ {}, {} ];

   this.update = () => {
      if (mediapipe.isRunning) {
         for (let hand = 0 ; hand < 2 ; hand++) {
            let handResults = mediapipe.handResults[hand];
	    if (handResults) {

               let landmarks = handResults.landmarks;
	       let joints = [];
	       for (let n = 0 ; n < landmarks.length ; n++)
	          joints.push([landmarks[n].x, landmarks[n].y, landmarks[n].z]);

               let d = (i,j) => distance(joints[i], joints[j]);

	       let data = poseData[hand];

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
   this.getData = hand => poseData[hand=='left' ? 0 : hand=='right' ? 1 : hand];
}

